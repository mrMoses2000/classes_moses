import { RoadmapLesson } from '../types';

export const COURSE_FINAL_SKILL =
  'самостоятельно придумать, написать, проверить и объяснить небольшую программу или устройство; далее C, Arduino, компьютер и сеть.';

export const COURSE_ROADMAP_NOTE =
  'Эти 15 пунктов — первые темы и разведочный маршрут более длинного курса (рассчитанного примерно на учебный год, около 30–40 встреч). Каждая тема снабжена подробным сценарием с повышенной сложностью; переход происходит по наблюдаемому умению, а не по календарю.';

export const ROADMAP_LESSONS: RoadmapLesson[] = [
  {
    id: 1,
    title: 'Команды и порядок',
    practicalResult: 'Робот проходит маршрут по клеткам',
    transitionCondition: 'Ученик предсказывает и исправляет короткую программу',
  },
  {
    id: 2,
    title: 'Повторение и узоры',
    practicalResult: 'Создаёт узор или длинный маршрут',
    transitionCondition: 'Объясняет, что повторяется и сколько раз',
  },
  {
    id: 3,
    title: 'Условия и сенсоры',
    practicalResult: 'Робот выбирает путь по сигналу бампера',
    transitionCondition: 'Называет условие и оба возможных действия if/else',
  },
  {
    id: 4,
    title: 'Переменная и состояние',
    practicalResult: 'Счётчик энергии и сбор кристаллов',
    transitionCondition: 'Отслеживает изменение переменной в памяти во времени',
  },
  {
    id: 5,
    title: 'От блоков к тексту',
    practicalResult: 'Вводит команды вручную, читает логи парсера',
    transitionCondition: 'Исправляет опечатки синтаксиса без готовых решений',
  },
  {
    id: 6,
    title: 'Первый C на компьютере',
    practicalResult: 'Собирает GCC, запускает ./app, форматирует printf',
    transitionCondition: 'Объясняет цепочку: исходник → компилятор → запуск',
  },
  {
    id: 7,
    title: 'C: переменные int и if',
    practicalResult: 'Кодовый замок и шлюз с интерактивным scanf',
    transitionCondition: 'Различает присваивание = и сравнение ==, применяет &&',
  },
  {
    id: 8,
    title: 'C: циклы while и for',
    practicalResult: 'Радарный круговой сканер и отсечка break',
    transitionCondition: 'Предотвращает бесконечный цикл, прерывает по Ctrl+C',
  },
  {
    id: 9,
    title: 'C: функции и scope',
    practicalResult: 'Модульный баллистический калькулятор с return',
    transitionCondition: 'Объясняет локальную область видимости и стек вызовов',
  },
  {
    id: 10,
    title: 'Компьютер изнутри',
    practicalResult: 'Схема фон Неймана, регистры, ассемблер GCC',
    transitionCondition: 'Сопоставляет строку C с инструкциями movl, addl, jmp',
  },
  {
    id: 11,
    title: 'Arduino: первый свет',
    practicalResult: 'Схема breadboard, резистор, сигнал SOS',
    transitionCondition: 'Рассчитывает резистор по закону Ома, пишет setup/loop',
  },
  {
    id: 12,
    title: 'Arduino: ввод и бампер',
    practicalResult: 'Тактовая кнопка с подтяжкой INPUT_PULLUP',
    transitionCondition: 'Объясняет плавающий пин, фильтрует дребезг контактов',
  },
  {
    id: 13,
    title: 'Arduino: АЦП и ШИМ',
    practicalResult: 'Фоторезистор, автосвет и диммер map()',
    transitionCondition: 'Различает дискретный и аналоговый сигналы (0..1023)',
  },
  {
    id: 14,
    title: 'Сети: Клиент-Сервер',
    practicalResult: 'Сетевой чат netcat, ping и curl запросы',
    transitionCondition: 'Различает IP-адрес, порт программы и статус 200/404',
  },
  {
    id: 15,
    title: 'Проект «Кибер-Маяк»',
    practicalResult: 'Автономный охранный комплекс C + Arduino',
    transitionCondition: 'Находит скрытый дефект в логе и защищает проект',
  },
];

export const REFLECTION_QUESTIONS = [
  'Что ты сделаешь первым делом, если робот поедет не туда, куда ты ожидал?',
  'Чем поворот робота на экране отличается от твоего собственного поворота в комнате?',
  'Какое задание ты хотел бы составить роботу на следующем занятии?',
];
