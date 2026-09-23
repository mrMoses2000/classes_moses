import puppeteer from 'puppeteer';

const LOCAL_URL = 'http://localhost:5173';
const REMOTE_URL = 'https://constitutional-auckland-shape-west.trycloudflare.com';

const EXPECTED_LESSONS = [
  { id: 1, badge: 'Тема 1', short: 'Команды', titlePart: 'Занятие 1: Доставь робота к маяку' },
  { id: 2, badge: 'Тема 2', short: 'Повторение', titlePart: 'Занятие 2: Повторение и узоры' },
  { id: 3, badge: 'Тема 3', short: 'Условия', titlePart: 'Занятие 3: Условия и сенсоры' },
  { id: 4, badge: 'Тема 4', short: 'Переменные', titlePart: 'Занятие 4: Переменная и состояние' },
  { id: 5, badge: 'Тема 5', short: 'Терминал', titlePart: 'Занятие 5: От блоков к тексту' },
  { id: 6, badge: 'Тема 6', short: 'Первый C', titlePart: 'Занятие 6: Первый C на компьютере' },
  { id: 7, badge: 'Тема 7', short: 'scanf & if', titlePart: 'Занятие 7: C: переменные int и if' },
  { id: 8, badge: 'Тема 8', short: 'Циклы', titlePart: 'Занятие 8: C: циклы while и for' },
  { id: 9, badge: 'Тема 9', short: 'Функции', titlePart: 'Занятие 9: C: функции и scope' },
  { id: 10, badge: 'Тема 10', short: 'Компьютер', titlePart: 'Занятие 10: Компьютер изнутри' },
  { id: 11, badge: 'Тема 11', short: 'Arduino LED', titlePart: 'Занятие 11: Arduino: первый свет' },
  { id: 12, badge: 'Тема 12', short: 'Бампер', titlePart: 'Занятие 12: Arduino: ввод и бампер' },
  { id: 13, badge: 'Тема 13', short: 'АЦП и ШИМ', titlePart: 'Занятие 13: Arduino: АЦП и ШИМ' },
  { id: 14, badge: 'Тема 14', short: 'Сети', titlePart: 'Занятие 14: Сети: Клиент-Сервер' },
  { id: 15, badge: 'Тема 15', short: 'Кибер-Маяк', titlePart: 'Занятие 15: Проект «Кибер-Маяк»' },
];

