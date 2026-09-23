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
const SCREENSHOT_DIR = path.resolve('test-screenshots/lesson2');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runLesson2BrowserTests() {
  console.log('🚀 Запуск браузерных тестов Темы 2 («Повторение и узоры»)...');
  console.log(`   URL: ${BASE_URL}`);

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
    // 1. Открытие страницы и переключение на Тему 2
    console.log('1. Открытие сайта и переключение на Тему 2...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });

    // Кликаем по кнопке «Тема 2»
    await page.click('#btn-lesson-2');
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_lesson2_initial.png') });

    const subtitleText = await page.$eval('.brand-subtitle', (el) => el.textContent);
    console.log(`   Подзаголовок после переключения: "${subtitleText}"`);
    if (!subtitleText.includes('Повторение и узоры')) {
      throw new Error('Подзаголовок не изменился на «Повторение и узоры»');
    }

    // 2. Проверка Задания 1 (Лесенка): проверка столкновения со стеной и успешного прохождения
    console.log('2. Проверка Задания 1 (Лесенка к маяку)...');
    // Пробуем шагнуть прямо в стену (1,4)
    await page.keyboard.press('1'); // STEP
    await page.click('.btn-primary-run');
    await new Promise((r) => setTimeout(r, 1200));

    const wallFeedback = await page.$eval('.feedback-message', (el) => el.textContent);
    console.log(`   Ответ при столкновении со ступенькой: "${wallFeedback}"`);
    if (!wallFeedback.includes('упёрся в стену')) {
      throw new Error('Столкновение со ступенькой не распознано');
    }

    // Очищаем и собираем 3 ступеньки: [TURN_LEFT, STEP, TURN_RIGHT, STEP] x 3
    console.log('   Набор 3 ступенек (лесенка)...');
    await page.click('.clear-button');
    await new Promise((r) => setTimeout(r, 200));

    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('2'); // TURN_LEFT
      await page.keyboard.press('1'); // STEP
      await page.keyboard.press('3'); // TURN_RIGHT
      await page.keyboard.press('1'); // STEP
    }
    await new Promise((r) => setTimeout(r, 200));

    await page.click('.btn-primary-run');
    await new Promise((r) => setTimeout(r, 6500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_lesson2_m1_staircase_success.png') });

    const m1SuccessFeedback = await page.$eval('.feedback-message', (el) => el.textContent);
    console.log(`   Результат Задания 1: "${m1SuccessFeedback}"`);
    if (!m1SuccessFeedback.includes('Маяк достигнут')) {
      throw new Error('Задание 1 не завершилось успехом');
    }

    // 3. Проверка Задания 2 (Ритмичный обход камней)
    console.log('3. Проверка Задания 2 (Ритмичный обход двух камней)...');
    await page.click('#tab-mission-5');
    await new Promise((r) => setTimeout(r, 400));

    // Программа из двух одинаковых волн:
    // Волна 1: TURN_LEFT, STEP, TURN_RIGHT, STEP, STEP, TURN_RIGHT, STEP, TURN_LEFT
    const wave1 = ['2', '1', '3', '1', '1', '3', '1', '2'];
    // Волна 2: TURN_LEFT, STEP, TURN_RIGHT, STEP, STEP, TURN_RIGHT, STEP
    const wave2 = ['2', '1', '3', '1', '1', '3', '1'];

    for (const key of [...wave1, ...wave2]) {
      await page.keyboard.press(key);
    }
    await new Promise((r) => setTimeout(r, 200));

    await page.click('.btn-primary-run');
    await new Promise((r) => setTimeout(r, 8000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_lesson2_m2_waves_success.png') });

    const m2SuccessFeedback = await page.$eval('.feedback-message', (el) => el.textContent);
    console.log(`   Результат Задания 2: "${m2SuccessFeedback}"`);
    if (!m2SuccessFeedback.includes('Маяк достигнут')) {
      throw new Error('Задание 2 не завершилось успехом');
    }

    // 4. Проверка Задания 3 (Сбившийся счётчик)
    console.log('4. Проверка Задания 3 (Сбившийся счётчик)...');
    await page.click('#tab-mission-6');
    await new Promise((r) => setTimeout(r, 400));

    const m6InitialCount = await page.$$eval('.program-item', (els) => els.length);
    console.log(`   Начальное количество команд: ${m6InitialCount}`);
    if (m6InitialCount !== 3) {
      throw new Error('В заготовке Задания 3 должно быть 3 команды');
    }

    // Запускаем ошибочную программу (недолёт 1 шаг)
    await page.click('.btn-primary-run');
    await new Promise((r) => setTimeout(r, 2200));

    const m6FailFeedback = await page.$eval('.feedback-message', (el) => el.textContent);
    console.log(`   Результат запуска заготовки: "${m6FailFeedback}"`);
    if (!m6FailFeedback.includes('не дошёл до маяка')) {
      throw new Error('Заготовка Задания 3 не зафиксировала недолёт');
    }

    // Добавляем 1 недостающий шаг
    console.log('   Добавление 4-го шага в счётчик...');
    await page.keyboard.press('1'); // STEP
    await new Promise((r) => setTimeout(r, 200));

    await page.click('.btn-primary-run');
    await new Promise((r) => setTimeout(r, 2800));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_lesson2_m3_fixed_success.png') });

    const m6SuccessFeedback = await page.$eval('.feedback-message', (el) => el.textContent);
    console.log(`   Результат после исправления: "${m6SuccessFeedback}"`);
    if (!m6SuccessFeedback.includes('Маяк достигнут')) {
      throw new Error('Исправленное Задание 3 не завершилось успехом');
    }

    // Проверяем кнопку рефлексии
    const nextBtnText = await page.$eval('.btn-next-mission', (el) => el.textContent);
    console.log(`   Кнопка после выполнения всех заданий Темы 2: "${nextBtnText}"`);
    if (!nextBtnText.includes('Завершить урок и рефлексия')) {
      throw new Error('Кнопка завершения урока и рефлексии не появилась');
    }

    // 5. Проверка модального окна "Показать код" для Темы 2
    console.log('5. Проверка модального окна «Показать код» в Теме 2...');
    await page.click('button[aria-label="Показать текстовый вид программы"]');
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_lesson2_code_modal.png') });

    const codeContent = await page.$eval('.code-block code', (el) => el.textContent);
    console.log('   Код содержит упоминание for/циклов:', codeContent.includes('for'));
    if (!codeContent.includes('for')) {
      throw new Error('В коде Темы 2 отсутствует пояснение цикла for');
    }

    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 300));

    // 6. Проверка шпаргалки преподавателя для Темы 2
    console.log('6. Проверка панели преподавателя в Теме 2...');
    await page.click('.teacher-toggle-btn');
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_lesson2_teacher_drawer.png') });

    const timingText = await page.$eval('.timing-pill', (el) => el.textContent);
    console.log(`   Тайминг текущего этапа: "${timingText}"`);

    await page.click('.drawer-close-btn');
    await new Promise((r) => setTimeout(r, 300));

    console.log('✅ Все проверки Темы 2 («Повторение и узоры») успешно пройдены в Google Chrome!');
  } finally {
    await browser.close();
  }
}

runLesson2BrowserTests().catch((err) => {
  console.error('❌ Ошибка во время проверки Темы 2 в браузере:', err);
  process.exit(1);
});
