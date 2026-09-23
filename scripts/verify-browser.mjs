import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import http from 'http';

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
const DEFAULT_PORT = 4174;
const BASE_URL = process.env.BASE_URL || `http://localhost:${DEFAULT_PORT}`;
const SCREENSHOT_DIR = path.resolve('test-screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function checkServerReady(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureServerRunning() {
  const isRunning = await checkServerReady(BASE_URL);
  if (isRunning) {
    console.log(`📡 Сервер уже запущен по адресу: ${BASE_URL}`);
    return null;
  }

  console.log(`⚙️ Запуск локального preview-сервера на порту ${DEFAULT_PORT}...`);
  const serverProcess = spawn('npx', ['vite', 'preview', '--port', String(DEFAULT_PORT)], {
    stdio: 'ignore',
    detached: true,
  });

  // Wait for server to become responsive
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 300));
    if (await checkServerReady(BASE_URL)) {
      console.log(`✅ Preview-сервер успешно запущен: ${BASE_URL}`);
      return serverProcess;
    }
  }

  throw new Error(`Не удалось запустить preview-сервер на ${BASE_URL}`);
}

async function runBrowserTests() {
  console.log('🚀 Запуск комплексных браузерных тестов в Chrome...');
  if (CHROME_PATH) {
    console.log(`   Найден исполняемый файл Chrome: ${CHROME_PATH}`);
  } else {
    console.log('   Исполняемый файл Chrome в стандартных путях не найден, используется поиск Puppeteer.');
  }

  const serverProcess = await ensureServerRunning();

  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };
  if (CHROME_PATH) {
    launchOptions.executablePath = CHROME_PATH;
  }

  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();

  try {
    // =========================================================================
    // 1. Проверка Главной страницы (Desktop 1366x768 и 1440x900)
    // =========================================================================
    console.log('\n--- 1. Проверка Главной страницы (Desktop 1366x768) ---');
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_homepage_desktop_1366x768.png'), fullPage: true });

    const pageTitle = await page.title();
    console.log(`   Заголовок страницы: "${pageTitle}"`);
    if (!pageTitle.includes('Робот и код')) {
      throw new Error(`Неверный заголовок страницы: ${pageTitle}`);
    }

    // Проверка H1 и обещания
    const heroTitle = await page.$eval('.hero-title', (el) => el.textContent.trim());
    console.log(`   Главный заголовок H1: "${heroTitle}"`);
    if (!heroTitle.includes('Ученик учится думать, писать и проверять программу')) {
      throw new Error('Главный заголовок не соответствует продуктовому брифу');
    }

    // Проверка метрик
    const metricsCount = await page.$$eval('.metric-item', (els) => els.length);
    console.log(`   Количество блоков метрик в Hero: ${metricsCount}`);
    if (metricsCount !== 3) {
      throw new Error('Ожидалось 3 метрики в блоке Hero');
    }

    // Проверка живой витрины первого задания на главной
    console.log('   Проверка интерактивности витрины симулятора на главной...');
    const showcaseExists = await page.$('.hero-showcase-container');
    if (!showcaseExists) throw new Error('Живая витрина первого задания не найдена');

    // Кликаем «Запустить» в витрине
    await page.click('.hero-showcase-container .btn-run');
    await new Promise((r) => setTimeout(r, 1600));

    const showcaseFeedback = await page.$eval(
      '.hero-showcase-container .showcase-feedback',
      (el) => el.textContent
    );
    console.log(`   Отклик витрины после запуска: "${showcaseFeedback}"`);
    if (!showcaseFeedback.includes('Маяк достигнут')) {
      throw new Error('Интерактивная витрина на главной не завершилась успехом');
    }

    // Проверка 4 шагов методики
    console.log('   Проверка секции «Как устроено обучение: 4 шага»...');
    const stepCards = await page.$$eval('.step-card', (els) => els.map((el) => el.textContent));
    console.log(`   Найдено шагов методики: ${stepCards.length}`);
    if (stepCards.length !== 4) throw new Error('Ожидалось 4 шага методики');
    if (!stepCards[0].includes('Предсказал') || !stepCards[1].includes('Запустил') ||
        !stepCards[2].includes('Нашёл ошибку') || !stepCards[3].includes('Объяснил')) {
      throw new Error('Шаги методики не содержат ожидаемые названия');
    }

    // Проверка блока конкретного примера из урока
    const caseTitle = await page.$eval('.case-title', (el) => el.textContent);
    console.log(`   Конкретный пример из практики: "${caseTitle}"`);
    if (!caseTitle.includes('Задание 3')) {
      throw new Error('Пример из урока не содержит ссылку на задание');
    }

    // Проверка направлений курса (4 направления)
    console.log('   Проверка секции маршрута: 4 направления...');
    const tracks = await page.$$eval('.track-card', (els) =>
      els.map((el) => el.querySelector('.track-card-title')?.textContent?.trim())
    );
    console.log(`   Направления курса (${tracks.length}):`, tracks.join(', '));
    if (tracks.length !== 4) throw new Error('Ожидалось 4 направления курса');

    // Проверка 12 пунктов разведочного маршрута в таблице
    const lessonRowsCount = await page.$$eval('.lesson-row', (els) => els.length);
    console.log(`   Пунктов в таблице разведочного маршрута: ${lessonRowsCount}`);
    if (lessonRowsCount !== 12) throw new Error('Ожидалось 12 пунктов разведочного маршрута');

    const availableBadges = await page.$$eval('.badge-status-online', (els) => els.length);
    console.log(`   Уроков со статусом «Доступно онлайн»: ${availableBadges}`);
    if (availableBadges !== 1) {
      throw new Error('Только 1 урок должен быть обозначен как доступный онлайн сейчас');
    }

    // Проверка преподавателя
    console.log('   Проверка секции преподавателя...');
    const teacherName = await page.$eval('.teacher-name', (el) => el.textContent.trim());
    const teacherRole = await page.$eval('.teacher-role', (el) => el.textContent.trim());
    console.log(`   Преподаватель: "${teacherName}" — "${teacherRole}"`);
    if (!teacherName.includes('Моисей Василенко') || !teacherRole.includes('C/C++')) {
      throw new Error('Блок преподавателя заполнен некорректно');
    }

    // Проверка GitHub-ссылки в футере
    const githubLink = await page.$eval('.github-repo-link', (el) => el.href);
    console.log(`   Ссылка на GitHub: ${githubLink}`);
    if (!githubLink.includes('github.com') || !githubLink.includes('classes_moses')) {
      throw new Error('Ссылка на GitHub некорректна');
    }

    // =========================================================================
    // 2. Проверка перехода в Мастерскую через основной CTA
    // =========================================================================
    console.log('\n--- 2. Переход в Мастерскую через основной CTA ---');
    await page.click('.btn-primary-cta');
    await new Promise((r) => setTimeout(r, 400));

    const currentUrl = page.url();
    console.log(`   Текущий URL после клика CTA: ${currentUrl}`);
    if (!currentUrl.includes('/workshop')) {
      throw new Error('URL не переключился на /workshop');
    }

    const workshopGridExists = await page.$('.grid-container');
    if (!workshopGridExists) throw new Error('Мастерская не отобразилась после перехода');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_workshop_desktop_1366x768.png') });

    // Проверка возврата на главную через «← О курсе»
    console.log('   Проверка кнопки «← О курсе» в шапке мастерской...');
    await page.click('.header-home-btn');
    await new Promise((r) => setTimeout(r, 400));

    const backUrl = page.url();
    console.log(`   URL после возврата: ${backUrl}`);
    const isBackOnHome = await page.$('.hero-title');
    if (!isBackOnHome) throw new Error('Возврат на главную не сработал');

    // =========================================================================
    // 3. Прямое открытие стабильного URL /workshop и обновление F5
    // =========================================================================
    console.log('\n--- 3. Прямое открытие /workshop и перезагрузка страницы ---');
    await page.goto(`${BASE_URL}/workshop`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 300));

    let workshopHeader = await page.$('.mission-nav');
    if (!workshopHeader) throw new Error('Прямое открытие /workshop не загрузило мастерскую');
    console.log('   Прямое открытие /workshop: успешно');

    // Перезагрузка страницы (F5)
    await page.reload({ waitUntil: 'networkidle0' });
    workshopHeader = await page.$('.mission-nav');
    if (!workshopHeader) throw new Error('Перезагрузка /workshop потеряла мастерскую');
    console.log('   Перезагрузка F5 на /workshop: успешно сохранена мастерская');

    // =========================================================================
    // 4. Прохождение миссий 1, 2, 3 и полная функциональность симулятора
    // =========================================================================
    console.log('\n--- 4. Прохождение интерактивных миссий первого урока ---');

    // 4.1 Режим «По шагам» при неполной программе (Fix 1)
    console.log('4.1 Режим «По шагам» при неполном маршруте (Fix 1)...');
    await page.keyboard.press('1');
    await new Promise((r) => setTimeout(r, 150));

    await page.click('.btn-step');
    await new Promise((r) => setTimeout(r, 150));

    let stepBtnText = await page.$eval('.btn-step span', (el) => el.textContent);
    if (!stepBtnText.includes('Следующий шаг')) {
      throw new Error('Кнопка не переключилась в режим «Следующий шаг»');
    }

    await page.click('.btn-step');
    await new Promise((r) => setTimeout(r, 250));

    const stepIncompleteFeedback = await page.$eval('.feedback-message', (el) => el.textContent);
    if (!stepIncompleteFeedback.includes('не дошёл до маяка')) {
      throw new Error('Режим по шагам не зафиксировал незавершённый маршрут');
    }
    const stepBtnDisabled = await page.$eval('.btn-step', (el) => el.disabled);
    if (stepBtnDisabled) {
      throw new Error('Кнопка «По шагам» осталась заблокированной после завершения шагов!');
    }

    // 4.2 Проверка блокировки кнопки «По шагам» во время автоматической анимации (Fix 2)
    console.log('4.2 Блокировка кнопки «По шагам» во время авто-запуска (Fix 2)...');
    await page.click('.clear-button');
    await new Promise((r) => setTimeout(r, 150));

    // Добавляем 3 шага для Задания 1
    await page.keyboard.press('1');
    await page.keyboard.press('1');
    await page.keyboard.press('1');
    await new Promise((r) => setTimeout(r, 150));

    await page.click('.btn-primary-run');
    const isStepDisabledDuringRun = await page.$eval('.btn-step', (el) => el.disabled);
    if (!isStepDisabledDuringRun) {
      throw new Error('Кнопка «По шагам» не была выключена во время автоматического выполнения!');
    }

    await new Promise((r) => setTimeout(r, 2200));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_mission1_success.png') });

    const feedbackSuccess = await page.$eval('.feedback-message', (el) => el.textContent);
    console.log(`   Результат Задания 1: "${feedbackSuccess}"`);
    if (!feedbackSuccess.includes('Маяк достигнут')) {
      throw new Error('Задание 1 не завершилось успехом');
    }

    // 4.3 Проверка Задания 2: Столкновение со стеной и обход
    console.log('4.3 Задание 2: столкновение и обход...');
    await page.click('#tab-mission-2');
    await new Promise((r) => setTimeout(r, 250));

    const wallExists = await page.$('.cell-obstacle');
    if (!wallExists) throw new Error('Препятствие "Стена" не найдено на поле Задания 2');

    await page.keyboard.press('1');
    await page.click('.btn-primary-run');
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_mission2_wall_collision.png') });

    const wallFeedback = await page.$eval('.feedback-message', (el) => el.textContent);
    console.log(`   Ответ при столкновении: "${wallFeedback}"`);
    if (!wallFeedback.includes('упёрся в стену')) {
      throw new Error('Столкновение со стеной не распознано');
    }

    // Строим обход
    await page.click('.clear-button');
    await new Promise((r) => setTimeout(r, 150));

    await page.keyboard.press('2'); // TURN_LEFT
    await page.keyboard.press('1'); // STEP
    await page.keyboard.press('3'); // TURN_RIGHT
    await page.keyboard.press('1'); // STEP
    await page.keyboard.press('1'); // STEP
    await page.keyboard.press('3'); // TURN_RIGHT
    await page.keyboard.press('1'); // STEP
    await new Promise((r) => setTimeout(r, 150));

    await page.click('.btn-primary-run');
    await new Promise((r) => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_mission2_bypass_success.png') });

    const bypassFeedback = await page.$eval('.feedback-message', (el) => el.textContent);
    console.log(`   Результат обхода Задания 2: "${bypassFeedback}"`);
    if (!bypassFeedback.includes('Маяк достигнут')) {
      throw new Error('Обход препятствия в Задании 2 не увенчался успехом');
    }

    // 4.4 Проверка Задания 3: исправление и отладка
    console.log('4.4 Задание 3: отладка программы...');
    await page.click('#tab-mission-3');
    await new Promise((r) => setTimeout(r, 250));

    const m3Items = await page.$$eval('.program-item', (els) => els.length);
    if (m3Items !== 3) throw new Error('Заготовка Задания 3 не содержит 3 команды');

    await page.click('.btn-primary-run');
    await new Promise((r) => setTimeout(r, 2200));

    const m3FailFeedback = await page.$eval('.feedback-message', (el) => el.textContent);
    if (!m3FailFeedback.includes('не дошёл до маяка')) {
      throw new Error('Ошибочная программа не зафиксировала неполный маршрут');
    }

    // Удаляем ошибочную команду (TURN_LEFT)
    const deleteButtons = await page.$$('.item-btn-delete');
    await deleteButtons[1].click();
    await new Promise((r) => setTimeout(r, 250));

    await page.click('.btn-primary-run');
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_mission3_fixed_success.png') });

    const m3FixedFeedback = await page.$eval('.feedback-message', (el) => el.textContent);
    console.log(`   Результат Задания 3 после исправления: "${m3FixedFeedback}"`);
    if (!m3FixedFeedback.includes('Маяк достигнут')) {
      throw new Error('Исправленная программа не достигла цели');
    }

    // Проверяем завершение урока (все 3 пройдены)
    const finalNextBtnText = await page.$eval('.btn-next-mission', (el) => el.textContent);
    console.log(`   Текст кнопки после прохождения всех 3 миссий: "${finalNextBtnText}"`);
    if (!finalNextBtnText.includes('Завершить урок и рефлексия')) {
      throw new Error('Кнопка не предлагает завершить урок после прохождения всех 3 миссий');
    }

    await page.click('.btn-next-mission');
    await new Promise((r) => setTimeout(r, 350));

    const finalModalTitle = await page.$eval('#roadmap-modal-title', (el) => el.textContent);
    console.log(`   Заголовок финального модального окна: "${finalModalTitle}"`);
    if (!finalModalTitle.includes('Урок завершён')) {
      throw new Error('Заголовок окна не содержит «Урок завершён»');
    }

    const reflectionExists = await page.$('.reflection-banner');
    if (!reflectionExists) throw new Error('Блок рефлексии отсутствует в финальном окне');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_roadmap_modal_reflection.png') });
    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 250));

    // =========================================================================
    // 5. Проверка модальных окон (Код, Преподаватель)
    // =========================================================================
    console.log('\n--- 5. Проверка инструментов («Показать код», шпаргалка преподавателя) ---');
    await page.click('button[aria-label="Показать текстовый вид программы"]');
    await new Promise((r) => setTimeout(r, 300));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_code_modal.png') });

    const badgeText = await page.$eval('.badge-honest', (el) => el.textContent);
    if (!badgeText.includes('Похоже на код')) {
      throw new Error('Честный бейдж «Похоже на код» отсутствует');
    }
    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 250));

    await page.click('.teacher-toggle-btn');
    await new Promise((r) => setTimeout(r, 300));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_teacher_drawer.png') });

    const teacherHeader = await page.$eval('.drawer-title', (el) => el.textContent);
    if (!teacherHeader.includes('Методическая шпаргалка')) {
      throw new Error('Панель преподавателя не открылась');
    }
    await page.click('.drawer-close-btn');
    await new Promise((r) => setTimeout(r, 250));

    // =========================================================================
    // 6. Проверка Мобильной адаптивности (390x844 и 375x667)
    // =========================================================================
    console.log('\n--- 6. Проверка мобильной верстки и отсутствия горизонтальной прокрутки ---');

    // 6.1 Viewport 390x844 (современный мобильный)
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 300));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_landing_mobile_390x844.png'), fullPage: true });

    let hasHomeOverflow390 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`   Горизонтальная прокрутка Главной на 390px: ${hasHomeOverflow390 ? 'ОБНАРУЖЕНА!' : 'Отсутствует (ОК)'}`);
    if (hasHomeOverflow390) throw new Error('Обнаружен горизонтальный скролл на главной (390px)');

    await page.goto(`${BASE_URL}/workshop`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 300));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_workshop_mobile_390x844.png') });

    let hasWorkshopOverflow390 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`   Горизонтальная прокрутка Мастерской на 390px: ${hasWorkshopOverflow390 ? 'ОБНАРУЖЕНА!' : 'Отсутствует (ОК)'}`);
    if (hasWorkshopOverflow390) throw new Error('Обнаружен горизонтальный скролл в мастерской (390px)');

    // 6.2 Viewport 375x667 (компактный мобильный)
    await page.setViewport({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 300));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_landing_mobile_375x667.png'), fullPage: true });

    let hasHomeOverflow375 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`   Горизонтальная прокрутка Главной на 375px: ${hasHomeOverflow375 ? 'ОБНАРУЖЕНА!' : 'Отсутствует (ОК)'}`);
    if (hasHomeOverflow375) throw new Error('Обнаружен горизонтальный скролл на главной (375px)');

    await page.goto(`${BASE_URL}/workshop`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 300));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_workshop_mobile_375x667.png') });

    let hasWorkshopOverflow375 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`   Горизонтальная прокрутка Мастерской на 375px: ${hasWorkshopOverflow375 ? 'ОБНАРУЖЕНА!' : 'Отсутствует (ОК)'}`);
    if (hasWorkshopOverflow375) throw new Error('Обнаружен горизонтальный скролл в мастерской (375px)');

    // =========================================================================
    // 7. Проверка контрастности (WCAG 2.2 AA)
    // =========================================================================
    console.log('\n--- 7. Фактическое измерение контраста (WCAG 2.2 AA) ---');
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });

    const contrastResults = await page.evaluate(() => {
      function parseRgb(colorStr) {
        const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!match) return { r: 0, g: 0, b: 0 };
        return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
      }

      function getLuminance(r, g, b) {
        const a = [r, g, b].map((v) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
      }

      function getContrastRatio(rgb1, rgb2) {
        const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
        const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
      }

      const elementsToCheck = [
        { selector: '.hero-title', name: 'Hero Заголовок' },
        { selector: '.hero-lead', name: 'Hero Подзаголовок' },
        { selector: '.btn-primary-cta', name: 'Кнопка действия (CTA)' },
        { selector: '.section-title', name: 'Заголовок секции' },
        { selector: '.step-card-title', name: 'Заголовок шага методики' },
        { selector: '.step-card-desc', name: 'Текст описания шага' },
        { selector: '.teacher-name', name: 'Имя преподавателя' },
        { selector: '.teacher-role', name: 'Должность преподавателя' },
      ];

      return elementsToCheck.map((item) => {
        const el = document.querySelector(item.selector);
        if (!el) return { name: item.name, ratio: 'N/A', pass: false };

        const style = window.getComputedStyle(el);
        const color = parseRgb(style.color);

        // Find effective background
        let bgEl = el;
        let bgStyle = style;
        while (bgEl && (bgStyle.backgroundColor === 'transparent' || bgStyle.backgroundColor === 'rgba(0, 0, 0, 0)')) {
          bgEl = bgEl.parentElement;
          if (bgEl) bgStyle = window.getComputedStyle(bgEl);
        }
        const bgColor = bgEl ? parseRgb(bgStyle.backgroundColor) : { r: 255, g: 255, b: 255 };

        const ratio = getContrastRatio(color, bgColor);
        const isLargeText = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && parseInt(style.fontWeight) >= 700);
        const minRequired = isLargeText ? 3.0 : 4.5;

        return {
          name: item.name,
          ratio: ratio.toFixed(2),
          required: minRequired,
          pass: ratio >= minRequired,
        };
      });
    });

    console.log('   Результаты измерения контраста:');
    let allContrastPassed = true;
    for (const res of contrastResults) {
      console.log(`   - ${res.name}: ${res.ratio}:1 (требуется >= ${res.required}:1) — ${res.pass ? '✅ PASS' : '❌ FAIL'}`);
      if (!res.pass) allContrastPassed = false;
    }

    if (!allContrastPassed) {
      throw new Error('Обнаружены элементы с недостаточным контрастом по WCAG AA');
    }

    console.log('\n🎉 Все проверки успешно пройдены! 100% требований брифа подтверждено.');
  } finally {
    await browser.close();
    if (serverProcess) {
      console.log('🛑 Остановка локального preview-сервера...');
      try {
        process.kill(-serverProcess.pid);
      } catch {
        try { serverProcess.kill(); } catch {}
      }
    }
  }
}

runBrowserTests().catch((err) => {
  console.error('\n❌ Ошибка во время проверки в браузере:', err);
  process.exit(1);
});