async function runVerification() {
  console.log('🚀 Запуск комплексной проверки всех 15 тем курса в Google Chrome...');

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

    // Проверяем наличие всех 15 кнопок переключения тем
    console.log('2. Проверка наличия всех 15 пилюль в шапке...');
    for (const item of EXPECTED_LESSONS) {
      const btnSelector = `#btn-lesson-${item.id}`;
      const exists = await page.$(btnSelector);
      if (!exists) {
        throw new Error(`Кнопка темы ${item.id} (${btnSelector}) не найдена в DOM!`);
      }
      const text = await page.$eval(btnSelector, (el) => el.textContent.trim());
      if (!text.includes(item.badge)) {
        throw new Error(`Кнопка темы ${item.id} не содержит бейдж ${item.badge}. Текст: "${text}"`);
      }
    }
    console.log('   Все 15 кнопок (#btn-lesson-1 .. #btn-lesson-15) найдены и содержат бейджи!');

    // Проверяем быстрый селектор
    console.log('3. Проверка выпадающего списка быстрого выбора (#lesson-quick-select)...');
    const selectOptionsCount = await page.$$eval('#lesson-quick-select option', (opts) => opts.length);
    console.log(`   Количество тем в выпадающем списке: ${selectOptionsCount}`);
    if (selectOptionsCount !== 15) {
      throw new Error(`Ожидалось 15 тем в #lesson-quick-select, получено: ${selectOptionsCount}`);
    }

    // Проверяем переключение по всем 15 темам
    console.log('4. Проверка переключения и контента для всех 15 тем...');
    for (const item of EXPECTED_LESSONS) {
      // Кликаем по кнопке темы
      await page.click(`#btn-lesson-${item.id}`);
      await new Promise((r) => setTimeout(r, 200));

      // Проверяем заголовок темы
      const subtitle = await page.$eval('.brand-subtitle', (el) => el.textContent.trim());
      if (!subtitle.includes(item.titlePart)) {
        throw new Error(
          `Тема ${item.id}: заголовок "${subtitle}" не содержит ожидаемую часть "${item.titlePart}"`
        );
      }

      // Проверяем, что отображаются 3 вкладки миссий
      const missionTabs = await page.$$eval('.mission-nav .tab-btn', (tabs) => tabs.length);
      if (missionTabs !== 3) {
        throw new Error(`Тема ${item.id}: ожидалось 3 вкладки заданий, получено: ${missionTabs}`);
      }

      // Проверяем отображение кода (выборочно для тем 1, 4, 10, 15)
      if ([1, 4, 10, 15].includes(item.id)) {
        await page.click('button[title*="Посмотреть текстовый эквивалент"]');
        await page.waitForSelector('.code-container code', { timeout: 3000 });
        const codeText = await page.$eval('.code-container code', (el) => el.textContent);
        if (!codeText.includes(`Занятие ${item.id}:`)) {
          throw new Error(
            `Тема ${item.id}: в окне кода отсутствует маркер "Занятие ${item.id}:". Код:\n${codeText.slice(0, 150)}`
          );
        }
        await page.click('.modal-close-btn');
        await new Promise((r) => setTimeout(r, 150));
      }
    }
    console.log('   Успешно: все 15 тем переключаются, заголовки, миссии и C-код соответствуют темам!');

    // Проверяем работу методической панели преподавателя в Теме 4 и Теме 15
    console.log('5. Проверка сценариев в панели преподавателя для Темы 4 и 15...');
    await page.click('#btn-lesson-4');
    await new Promise((r) => setTimeout(r, 200));
    await page.click('.teacher-toggle-btn');
    await page.waitForSelector('#teacher-drawer-panel', { timeout: 3000 });
    // Открываем аккордеон расписания
    await page.click('.schedule-accordion-btn');
    await page.waitForSelector('.schedule-table tbody tr', { timeout: 3000 });
    const rowsTheme4 = await page.$$eval('.schedule-table tbody tr', (rows) => rows.length);
    console.log(`   Строк в расписании Темы 4: ${rowsTheme4} (ожидается >= 7)`);
    if (rowsTheme4 < 7) {
      throw new Error(`В расписании Темы 4 слишком мало строк: ${rowsTheme4}`);
    }

    // Переключаемся на Тему 15 в открытой панели
    await page.click('#btn-lesson-15');
    await new Promise((r) => setTimeout(r, 200));
    const rowsTheme15 = await page.$$eval('.schedule-table tbody tr', (rows) => rows.length);
    console.log(`   Строк в расписании Темы 15: ${rowsTheme15} (ожидается >= 7)`);
    if (rowsTheme15 < 7) {
      throw new Error(`В расписании Темы 15 слишком мало строк: ${rowsTheme15}`);
    }
    await page.click('.drawer-close-btn');
    await new Promise((r) => setTimeout(r, 150));

    // Проверяем план курса (RoadmapModal) и интерактивный клик
    console.log('6. Проверка перехода по темам прямо из План курса (Roadmap)...');
    await page.click('button[title*="Открыть план курса"]');
    await page.waitForSelector('.roadmap-modal-card', { timeout: 3000 });
    const roadmapItemsCount = await page.$$eval('.roadmap-item', (items) => items.length);
    console.log(`   Карточек в дорожной карте: ${roadmapItemsCount}`);
    if (roadmapItemsCount !== 15) {
      throw new Error(`Ожидалось 15 карточек в дорожной карте, получено: ${roadmapItemsCount}`);
    }
    // Кликаем по карточке Темы 7 в модальном окне
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.roadmap-item'));
      const card7 = cards.find((c) => c.textContent.includes('Тема 7'));
      if (card7) card7.click();
    });
    await new Promise((r) => setTimeout(r, 300));
    const subtitleAfterRoadmapClick = await page.$eval('.brand-subtitle', (el) => el.textContent.trim());
    console.log(`   После клика по карточке Темы 7 активный заголовок: "${subtitleAfterRoadmapClick}"`);
    if (!subtitleAfterRoadmapClick.includes('Занятие 7:')) {
      throw new Error(`Переход по клику на карточку темы 7 не сработал!`);
    }

    // Проверка мобильного вьюпорта 375x667
    console.log('7. Проверка мобильной верстки (375x667) на отсутствие переполнения...');
    await page.setViewport({ width: 375, height: 667 });
    await new Promise((r) => setTimeout(r, 300));
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    console.log(`   Ширина страницы: ${scrollWidth}px (окно: 375px). Переполнение: ${isOverflowing ? 'ЕСТЬ (ОШИБКА)' : 'НЕТ (ОК)'}`);
    if (isOverflowing) {
      throw new Error(`Обнаружен горизонтальный скролл страницы на 375px: scrollWidth=${scrollWidth}px > 375px!`);
    }

    // Проверка удаленного туннеля Cloudflare
    console.log(`8. Проверка удалённого доступа через Cloudflare Tunnel (${REMOTE_URL})...`);
    await page.goto(REMOTE_URL, { waitUntil: 'networkidle0', timeout: 15000 });
    const remoteButtonCount = await page.$$eval('.lesson-pill', (pills) => pills.length);
    console.log(`   Удаленно доступно кнопок тем: ${remoteButtonCount}`);
    if (remoteButtonCount !== 15) {
      throw new Error(`Удаленно отображается ${remoteButtonCount} кнопок вместо 15!`);
    }

    console.log('🎉 ВСЕ 15 ТЕМ УСПЕШНО ОТОБРАЖАЮТСЯ И РАБОТАЮТ ЛОКАЛЬНО И УДАЛЁННО!');
  } finally {
    await browser.close();
  }
}

runVerification().catch((err) => {
  console.error('❌ Ошибка проверки:', err.message);
  process.exit(1);
});
