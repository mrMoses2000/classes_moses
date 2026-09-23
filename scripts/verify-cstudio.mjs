import puppeteer from 'puppeteer';

const LOCAL_URL = 'http://localhost:5173';
const REMOTE_URL = 'https://constitutional-auckland-shape-west.trycloudflare.com';

async function runCStudioVerification() {
  console.log('🚀 Запуск браузерной проверки среды CStudio и конвейера компиляции в Google Chrome...');

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    console.log(`1. Открытие локального стенда ${LOCAL_URL}...`);
    await page.goto(LOCAL_URL, { waitUntil: 'networkidle0' });

    // 2. Проверка переключателя режимов (Блоки / Си)
    console.log('2. Проверка наличия переключателя режимов (#tab-mode-blocks, #tab-mode-code)...');
    const hasBlocksBtn = await page.$('#tab-mode-blocks');
    const hasCodeBtn = await page.$('#tab-mode-code');
    if (!hasBlocksBtn || !hasCodeBtn) {
      throw new Error('Кнопки переключения режимов не найдены в DOM!');
    }

    // 3. Переключение в режим Си (IDE)
    console.log('3. Переключение в режим «Редактор Си (IDE)»...');
    await page.click('#tab-mode-code');
    await new Promise((r) => setTimeout(r, 200));

    const isStudioVisible = await page.$('.cstudio-container');
    if (!isStudioVisible) {
      throw new Error('Контейнер CStudio не отобразился после переключения в режим кода!');
    }

    // 4. Проверка текстового поля редактора
    console.log('4. Проверка содержимого редактора CStudio...');
    const initialCode = await page.$eval('.cstudio-textarea', (el) => el.value);
    console.log(`   Начальный код в редакторе содержит ${initialCode.split('\n').length} строк`);
    if (!initialCode.includes('void run_mission()') || !initialCode.includes('#include <robot.h>')) {
      throw new Error('Начальный C-код не содержит базового шаблона run_mission() или robot.h!');
    }

    // 5. Тестирование ошибки синтаксиса (пропущенная точка с запятой)
    console.log('5. Тест детекции ошибки компиляции (пропущенная точка с запятой)...');
    const brokenCode = `#include <robot.h>

void run_mission() {
    step()
    turn_left();
}`;
    await page.click('.cstudio-textarea');
    await page.evaluate((codeToSet) => {
      const textarea = document.querySelector('.cstudio-textarea');
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      nativeSetter.call(textarea, codeToSet);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    }, brokenCode);

    // Нажимаем только компиляцию
    await page.click('.btn-compile-only');
    await new Promise((r) => setTimeout(r, 400));

    // Проверяем баннер ошибки
    const errorHeadline = await page.$eval('.error-headline', (el) => el.textContent);
    console.log(`   Результат компилятора: "${errorHeadline}"`);
    if (!errorHeadline.includes('строке 4')) {
      throw new Error(`Ожидалась ошибка на строке 4, получено: "${errorHeadline}"`);
    }
    const tipText = await page.$eval('.error-tip-text', (el) => el.textContent);
    console.log(`   Подсказка ученику: "${tipText}"`);
    if (!tipText.toLowerCase().includes('точк')) {
      throw new Error('Подсказка не содержит информации о точке с запятой!');
    }

    // 6. Тестирование функции с координатами move_to(x, y) и кастомной функции
    console.log('6. Тест собственной функции с координатами: deliver_cargo(3, 2)...');
    const validCoordCode = `#include <robot.h>

// Собственная функция с координатами
void deliver_cargo(int x, int y) {
    move_to(x, y);
}

void run_mission() {
    deliver_cargo(3, 2);
}
`;
    await page.evaluate((codeToSet) => {
      const textarea = document.querySelector('.cstudio-textarea');
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      nativeSetter.call(textarea, codeToSet);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    }, validCoordCode);

    // Нажимаем «Скомпилировать и запустить»
    console.log('   Нажатие «Скомпилировать и запустить»...');
    await page.click('.btn-compile-main');
    await new Promise((r) => setTimeout(r, 600));

    // Проверяем баннер успешной компиляции
    const successBanner = await page.$eval('.compiler-success-banner', (el) => el.textContent);
    console.log(`   Статус компиляции: "${successBanner}"`);
    if (!successBanner.includes('Сборка успешна')) {
      throw new Error(`Компиляция не удалась! Текст: "${successBanner}"`);
    }

    // 7. Проверка 4 этапов компиляции (Preprocessor, Compiler, Assembler, Linker)
    console.log('7. Проверка инспектора 4 этапов компиляции...');

    // Этап 1: Препроцессор
    await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll('.stage-pill'));
      const p = pills.find((el) => el.textContent.includes('Препроцессор'));
      if (p) p.click();
    });
    await new Promise((r) => setTimeout(r, 150));
    const preprocTitle = await page.$eval('.artifact-filename', (el) => el.textContent);
    console.log(`   Вкладка препроцессора: "${preprocTitle}"`);
    if (!preprocTitle.includes('main.i')) throw new Error('Вкладка препроцессора не открылась!');

    // Этап 2: Ассемблер
    await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll('.stage-pill'));
      const p = pills.find((el) => el.textContent.includes('Ассемблер (.s)'));
      if (p) p.click();
    });
    await new Promise((r) => setTimeout(r, 150));
    const asmCode = await page.$eval('.artifact-code code', (el) => el.textContent);
    console.log(`   Ассемблерный код содержит вызовы: ${asmCode.includes('bl move_to') ? 'bl move_to (ОК)' : 'НЕТ'}`);
    if (!asmCode.includes('bl move_to')) throw new Error('Ассемблерный листинг не содержит вызова bl move_to!');

    // Этап 3: Байткод
    await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll('.stage-pill'));
      const p = pills.find((el) => el.textContent.includes('Байткод (.o)'));
      if (p) p.click();
    });
    await new Promise((r) => setTimeout(r, 150));
    const byteFilename = await page.$eval('.artifact-filename', (el) => el.textContent);
    if (!byteFilename.includes('main.o')) throw new Error('Вкладка байткода main.o не открылась!');

    // Этап 4: Прошивка
    await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll('.stage-pill'));
      const p = pills.find((el) => el.textContent.includes('Прошивка (.hex)'));
      if (p) p.click();
    });
    await new Promise((r) => setTimeout(r, 150));
    const hexFilename = await page.$eval('.artifact-filename', (el) => el.textContent);
    if (!hexFilename.includes('firmware.hex')) throw new Error('Вкладка прошивки firmware.hex не открылась!');

    // 8. Ожидание завершения симуляции движения робота на сетке
    console.log('8. Ожидание выполнения программы роботом на игровом поле...');
    await page.waitForFunction(
      () => {
        const feedback = document.querySelector('.feedback-message');
        return feedback && feedback.textContent.includes('Маяк достигнут');
      },
      { timeout: 7000 }
    );
    const feedbackResult = await page.$eval('.feedback-message', (el) => el.textContent);
    console.log(`   Результат симуляции робота: "${feedbackResult}"`);

    // 9. Проверка мобильной верстки (375x667)
    console.log('9. Проверка мобильной верстки (375x667) со средой CStudio...');
    await page.setViewport({ width: 375, height: 667 });
    await new Promise((r) => setTimeout(r, 300));
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    console.log(`   Ширина документа: ${scrollWidth}px (вьюпорт: 375px). Переполнение: ${isOverflowing ? 'ЕСТЬ (ОШИБКА)' : 'НЕТ (ОК)'}`);
    if (isOverflowing) {
      throw new Error(`Обнаружен горизонтальный скролл на 375px: ${scrollWidth}px!`);
    }

    // 10. Проверка удалённого доступа через Cloudflare Tunnel
    console.log(`10. Проверка удаленного туннеля ${REMOTE_URL}...`);
    await page.goto(REMOTE_URL, { waitUntil: 'networkidle0', timeout: 15000 });
    const hasRemoteCodeTab = await page.$('#tab-mode-code');
    console.log(`   Кнопка переключения в режим Си доступна удаленно: ${hasRemoteCodeTab ? 'ДА (ОК)' : 'НЕТ'}`);
    if (!hasRemoteCodeTab) {
      throw new Error('Кнопка режима Си не найдена через удалённый туннель!');
    }

    console.log('🎉 ВСЕ ПРОВЕРКИ СРЕДЫ CSTUDIO, КОМПИЛЯЦИИ, ЭТАПОВ И КООРДИНАТ УСПЕШНО ПРОЙДЕНЫ!');
  } finally {
    await browser.close();
  }
}

runCStudioVerification().catch((err) => {
  console.error('❌ Ошибка проверки:', err.message);
  process.exit(1);
});
