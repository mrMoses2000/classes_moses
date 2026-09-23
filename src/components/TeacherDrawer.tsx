import React, { useState } from 'react';
import { TeacherNote } from '../types';
import {
  GraduationCap,
  Clock,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import './TeacherDrawer.css';

interface TeacherDrawerProps {
  currentLessonId: number;
  currentMissionId: number;
  missionTitle: string;
  teacherNote: TeacherNote;
  isOpen: boolean;
  onToggle: () => void;
  onResetAllProgress: () => void;
}

const LESSON_SCHEDULES: Record<number, { time: string; childAction: string; teacherPrompt: string }[]> = {
  1: [
    {
      time: '0–5 мин',
      childAction: 'Scratch-опыт, три команды учителю до карандаша',
      teacherPrompt: '«Я робот: выполню буквально то, что ты скажешь»',
    },
    {
      time: '5–10 мин',
      childAction: 'Предсказывает, куда придёт робот (Задание 1)',
      teacherPrompt: '«Сначала покажи пальцем результат, потом нажми Запустить»',
    },
    {
      time: '10–20 мин',
      childAction: 'Сам составляет маршрут на пустом поле, меняет порядок',
      teacherPrompt: '«Какая команда изменила результат?»',
    },
    {
      time: '20–32 мин',
      childAction: 'Обходит преграду (Задание 2); рисует путь, собирает команды',
      teacherPrompt: '«Сколько раз робот повернёт и где?»',
    },
    {
      time: '32–42 мин',
      childAction: 'Исправляет ошибку в готовом маршруте (Задание 3)',
      teacherPrompt: '«Что программа делает сейчас? Где ожидание разошлось с результатом?»',
    },
    {
      time: '42–50 мин',
      childAction: 'Создаёт свой маршрут для преподавателя; преподаватель проходит',
      teacherPrompt: '«Как проверить, что твоё задание решаемо?»',
    },
    {
      time: '50–57 мин',
      childAction: 'Открывает «Показать код» и сопоставляет команды с текстом',
      teacherPrompt: '«Команды те же; позже мы научимся писать их сами»',
    },
    {
      time: '57–60 мин',
      childAction: 'Рефлексия: понятая идея и план на будущее',
      teacherPrompt: '«Что ты сделаешь первым, если робот поедет не туда?»',
    },
  ],
  2: [
    {
      time: '0–5 мин',
      childAction: 'Разминка «Робот-танцор»: повторяет связку хлопок+присед',
      teacherPrompt: '«Я назвал одно правило и число повторов. В коде это называется цикл»',
    },
    {
      time: '5–12 мин',
      childAction: 'Столкновение с рутиной: набирает 12 команд вручную и устаёт',
      teacherPrompt: '«Удобно ли писать 100 раз одно и то же? Какой кусочек повторяется?»',
    },
    {
      time: '12–22 мин',
      childAction: 'Задание 1: находит шаблон ступеньки [Шаг, Влево, Шаг, Вправо] × 3',
      teacherPrompt: '«Покажи пальцем, где кончается первая ступенька. Куда смотрит робот?»',
    },
    {
      time: '22–33 мин',
      childAction: 'Задание 2: обобщает обход камней в одинаковые волны',
      teacherPrompt: '«Ты уже научил робота обойти первый камень. Сделай то же для второго!»',
    },
    {
      time: '33–43 мин',
      childAction: 'Задание 3: исправляет недолёт счётчика на 1 шаг',
      teacherPrompt: '«Робот выполнил все повторы, но не дошёл. Сам кирпичик сломался или счётчик мал?»',
    },
    {
      time: '43–48 мин',
      childAction: 'Смотрит for в коде и мигающий светодиод Arduino loop()',
      teacherPrompt: '«На плате функция loop() крутит этот кирпичик бесконечно!»',
    },
    {
      time: '48–53 мин',
      childAction: 'Творческое задание: придумывает собственный танец робота',
      teacherPrompt: '«Придумай короткое правило, которое при повторе нарисует узор»',
    },
    {
      time: '53–55 мин',
      childAction: 'Устная рефлексия: объясняет, зачем нужны циклы',
      teacherPrompt: '«Когда цикл удобнее обычных команд?»',
    },
  ],
  3: [
    {
      time: '0–5 мин',
      childAction: 'Разминка «Робот с бампером»: закрывает глаза, выставляет руку-сенсор',
      teacherPrompt: '«Коснулся ладони — поворот, свободно — шаг. Это условие if/else!»',
    },
    {
      time: '5–12 мин',
      childAction: 'Вызов: слепая программа из шагов разбивается о стену',
      teacherPrompt: '«Жёсткий маршрут сломался. Как научить робота проверять путь перед собой?»',
    },
    {
      time: '12–22 мин',
      childAction: 'Задание 1: ветвление «Если стена ➔ Влево, иначе Шаг»',
      teacherPrompt: '«Команда одна, а действия разные: почему на пустом месте шаг, а у камня поворот?»',
    },
    {
      time: '22–35 мин',
      childAction: 'Задание 2: сложный лабиринт с двойной развилкой',
      teacherPrompt: '«Проверь обе развилки пальцем: куда ведёт правый путь, а куда левый?»',
    },
    {
      time: '35–45 мин',
      childAction: 'Задание 3: отладка ложной ветки (замена IF_WALL_RIGHT на LEFT)',
      teacherPrompt: '«Датчик заметил стену, но куда повернул? Почему робот угодил в скалы?»',
    },
    {
      time: '45–50 мин',
      childAction: 'Смотрит if/else в коде и кнопку бампера Arduino digitalRead()',
      teacherPrompt: '«В Си if выбирает ветку. А провод на плате замыкает пин digitalRead()!»',
    },
    {
      time: '50–53 мин',
      childAction: 'Творческое задание: строит лабиринт-ловушку для учителя',
      teacherPrompt: '«Придумай препятствие, которое робот без сенсора не сможет обойти»',
    },
    {
      time: '53–55 мин',
      childAction: 'Выходной вопрос: чем команда с условием умнее обычного шага',
      teacherPrompt: '«В какой именно момент условие меняет поведение робота?»',
    },
  ],
  4: [
    {
      time: '0–5 мин',
      childAction: 'Разминка без экрана: «Коробка с батарейками» (int)',
      teacherPrompt: '«В компьютере это называется ПЕРЕМЕННАЯ: ячейка памяти с именем»',
    },
    {
      time: '5–12 мин',
      childAction: 'Интеллектуальный вызов: «Внезапная остановка робота»',
      teacherPrompt: '«Чего не хватило программе? Запас энергии иссяк на полпути»',
    },
    {
      time: '12–22 мин',
      childAction: 'Задание 1: «Строгий энергобаланс: экономный путь»',
      teacherPrompt: '«Каждое действие стоит 1 энергию. Посчитай путь без лишних поворотов»',
    },
    {
      time: '22–35 мин',
      childAction: 'Задание 2: «Кристаллы и станция подзарядки»',
      teacherPrompt: '«Куда сначала нужно заехать роботу, чтобы пополнить запас батареи?»',
    },
    {
      time: '35–45 мин',
      childAction: 'Задание 3: «Логическая отладка: утечка батареи»',
      teacherPrompt: '«На каком шаге мы потратили батарею впустую? Срежь лишнюю петлю»',
    },
    {
      time: '45–50 мин',
      childAction: 'Смотрит int energy = 6 и декремент energy-- в коде C',
      teacherPrompt: '«Запись energy = energy - 1 говорит процессору изменить число в памяти»',
    },
    {
      time: '50–55 мин',
      childAction: 'Творческий вызов: строит карту с ложными кристаллами',
      teacherPrompt: '«Расставь ловушки так, чтобы невнимательный робот потратил всю энергию»',
    },
    {
      time: '55–60 мин',
      childAction: 'Рефлексия: чем переменная отличается от константы',
      teacherPrompt: '«Как значение переменной меняется по ходу выполнения программы?»',
    },
  ],
  5: [
    {
      time: '0–5 мин',
      childAction: 'Разминка: угадывает команду по записи на языке Си',
      teacherPrompt: '«Текстовый код строже блоков: важна каждая точка с запятой ;»',
    },
    {
      time: '5–12 мин',
      childAction: 'Командный терминал: ввод команд словами step() и turn()',
      teacherPrompt: '«Терминал выполняет то, что набрано буквами, без помощи мышки»',
    },
    {
      time: '12–22 мин',
      childAction: 'Задание 1: перевод графических стрелок в вызовы функций',
      teacherPrompt: '«Как пишется поворот направо на английском языке со скобками?»',
    },
    {
      time: '22–35 мин',
      childAction: 'Задание 2: поиск пропущенной точки с запятой',
      teacherPrompt: '«Компилятор указал строку с ошибкой. Что там пропущено в конце?»',
    },
    {
      time: '35–45 мин',
      childAction: 'Задание 3: отладка баланса фигурных скобок { }',
      teacherPrompt: '«Сколько открылось фигурных скобок, столько должно обязательно закрыться»',
    },
    {
      time: '45–50 мин',
      childAction: 'Вывод сообщений в консоль через printf()',
      teacherPrompt: '«Экран терминала — это окно прямого текстового диалога с программой»',
    },
    {
      time: '50–55 мин',
      childAction: 'Творческое задание: выводит поздравление с победой в 3 строки',
      teacherPrompt: '«Символ \\n переводит вывод на новую строку терминала»',
    },
    {
      time: '55–60 мин',
      childAction: 'Рефлексия: преимущества текстового программирования',
      teacherPrompt: '«Почему инженеры в реальных проектах пишут код текстом, а не блоками?»',
    },
  ],
  6: [
    {
      time: '0–5 мин',
      childAction: 'Разминка: компилятор GCC как профессиональный переводчик',
      teacherPrompt: '«Компилятор переводит английский Си в машинный код нулей и единиц»',
    },
    {
      time: '5–12 мин',
      childAction: 'Первая компиляция в терминале: gcc main.c -o robot',
      teacherPrompt: '«Посмотри, в папке появился исполняемый файл robot!»',
    },
    {
      time: '12–22 мин',
      childAction: 'Задание 1: запуск ./robot и проверка кода возврата 0',
      teacherPrompt: '«Число 0 в операторе return 0 означает: программа выполнена без ошибок»',
    },
    {
      time: '22–35 мин',
      childAction: 'Задание 2: чтение и исправление предупреждений (warnings)',
      teacherPrompt: '«Предупреждение — это дружеский намёк компилятора на скрытый баг»',
    },
    {
      time: '35–45 мин',
      childAction: 'Задание 3: исправление аварии памяти Segmentation fault',
      teacherPrompt: '«Программа попыталась прочитать адрес памяти, к которому нет доступа»',
    },
    {
      time: '45–50 мин',
      childAction: 'Знакомство со сборкой проекта через Makefile',
      teacherPrompt: '«Команда make собирает проект из сотен файлов за доли секунды»',
    },
    {
      time: '50–55 мин',
      childAction: 'Эксперимент с флагами оптимизации gcc -O2',
      teacherPrompt: '«Смотри: оптимизатор сделал бинарник компактнее и быстрее»',
    },
    {
      time: '55–60 мин',
      childAction: 'Рефлексия: жизненный цикл кода от исходника до процессора',
      teacherPrompt: '«Что именно находится внутри исполняемого файла после сборки?»',
    },
  ],
  7: [
    {
      time: '0–5 мин',
      childAction: 'Разминка: интерактивный робот ждёт секретный пароль',
      teacherPrompt: '«Программа замерла и ждёт клавиш от пользователя: это функция scanf»',
    },
    {
      time: '5–12 мин',
      childAction: 'Задание 1: чтение числа через scanf("%d", &pin)',
      teacherPrompt: '«Символ & передаёт точный адрес ячейки в оперативной памяти»',
    },
    {
      time: '12–22 мин',
      childAction: 'Задание 2: проверка диапазона с логическим И (&&)',
      teacherPrompt: '«Дверь маяка откроется, если PIN верен И энергии больше двух единиц»',
    },
    {
      time: '22–35 мин',
      childAction: 'Задание 3: резервный ключ с логическим ИЛИ (||)',
      teacherPrompt: '«Робот принимает мастер-код ИЛИ аварийный сигнал оператора»',
    },
    {
      time: '35–45 мин',
      childAction: 'Отладка: что будет, если ввести букву вместо цифры',
      teacherPrompt: '«Всегда проверяй возвращаемое значение scanf: сколько чисел прочитано?»',
    },
    {
      time: '45–50 мин',
      childAction: 'Анализ входного буфера stdin и очистки ввода',
      teacherPrompt: '«Символы клавиатуры ждут обработки в очереди буфера ОС»',
    },
    {
      time: '50–55 мин',
      childAction: 'Творческое задание: двухфакторная аутентификация маяка',
      teacherPrompt: '«Сделай проверку сначала номера сектора, затем защитного ключа»',
    },
    {
      time: '55–60 мин',
      childAction: 'Рефлексия: диалог программы с внешним миром',
      teacherPrompt: '«Как интерактивный ввод меняет поведение одного и того же алгоритма?»',
    },
  ],
  8: [
    {
      time: '0–5 мин',
      childAction: 'Разминка: шаги до стены с неизвестной дистанцией',
      teacherPrompt: '«Когда число шагов неизвестно заранее, нужен цикл while»',
    },
    {
      time: '5–12 мин',
      childAction: 'Задание 1: цикл while (!is_wall_ahead()) { step(); }',
      teacherPrompt: '«Робот проверяет условие перед каждым шагом, пока путь свободен»',
    },
    {
      time: '12–22 мин',
      childAction: 'Задание 2: цикл for со счётчиком итераций',
      teacherPrompt: '«Сравни for и while: когда счётчик известен, for защищает от ошибок»',
    },
    {
      time: '22–35 мин',
      childAction: 'Задание 3: экстренное торможение через оператор break',
      teacherPrompt: '«Сработал датчик препятствия — немедленный выход из цикла!»',
    },
    {
      time: '35–45 мин',
      childAction: 'Разбор бесконечного зацикливания: процессор на 100%',
      teacherPrompt: '«Почему программа зависла? Где строчка изменения счётчика цикла?»',
    },
    {
      time: '45–50 мин',
      childAction: 'Вложенные циклы: сканирование сетки 5x5 рядами',
      teacherPrompt: '«Внешний цикл идёт по строкам, внутренний сканирует столбцы»',
    },
    {
      time: '50–55 мин',
      childAction: 'Творческий алгоритм: спиральный маршрут поиска маяка',
      teacherPrompt: '«Увеличивай длину стороны квадрата на единицу каждый виток»',
    },
    {
      time: '55–60 мин',
      childAction: 'Рефлексия: безопасность и надёжность циклов',
      teacherPrompt: '«Какое главное правило защищает программу от вечного зависания?»',
    },
  ],
  9: [
    {
      time: '0–5 мин',
      childAction: 'Разминка: рецепт бутерброда и декомпозиция задач',
      teacherPrompt: '«Вместо 20 инструкций мы вызываем одну функцию по имени»',
    },
    {
      time: '5–12 мин',
      childAction: 'Задание 1: создание функции void walk(int distance)',
      teacherPrompt: '«Функция стала универсальной: теперь ей можно передавать любое число»',
    },
    {
      time: '12–22 мин',
      childAction: 'Задание 2: функция с возвращаемым значением int get_steps()',
      teacherPrompt: '«Функция посчитала оставшееся расстояние и вернула ответ в main()»',
    },
    {
      time: '22–35 мин',
      childAction: 'Задание 3: локальные и глобальные переменные (scope)',
      teacherPrompt: '«Почему переменная внутри функции не видна снаружи? Это область видимости»',
    },
    {
      time: '35–45 мин',
      childAction: 'Отладка: почему аргумент не изменился в вызывающем коде',
      teacherPrompt: '«В языке Си параметры передаются по значению — создаётся копия числа»',
    },
    {
      time: '45–50 мин',
      childAction: 'Стек вызовов функции (Call Stack) в отладчике',
      teacherPrompt: '«Каждый вызов кладёт новую рамку на верхушку стека памяти»',
    },
    {
      time: '50–55 мин',
      childAction: 'Творческая библиотека: создание заголовочного файла rover.h',
      teacherPrompt: '«Объедини команды разворота и проверки стены в библиотечный модуль»',
    },
    {
      time: '55–60 мин',
      childAction: 'Рефлексия: почему модульный код легче поддерживать',
      teacherPrompt: '«Как функции помогают команде из 10 программистов работать над одним роботом?»',
    },
  ],
  10: [
    {
      time: '0–5 мин',
      childAction: 'Разминка: кристалл процессора, шины и транзисторы',
      teacherPrompt: '«Что происходит внутри чипа каждую миллиардную долю секунды?»',
    },
    {
      time: '5–12 мин',
      childAction: 'Регистры процессора: сверхбыстрые ячейки R0..R7',
      teacherPrompt: '«Регистры находятся прямо на кристалле: это карманы процессора»',
    },
    {
      time: '12–22 мин',
      childAction: 'Задание 1: инструкции ассемблера MOV и арифметический ADD',
      teacherPrompt: '«Команда ADD R0, R1 выполняется ровно за 1 такт тактового генератора»',
    },
    {
      time: '22–35 мин',
      childAction: 'Задание 2: регистр флагов (Zero Flag) и инструкция JNE',
      teacherPrompt: '«Команда CMP сравнивает числа, а переход прыгает по результату флага»',
    },
    {
      time: '35–45 мин',
      childAction: 'Задание 3: тактовая частота и подсчёт машинных циклов',
      teacherPrompt: '«16 МГц означает: 16 миллионов тактов в секунду выполняет ядро»',
    },
    {
      time: '45–50 мин',
      childAction: 'Принцип фон Неймана: команды и данные лежат в одной памяти',
      teacherPrompt: '«И числа, и сами инструкции программы хранятся в битах памяти»',
    },
    {
      time: '50–55 мин',
      childAction: 'Дизассемблирование: смотрим ассемблерный листинг функции Си',
      teacherPrompt: '«Посмотри, во что превратилась строчка energy-- на языке микрокоманд!»',
    },
    {
      time: '55–60 мин',
      childAction: 'Рефлексия: физический уровень выполнения программ',
      teacherPrompt: '«Как логика Си превращается в перемещение зарядов в транзисторах?»',
    },
  ],
  11: [
    {
      time: '0–5 мин',
      childAction: 'Техника безопасности, макетная плата и полярность светодиода',
      teacherPrompt: '«Длинная ножка — анод (+), короткая ножка со срезом — катод (-)»',
    },
    {
      time: '5–12 мин',
      childAction: 'Сборка схемы: контакт пина 13, резистор 220 Ом и светодиод',
      teacherPrompt: '«Рельсы питания и строки контактов: почему отверстия соединены внутри»',
    },
    {
      time: '12–22 мин',
      childAction: 'Прошивка Arduino: настройка pinMode(13, OUTPUT) и Blink',
      teacherPrompt: '«Команда digitalWrite(13, HIGH) подаёт 5 Вольт прямо на контакт»',
    },
    {
      time: '22–35 мин',
      childAction: 'Задание: световой маяк SOS на азбуке Морзе',
      teacherPrompt: '«Три коротких вспышки, три длинных, три коротких с паузами delay()»',
    },
    {
      time: '35–45 мин',
      childAction: 'Закон Ома: расчет резистора и измерение мультиметром',
      teacherPrompt: '«Без резистора 220 Ом через диод пойдёт ток, который сожжёт кристалл»',
    },
    {
      time: '45–50 мин',
      childAction: 'Цикл void loop(): бесконечная работа встроенных систем',
      teacherPrompt: '«Микроконтроллер никогда не спит: loop() выполняется безостановочно»',
    },
    {
      time: '50–55 мин',
      childAction: 'Творческий светофор: подключение двух светодиодов',
      teacherPrompt: '«Запрограммируй переключение зелёного и красного огней для робота»',
    },
    {
      time: '55–60 мин',
      childAction: 'Рефлексия: мост между кодом и физической материей',
      teacherPrompt: '«Каково это — видеть, как твой код управляет реальным электричеством?»',
    },
  ],
  12: [
    {
      time: '0–5 мин',
      childAction: 'Разминка: тактовая кнопка как механический бампер робота',
      teacherPrompt: '«При ударе о препятствие кнопка замыкает контакт на землю GND»',
    },
    {
      time: '5–12 мин',
      childAction: 'Эксперимент: плавающий потенциал (Floating Pin)',
      teacherPrompt: '«Без подтягивающего резистора провод ловит помехи из воздуха как антенна»',
    },
    {
      time: '12–22 мин',
      childAction: 'Настройка режима pinMode(2, INPUT_PULLUP)',
      teacherPrompt: '«Внутренний резистор 20 кОм надёжно держит потенциал HIGH (5V)»',
    },
    {
      time: '22–35 мин',
      childAction: 'Задание 1: экстренное торможение при digitalRead(2) == LOW',
      teacherPrompt: '«Кнопка нажата — вход замкнулся на ноль! Моторы немедленно стоп»',
    },
    {
      time: '35–45 мин',
      childAction: 'Осциллограф: физика дребезга контактов (Contact Bounce)',
      teacherPrompt: '«Пружина кнопки вибрирует несколько миллисекунд, давая 20 ложных нажатий»',
    },
    {
      time: '45–50 мин',
      childAction: 'Программный антидребезг: фильтр задержкой debounce',
      teacherPrompt: '«Сверяем состояние контакта через 50 мс: если всё ещё LOW, считаем нажатием»',
    },
    {
      time: '50–55 мин',
      childAction: 'Творческий бампер заднего хода с маневром объезда',
      teacherPrompt: '«При касании робот сдаёт назад на 200 мс и разворачивается направо»',
    },
    {
      time: '55–60 мин',
      childAction: 'Рефлексия: цифровая обработка несовершенных датчиков',
      teacherPrompt: '«Почему реальные физические датчики всегда требуют программных фильтров?»',
    },
  ],
  13: [
    {
      time: '0–5 мин',
      childAction: 'Разминка: непрерывный аналоговый мир против дискретных нулей и единиц',
      teacherPrompt: '«Температура, свет и расстояние меняются плавно, а не скачком»',
    },
    {
      time: '5–12 мин',
      childAction: 'Сборка делителя напряжения с фоторезистором на пине A0',
      teacherPrompt: '«Чем ярче свет, тем меньше сопротивление и выше напряжение на входе»',
    },
    {
      time: '12–22 мин',
      childAction: 'Чтение аналогового сигнала: analogRead(A0) возвращает 0..1023',
      teacherPrompt: '«10-битный АЦП преобразует напряжение от 0 до 5 Вольт в 1024 градации»',
    },
    {
      time: '22–35 мин',
      childAction: 'ШИМ (PWM): управление яркостью и скоростью через analogWrite()',
      teacherPrompt: '«Широтно-импульсная модуляция включает питание 490 раз в секунду»',
    },
    {
      time: '35–45 мин',
      childAction: 'Функция масштабирования диапазона map(val, 0, 1023, 0, 255)',
      teacherPrompt: '«Переводим шкалу фотосенсора в шкалу мощности мотора за одну формулу»',
    },
    {
      time: '45–50 мин',
      childAction: 'Автоматический адаптивный прожектор «День / Ночь»',
      teacherPrompt: '«В полной темноте светодиод светит на 100%, при свете солнца гаснет»',
    },
    {
      time: '50–55 мин',
      childAction: 'Калибровка сенсора освещённости под условия комнаты',
      teacherPrompt: '«Зафиксируй максимум света фонариком и минимум при закрытии пальцем»',
    },
    {
      time: '55–60 мин',
      childAction: 'Рефлексия: роль АЦП в автономных машинах',
      teacherPrompt: '«Как автопилот Теслы или марсоход считывает аналоговый мир датчиками?»',
    },
  ],
  14: [
    {
      time: '0–5 мин',
      childAction: 'Разминка: как данные передаются по проводам и Wi-Fi',
      teacherPrompt: '«Каждому компьютеру в сети нужен свой IP-адрес и номер порта сервиса»',
    },
    {
      time: '5–12 мин',
      childAction: 'Запуск TCP слушателя в терминале: nc -l 8080',
      teacherPrompt: '«Утилита netcat открыла порт и ждёт входящих сетевых пакетов»',
    },
    {
      time: '12–22 мин',
      childAction: 'Отправка команды роботу: echo "STEP" | nc localhost 8080',
      teacherPrompt: '«Команда превратилась в сетевой пакет и мгновенно дошла до приёмника»',
    },
    {
      time: '22–35 мин',
      childAction: 'Программа на Си с сокетом: функции socket(), connect(), recv()',
      teacherPrompt: '«Сокет — это виртуальный провод между двумя программами в сети»',
    },
    {
      time: '35–45 мин',
      childAction: 'Защита от потери связи: сторожевой таймер (Keep-Alive Heartbeat)',
      teacherPrompt: '«Если контрольный пакет не пришёл за 2 секунды — экстренный стоп моторов»',
    },
    {
      time: '45–50 мин',
      childAction: 'Анализ сетевого трафика в tcpdump / Wireshark',
      teacherPrompt: '«Посмотри на заголовки IP-пакета: кто отправитель и кто получатель»',
    },
    {
      time: '50–55 мин',
      childAction: 'Удалённое управление: один ученик шлёт команды, второй видит ответ',
      teacherPrompt: '«Ты управляешь роботом по сети так же, как операторы марсохода с Земли»',
    },
    {
      time: '55–60 мин',
      childAction: 'Рефлексия: принципы архитектуры Интернета и IoT',
      teacherPrompt: '«Как протоколы TCP/IP гарантируют доставку команд без потерь?»',
    },
  ],
  15: [
    {
      time: '0–5 мин',
      childAction: 'Постановка финальной миссии: автономный комплекс «Кибер-Маяк»',
      teacherPrompt: '«Объединяем воедино логику алгоритма, язык Си, микроконтроллер и сеть»',
    },
    {
      time: '5–12 мин',
      childAction: 'Архитектурный проект: блочная диаграмма компонентов',
      teacherPrompt: '«Нарисуй связи: датчики ➔ микроконтроллер ➔ ядро C ➔ телеметрия по сети»',
    },
    {
      time: '12–25 мин',
      childAction: 'Задание 1: автономный патрульный обход периметра',
      teacherPrompt: '«Ровер должен пройти все контрольные точки, объезжая стены бампером»',
    },
    {
      time: '25–38 мин',
      childAction: 'Задание 2: захват маяка и включение охранной сигнализации',
      teacherPrompt: '«При выходе к маяку включается световой код и сирена на пьезодинамике»',
    },
    {
      time: '38–48 мин',
      childAction: 'Задание 3: трансляция пакетов телеметрии на пульт оператора',
      teacherPrompt: '«Передавай координаты, оставшийся заряд батареи и статус тревоги»',
    },
    {
      time: '48–53 мин',
      childAction: 'Стресс-тест: симуляция внезапной аварии датчика или обрыва связи',
      teacherPrompt: '«Проверь отказоустойчивость: робот переходит в защищённый аварийный режим»',
    },
    {
      time: '53–57 мин',
      childAction: 'Защита проекта: презентация работающего комплекса преподавателю',
      teacherPrompt: '«Объясни, почему выбраны именно такие алгоритмические и схемные решения»',
    },
    {
      time: '57–60 мин',
      childAction: 'Вручение сертификата инженера-программиста и рефлексия курса',
      teacherPrompt: '«Ты прошёл путь от первых шагов робота до настоящего C и микроконтроллеров!»',
    },
  ],
};

export const TeacherDrawer: React.FC<TeacherDrawerProps> = ({
  currentLessonId,
  currentMissionId,
  missionTitle,
  teacherNote,
  isOpen,
  onToggle,
  onResetAllProgress,
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showFullSchedule, setShowFullSchedule] = useState(false);

  const schedule = LESSON_SCHEDULES[currentLessonId] || LESSON_SCHEDULES[1];

  return (
    <>
      <button
        type="button"
        className="teacher-toggle-btn"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls="teacher-drawer-panel"
        title="Методическая панель для преподавателя"
      >
        <GraduationCap size={18} aria-hidden="true" />
        <span>Преподавателю</span>
        {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>

      {isOpen && (
        <aside
          id="teacher-drawer-panel"
          className="teacher-drawer"
          aria-label="Методические подсказки преподавателя"
        >
          <div className="drawer-header">
            <div className="drawer-title-group">
              <GraduationCap size={20} className="drawer-icon" aria-hidden="true" />
              <h3 className="drawer-title">Методическая шпаргалка</h3>
            </div>
            <button
              type="button"
              className="drawer-close-btn"
              onClick={onToggle}
              aria-label="Свернуть панель преподавателя"
            >
              <X size={18} />
            </button>
          </div>

          <div className="drawer-body">
            {/* Current Mission Context */}
            <div className="teacher-section">
              <div className="section-label">
                <Clock size={16} aria-hidden="true" />
                <span>Текущий этап (Задание {currentMissionId}: {missionTitle})</span>
              </div>
              <div className="timing-pill">Тайминг: {teacherNote.timing}</div>

              <div className="note-card">
                <div className="note-item">
                  <span className="note-heading">Педагогическая цель:</span>
                  <p className="note-text">{teacherNote.goal}</p>
                </div>

                <div className="note-item">
                  <div className="note-subheading">
                    <AlertCircle size={15} className="icon-warn" aria-hidden="true" />
                    <span>Ожидаемая трудность:</span>
                  </div>
                  <p className="note-text">{teacherNote.difficulty}</p>
                </div>

                <div className="note-item">
                  <div className="note-subheading">
                    <HelpCircle size={15} className="icon-info" aria-hidden="true" />
                    <span>Вопросы вместо готовой подсказки:</span>
                  </div>
                  <ul className="guiding-list">
                    {teacherNote.guidingQuestions.map((q, idx) => (
                      <li key={idx}>«{q}»</li>
                    ))}
                  </ul>
                </div>

                <div className="note-item">
                  <div className="note-subheading">
                    <CheckCircle size={15} className="icon-check" aria-hidden="true" />
                    <span>Признаки понимания:</span>
                  </div>
                  <ul className="guiding-list">
                    {teacherNote.understandingSigns.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Course Plan Schedule Accordion */}
            <div className="teacher-section">
              <button
                type="button"
                className="schedule-accordion-btn"
                onClick={() => setShowFullSchedule(!showFullSchedule)}
                aria-expanded={showFullSchedule}
              >
                <span>Сценарий занятия {currentLessonId} (55–60 мин)</span>
                {showFullSchedule ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showFullSchedule && (
                <div className="schedule-table-wrap">
                  <table className="schedule-table">
                    <thead>
                      <tr>
                        <th>Время</th>
                        <th>Действие ребёнка</th>
                        <th>Реплика преподавателя</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((row, idx) => (
                        <tr key={idx}>
                          <td className="schedule-time">{row.time}</td>
                          <td>{row.childAction}</td>
                          <td className="schedule-prompt">{row.teacherPrompt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Danger Zone: Reset Progress */}
            <div className="drawer-reset-section">
              {showConfirmReset ? (
                <div className="confirm-reset-box">
                  <p className="confirm-text">
                    Сбросить весь прогресс и вернуть программу к исходному состоянию?
                  </p>
                  <div className="confirm-actions">
                    <button
                      type="button"
                      className="btn-danger-confirm"
                      onClick={() => {
                        onResetAllProgress();
                        setShowConfirmReset(false);
                      }}
                    >
                      Да, сбросить всё
                    </button>
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setShowConfirmReset(false)}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-reset-drawer"
                  onClick={() => setShowConfirmReset(true)}
                >
                  <RotateCcw size={16} />
                  <span>Сбросить весь прогресс урока</span>
                </button>
              )}
            </div>
          </div>
        </aside>
      )}
    </>
  );
};
