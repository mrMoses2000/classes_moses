import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

function getChromePath() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  const candidates = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
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
const TUNNEL_URL = 'https://constitutional-auckland-shape-west.trycloudflare.com';
const SCREENSHOT_DIR = path.resolve('test-screenshots/lesson3');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runLesson3BrowserTests() {
  console.log('🚀 Запуск браузерных тестов Темы 3 («Условия и сенсоры»)...');
  console.log(`   Local URL: ${BASE_URL}`);

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
    // 1. Открытие страницы и переключение на Тему 3
    console.log('1. Открытие сайта и переключение на Тему 3...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });

    // Кликаем по кнопке «Тема 3»
    await page.click('#btn-lesson-3');
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_lesson3_initial.png') });

    const subtitleText = await page.$eval('.brand-subtitle', (el) => el.textContent);
    console.log(`   Подзаголовок после переключения: "${subtitleText}"`);
    if (!subtitleText.includes('Условия и сенсоры')) {
      throw new Error('Подзаголовок не изменился на «Условия и сенсоры»');
    }

    // Проверяем наличие кнопок условий в палитре
    const conditionButtons = await page.$$('.btn-command-condition');
    console.log(`   Кнопок с условиями в палитре: ${conditionButtons.length}`);
    if (conditionButtons.length < 2) {
      throw new Error('Кнопки условий (IF_WALL_LEFT / IF_WALL_RIGHT) не найдены в палитре Темы 3');
    }

    // 2. Проверка Задания 1: Развилка сенсора (слепое движение vs умный поворот)
    console.log('2. Проверка Задания 1 (Развилка сенсора: умный поворот)...');
    // Слепой шаг прямо в стену (2,2)
    await page.keyboard.press('1'); // STEP
    await page.keyboard.press('1'); // STEP
    await page.click('.btn-primary-run');
    await new Promise((r) => setTimeout(r, 1600));

    const wallFeedback = await page.$eval('.feedback-message', (el) => el.textContent);
    console.log(`   Ответ при слепом столкновении: "${wallFeedback}"`);
    if (!wallFeedback.includes('упёрся в стену на шаге 2')) {
      throw new Error('Слепое столкновение со стеной не распознано на шаге 2');
    }

    // Очищаем и собираем маршрут с ветвлением:
    // IF_WALL_LEFT (шаг на 1,2), IF_WALL_LEFT (поворот на север перед стеной 2,2),
    // STEP (1,1), STEP (1,0), TURN_RIGHT (восток), STEP (2,0 = маяк)
    console.log('   Набор программы с активным сенсором IF_WALL_LEFT...');
    await page.click('.clear-button');
    await new Promise((r) => setTimeout(r, 200));

    await page.keyboard.press('4'); // IF_WALL_LEFT
    await page.keyboard.press('4'); // IF_WALL_LEFT
    await page.keyboard.press('1'); // STEP
    await page.keyboard.press('1'); // STEP
    await page.keyboard.press('3'); // TURN_RIGHT
    await page.keyboard.press('1'); // STEP
    await new Promise((r) => setTimeout(r, 200));

    await page.click('.btn-primary-run');
    await new Promise((r) => setTimeout(r, 4500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_lesson3_m1_sensor_success.png') });

    const m1SuccessFeedback = await page.$eval('.feedback-message', (el) => el.textContent);
    console.log(`   Результат Задания 1: "${m1SuccessFeedback}"`);
    if (!m1SuccessFeedback.includes('Маяк достигнут')) {
      throw new Error('Задание 1 не завершилось успехом');
    }

    // 3. Проверка Задания 2: Лабиринт с двойной развилкой
    console.log('3. Проверка Задания 2 (Лабиринт с двойной развилкой)...');
    await page.click('#tab-mission-8');
    await new Promise((r) => setTimeout(r, 400));

    // Набираем сложную траекторию через обе развилки лабиринта:
    // Спуск: STEP(1), STEP(1), STEP(1) -> (0,3)
    // Поворот на восток: TURN_LEFT(2)
    // Проход под рифом: STEP(1), STEP(1) -> (2,3)
    // Сенсор стены (3,3): IF_WALL_LEFT(4) -> поворот на север!
    // Проход вверх: STEP(1), STEP(1) -> (2,1)
    // Поворот на восток: TURN_RIGHT(3)
    // Проход в коридор: STEP(1), STEP(1) -> (4,1)
    // Сенсор границы поля (5,1): IF_WALL_RIGHT(5) -> поворот на юг!
    // Спуск к маяку: STEP(1), STEP(1), STEP(1) -> (4,4) GOAL!
    const mazeKeys = ['1', '1', '1', '2', '1', '1', '4', '1', '1', '3', '1', '1', '5', '1', '1', '1'];
    for (const key of mazeKeys) {
      await page.keyboard.press(key);
    }
    await new Promise((r) => setTimeout(r, 200));

    await page.click('.btn-primary-run');
    await new Promise((r) => setTimeout(r, 9000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_lesson3_m2_maze_success.png') });

    const m2SuccessFeedback = await page.$eval('.feedback-message', (el) => el.textContent);
    console.log(`   Результат Задания 2: "${m2SuccessFeedback}"`);
    if (!m2SuccessFeedback.includes('Маяк достигнут')) {
      throw new Error('Задание 2 не завершилось успехом');
    }

    // 4. Проверка Задания 3: Ложная ветка (отладка направления условия)
    console.log('4. Проверка Задания 3 (Ложная ветка: отладка логики)...');
    await page.click('#tab-mission-9');
    await new Promise((r) => setTimeout(r, 400));

    const m9InitialCount = await page.$$eval('.program-item', (els) => els.length);
    console.log(`   Начальное количество команд: ${m9InitialCount}`);
    if (m9InitialCount !== 3) {
      throw new Error('В заготовке Задания 3 должно быть 3 команды');
    }

    // Запускаем ошибочную программу с IF_WALL_RIGHT
    await page.click('.btn-primary-run');
    await new Promise((r) => setTimeout(r, 2200));

    const m9CrashFeedback = await page.$eval('.feedback-message', (el) => el.textContent);
    console.log(`   Результат запуска с ложной веткой: "${m9CrashFeedback}"`);
    if (!m9CrashFeedback.includes('упёрся в стену на шаге 3')) {
      throw new Error('Ложная ветка условия не вызвала ожидаемого столкновения на шаге 3');
    }

    // Точечное исправление: удаляем команды 2 и 1 (или очищаем и ставим STEP, IF_WALL_LEFT, STEP)
    console.log('   Точечная замена ветки на IF_WALL_LEFT...');
    await page.click('.clear-button');
    await new Promise((r) => setTimeout(r, 200));
    await page.keyboard.press('1'); // STEP
    await page.keyboard.press('4'); // IF_WALL_LEFT
    await page.keyboard.press('1'); // STEP
    await new Promise((r) => setTimeout(r, 200));

    await page.click('.btn-primary-run');
    await new Promise((r) => setTimeout(r, 2500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_lesson3_m3_debug_success.png') });

    const m9SuccessFeedback = await page.$eval('.feedback-message', (el) => el.textContent);
    console.log(`   Результат после исправления ветки: "${m9SuccessFeedback}"`);
    if (!m9SuccessFeedback.includes('Маяк достигнут')) {
      throw new Error('Задание 3 не завершилось успехом');
    }

    const finishBtnText = await page.$eval('.btn-next-mission', (el) => el.textContent);
    console.log(`   Кнопка после выполнения всех заданий Темы 3: "${finishBtnText.trim()}"`);
    if (!finishBtnText.includes('Завершить урок и рефлексия')) {
      throw new Error('Финальная кнопка рефлексии не появилась после завершения всех заданий Темы 3');
    }

    // 5. Проверка модального окна «Показать код» в Теме 3
    console.log('5. Проверка модального окна «Показать код» в Теме 3...');
    await page.click('button[aria-label="Показать текстовый вид программы"]');
    await new Promise((r) => setTimeout(r, 400));

    const codeContent = await page.$eval('.code-block code', (el) => el.textContent);
    const hasIfElse = codeContent.includes('if (is_wall_ahead())');
    const hasArduinoBumper = codeContent.includes('digitalRead(BUMPER_PIN)');
    console.log(`   Код содержит if (is_wall_ahead()): ${hasIfElse}`);
    console.log(`   Код содержит digitalRead(BUMPER_PIN): ${hasArduinoBumper}`);
    if (!hasIfElse || !hasArduinoBumper) {
      throw new Error('В окне кода Темы 3 нет связки if/else и digitalRead()');
    }
    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 300));

    // 6. Проверка панели преподавателя в Теме 3
    console.log('6. Проверка панели преподавателя в Теме 3...');
    await page.click('.teacher-toggle-btn');
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_lesson3_teacher_drawer.png') });

    const timingText = await page.$eval('.timing-pill', (el) => el.textContent);
    console.log(`   Тайминг текущего этапа Темы 3: "${timingText}"`);
    const teacherNoteText = await page.$eval('.drawer-body', (el) => el.textContent);
    if (!teacherNoteText.includes('ветвлен') && !teacherNoteText.includes('услови')) {
      throw new Error('Панель преподавателя не содержит методику ветвлений Темы 3');
    }
    await page.click('.drawer-close-btn');
    await new Promise((r) => setTimeout(r, 300));

    // 7. Проверка мобильной верстки (375x667)
    console.log('7. Проверка мобильной верстки (375x667)...');
    await page.setViewport({ width: 375, height: 667 });
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_lesson3_mobile_375.png') });

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    console.log(`   Горизонтальная прокрутка на 375px: ${hasHorizontalOverflow ? 'ОБНАРУЖЕНА' : 'Отсутствует (ОК)'}`);
    if (hasHorizontalOverflow) {
      throw new Error('Обнаружено горизонтальное переполнение экрана на мобильном разрешении 375px');
    }

    // 8. Проверка удалённого доступа через Cloudflare Tunnel
    console.log('8. Проверка удалённого доступа через Cloudflare Tunnel...');
    console.log(`   URL: ${TUNNEL_URL}`);
    await page.setViewport({ width: 1366, height: 768 });
    try {
      await page.goto(TUNNEL_URL, { waitUntil: 'networkidle2', timeout: 15000 });
      const remoteTitle = await page.title();
      console.log(`   Удалённый заголовок: "${remoteTitle}"`);
      const hasLesson3Remote = (await page.$('#btn-lesson-3')) !== null;
      console.log(`   Кнопка Тема 3 доступна удалённо: ${hasLesson3Remote}`);
      if (!hasLesson3Remote) {
        throw new Error('Кнопка Тема 3 не найдена через удалённый туннель');
      }
    } catch (err) {
      console.warn(`   ⚠️ Удалённый туннель не ответил вовремя: ${err.message}`);
    }

    console.log('✅ Все проверки Темы 3 («Условия и сенсоры») успешно пройдены в Google Chrome!');
  } finally {
    await browser.close();
  }
}

runLesson3BrowserTests().catch((err) => {
  console.error('❌ Ошибка при выполнении браузерных тестов Темы 3:', err);
  process.exit(1);
});
