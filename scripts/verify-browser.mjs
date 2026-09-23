import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

function getChromePath() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  const candidates = [
    // macOS paths
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    // Linux / Ubuntu 26.04 / Debian paths
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

const CHROME_PATH = getChromePath();
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const SCREENSHOT_DIR = path.resolve('test-screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runBrowserTests() {
  console.log('🚀 Запуск браузерных тестов в реальном браузере Chrome...');
  if (CHROME_PATH) {
    console.log(`   Найден исполняемый файл Chrome: ${CHROME_PATH}`);
  } else {
    console.log('   Исполняемый файл Chrome в стандартных путях не найден, используется системный поиск Puppeteer.');
  }

  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };
  if (CHROME_PATH) {
    launchOptions.executablePath = CHROME_PATH;
  }

  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });

  try {
    // 1. Открытие страницы
    console.log('1. Открытие сайта на 1366x768...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_initial_1366x768.png') });

    const pageTitle = await page.title();
    console.log(`   Заголовок страницы: "${pageTitle}"`);
    if (!pageTitle.includes('Робот и код')) {
      throw new Error('Неверный заголовок страницы');
    }

    // 2. Проверка Задания 1: Режим «По шагам» при неполной программе (Fix 1)
    console.log('2. Проверка режима «По шагам» при неполном маршруте (Fix 1)...');
    // Добавляем только 1 шаг
    await page.keyboard.press('1');
    await new Promise((r) => setTimeout(r, 200));

    // Нажимаем «По шагам»
    await page.click('.btn-step');
    await new Promise((r) => setTimeout(r, 200));

    // Кнопка переключилась в «Следующий шаг»
    let stepBtnText = await page.$eval('.btn-step span', (el) => el.textContent);
    console.log(`   Текст кнопки после входа в пошаговый режим: "${stepBtnText}"`);
    if (!stepBtnText.includes('Следующий шаг')) {
      throw new Error('Кнопка не переключилась в режим «Следующий шаг»');
    }

    // Выполняем 1-й (и последний) шаг
    await page.click('.btn-step');
    await new Promise((r) => setTimeout(r, 300));

    // Проверяем: режим должен сразу завершиться с INCOMPLETE, а кнопка стать доступной
    const stepIncompleteFeedback = await page.$eval('.feedback-message', (el) => el.textContent);
    console.log(`   Ответ после последнего шага: "${stepIncompleteFeedback}"`);
    if (!stepIncompleteFeedback.includes('не дошёл до маяка')) {
      throw new Error('Режим по шагам не вывел INCOMPLETE после выполнения последней команды');
    }

    stepBtnText = await page.$eval('.btn-step span', (el) => el.textContent);
    const stepBtnDisabled = await page.$eval('.btn-step', (el) => el.disabled);
    console.log(`   Состояние кнопки после завершения: текст "${stepBtnText}", disabled=${stepBtnDisabled}`);
    if (stepBtnDisabled) {
      throw new Error('Кнопка «По шагам» осталась заблокированной после завершения шагов!');
    }

    // 3. Проверка автоматической анимации: кнопка «По шагам» должна быть выключена (Fix 2)
    console.log('3. Проверка блокировки кнопки «По шагам» во время автоматической анимации (Fix 2)...');
    await page.click('.clear-button');
    await new Promise((r) => setTimeout(r, 200));

    // Добавляем 3 шага для Задания 1
    await page.keyboard.press('1');
    await page.keyboard.press('1');
    await page.keyboard.press('1');
    await new Promise((r) => setTimeout(r, 200));

    // Запускаем авто-выполнение
    await page.click('.btn-primary-run');
    // Сразу проверяем состояние кнопки «По шагам»
    const isStepDisabledDuringRun = await page.$eval('.btn-step', (el) => el.disabled);
    console.log(`   Кнопка «По шагам» выключена во время авто-запуска: ${isStepDisabledDuringRun}`);
    if (!isStepDisabledDuringRun) {
      throw new Error('Кнопка «По шагам» не была выключена во время автоматического выполнения!');
    }

    // Ждём завершения анимации Задания 1
    await new Promise((r) => setTimeout(r, 2200));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_mission1_success.png') });

    const feedbackSuccess = await page.$eval('.feedback-message', (el) => el.textContent);
    console.log(`   Результат Задания 1: "${feedbackSuccess}"`);
    if (!feedbackSuccess.includes('Маяк достигнут')) {
      throw new Error('Задание 1 не завершилось успехом');
    }

    // 4. Проверка Задания 2: Столкновение со стеной и обход
    console.log('4. Проверка Задания 2: переключение и столкновение...');
    await page.click('#tab-mission-2');
    await new Promise((r) => setTimeout(r, 300));

    const wallExists = await page.$('.cell-obstacle');
    if (!wallExists) throw new Error('Препятствие "Стена" не найдено на поле Задания 2');

    // Пробуем шагнуть прямо в стену
    await page.keyboard.press('1');
    await page.click('.btn-primary-run');
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_mission2_wall_collision.png') });

    const wallFeedback = await page.$eval('.feedback-message', (el) => el.textContent);
    console.log(`   Ответ при столкновении: "${wallFeedback}"`);
    if (!wallFeedback.includes('упёрся в стену')) {
      throw new Error('Столкновение со стеной не распознано или не выведено объяснение');
    }

    // Строим обход
    console.log('   Построение обхода препятствия через верх...');
    await page.click('.clear-button');
    await new Promise((r) => setTimeout(r, 200));

    await page.keyboard.press('2'); // TURN_LEFT
    await page.keyboard.press('1'); // STEP
    await page.keyboard.press('3'); // TURN_RIGHT
    await page.keyboard.press('1'); // STEP
    await page.keyboard.press('1'); // STEP
    await page.keyboard.press('3'); // TURN_RIGHT
    await page.keyboard.press('1'); // STEP
    await new Promise((r) => setTimeout(r, 200));

    await page.click('.btn-primary-run');
    await new Promise((r) => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_mission2_bypass_success.png') });

    const bypassFeedback = await page.$eval('.feedback-message', (el) => el.textContent);
    console.log(`   Результат обхода: "${bypassFeedback}"`);
    if (!bypassFeedback.includes('Маяк достигнут')) {
      throw new Error('Обход препятствия в Задании 2 не увенчался успехом');
    }

    // 5. Проверка Задания 3: исправление и отладка
    console.log('5. Проверка Задания 3: заготовка и исправление ошибки...');
    await page.click('#tab-mission-3');
    await new Promise((r) => setTimeout(r, 300));

    const m3Items = await page.$$eval('.program-item', (els) => els.length);
    if (m3Items !== 3) throw new Error('Заготовка Задания 3 не содержит 3 команды');

    // Запускаем ошибочную программу
    await page.click('.btn-primary-run');
    await new Promise((r) => setTimeout(r, 2200));

    const m3FailFeedback = await page.$eval('.feedback-message', (el) => el.textContent);
    if (!m3FailFeedback.includes('не дошёл до маяка')) {
      throw new Error('Ошибочная программа не зафиксировала неполный маршрут');
    }

    // Удаляем лишнюю команду (поворот налево)
    const deleteButtons = await page.$$('.item-btn-delete');
    await deleteButtons[1].click();
    await new Promise((r) => setTimeout(r, 300));

    // Запускаем исправленную программу: [STEP, STEP]
    await page.click('.btn-primary-run');
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_mission3_fixed_success.png') });

    const m3FixedFeedback = await page.$eval('.feedback-message', (el) => el.textContent);
    console.log(`   Результат Задания 3 после исправления: "${m3FixedFeedback}"`);
    if (!m3FixedFeedback.includes('Маяк достигнут')) {
      throw new Error('Исправленная программа не достигла цели');
    }

    // Теперь, поскольку пройдены ВСЕ три миссии (1, 2, 3), кнопка должна предлагать завершить урок:
    const finalNextBtnText = await page.$eval('.btn-next-mission', (el) => el.textContent);
    console.log(`   Текст кнопки после прохождения всех 3 миссий: "${finalNextBtnText}"`);
    if (!finalNextBtnText.includes('Завершить урок и рефлексия')) {
      throw new Error('Кнопка не предлагает завершить урок после прохождения всех 3 миссий');
    }

    // Нажимаем «Завершить урок и рефлексия» и проверяем модальное окно
    await page.click('.btn-next-mission');
    await new Promise((r) => setTimeout(r, 400));

    const finalModalTitle = await page.$eval('#roadmap-modal-title', (el) => el.textContent);
    console.log(`   Заголовок финального окна: "${finalModalTitle}"`);
    if (!finalModalTitle.includes('Урок завершён')) {
      throw new Error('Заголовок окна не содержит «Урок завершён»');
    }

    const reflectionExists = await page.$('.reflection-banner');
    if (!reflectionExists) {
      throw new Error('Блок вопросов для рефлексии отсутствует в финальном окне');
    }
    console.log('   Вопросы рефлексии корректно отображаются');

    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 300));

    // 6. Проверка случая «Пользователь сразу открыл миссию 3» (Fix 3)
    console.log('6. Проверка случая, когда пользователь сразу решает только миссию 3 (Fix 3)...');
    // Очищаем localStorage, чтобы миссии 1 и 2 не были пройдены
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 400));

    // Переходим сразу на Задание 3
    await page.click('#tab-mission-3');
    await new Promise((r) => setTimeout(r, 300));

    // Исправляем миссию 3
    const m3ButtonsDirect = await page.$$('.item-btn-delete');
    await m3ButtonsDirect[1].click();
    await new Promise((r) => setTimeout(r, 300));

    // Запускаем
    await page.click('.btn-primary-run');
    await new Promise((r) => setTimeout(r, 2000));

    // Проверяем: кнопка НЕ должна говорить «Завершить урок», а должна вести к невыполненному заданию 1!
    const partialNextBtnText = await page.$eval('.btn-next-mission', (el) => el.textContent);
    console.log(`   Текст кнопки при решении ТОЛЬКО задания 3: "${partialNextBtnText}"`);
    if (partialNextBtnText.includes('Завершить урок')) {
      throw new Error('ОШИБКА: Завершение урока показано, когда пройдены не все 3 миссии!');
    }
    if (!partialNextBtnText.includes('Перейти к заданию 1')) {
      throw new Error('Кнопка должна предлагать перейти к невыполненному заданию 1');
    }

    // Открываем модальное окно «План курса» через шапку:
    await page.click('button[aria-label="Открыть дорожную карту курса"]');
    await new Promise((r) => setTimeout(r, 400));

    const directModalTitle = await page.$eval('#roadmap-modal-title', (el) => el.textContent);
    console.log(`   Заголовок модального окна дорожной карты: "${directModalTitle}"`);
    if (directModalTitle.includes('Урок завершён')) {
      throw new Error('ОШИБКА: Заголовок содержит «Урок завершён», хотя миссии 1 и 2 не пройдены!');
    }

    const reflectionBox = await page.$('.reflection-banner');
    if (reflectionBox !== null) {
      throw new Error('ОШИБКА: Вопросы рефлексии показаны до прохождения всех 3 миссий!');
    }
    console.log('   Подтверждено: вопросы рефлексии скрыты, пока не пройдены все 3 миссии');

    // Проверяем формулировку конечного умения и первых тем
    const goalText = await page.$eval('.goal-main-text', (el) => el.textContent);
    console.log(`   Конечное умение в дорожной карте: "${goalText}"`);
    if (!goalText.includes('самостоятельно придумать, написать, проверить и объяснить небольшую программу или устройство')) {
      throw new Error('Конечное умение курса не отображается в дорожной карте');
    }
    if (!goalText.includes('далее C, Arduino, компьютер и сеть')) {
      throw new Error('Упоминание C, Arduino, компьютера и сети отсутствует');
    }

    const goalSubtext = await page.$eval('.goal-subtext', (el) => el.textContent);
    console.log(`   Пояснение о первых темах: "${goalSubtext}"`);
    if (!goalSubtext.includes('первые темы и разведочный маршрут более длинного курса')) {
      throw new Error('Пояснение о первых темах более длинного курса отсутствует');
    }

    const firstTopicBadge = await page.$eval('.lesson-num', (el) => el.textContent);
    console.log(`   Обозначение пункта в сетке: "${firstTopicBadge}"`);
    if (!firstTopicBadge.includes('Тема 1')) {
      throw new Error('Пункты дорожной карты не названы темами');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_roadmap_modal.png') });

    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 300));

    // 7. Проверка модального окна "Показать код"
    console.log('7. Проверка модального окна «Показать код»...');
    await page.click('button[aria-label="Показать текстовый вид программы"]');
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_code_modal.png') });

    const modalTitle = await page.$eval('#code-modal-title', (el) => el.textContent);
    const badgeText = await page.$eval('.badge-honest', (el) => el.textContent);
    console.log(`   Заголовок: "${modalTitle}", бейдж: "${badgeText}"`);
    if (!badgeText.includes('Похоже на код')) {
      throw new Error('Честный бейдж «Похоже на код» отсутствует');
    }
    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 300));

    // 8. Проверка панели преподавателя
    console.log('8. Проверка панели преподавателя...');
    await page.click('.teacher-toggle-btn');
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_teacher_drawer.png') });

    const teacherHeader = await page.$eval('.drawer-title', (el) => el.textContent);
    if (!teacherHeader.includes('Методическая шпаргалка')) {
      throw new Error('Панель преподавателя не открылась');
    }
    await page.click('.drawer-close-btn');
    await new Promise((r) => setTimeout(r, 300));

    // 9. Проверка мобильной верстки (375x667)
    console.log('9. Проверка мобильной верстки (375x667)...');
    await page.setViewport({ width: 375, height: 667 });
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_mobile_375x667.png') });

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    console.log(`   Горизонтальная прокрутка на 375px: ${hasHorizontalOverflow ? 'ОБНАРУЖЕНА!' : 'Отсутствует (ОК)'}`);
    if (hasHorizontalOverflow) {
      throw new Error('Обнаружен горизонтальный скролл на мобильном экране');
    }

    console.log('✅ Все проверки и целевые исправления подтверждены браузером!');
  } finally {
    await browser.close();
  }
}

runBrowserTests().catch((err) => {
  console.error('❌ Ошибка во время проверки в браузере:', err);
  process.exit(1);
});
