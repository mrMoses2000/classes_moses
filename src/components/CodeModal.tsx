import React, { useEffect, useRef, useState } from 'react';
import { CommandType } from '../types';
import { X, Copy, Check, Code2 } from 'lucide-react';
import './CodeModal.css';

interface CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandType[];
  missionTitle: string;
  lessonId?: number;
}

export const CodeModal: React.FC<CodeModalProps> = ({
  isOpen,
  onClose,
  commands,
  missionTitle,
  lessonId = 1,
}) => {
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      closeBtnRef.current?.focus();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commandLines =
    commands.length === 0
      ? '    // Программа пока пуста\n'
      : commands
          .map((cmd) => {
            switch (cmd) {
              case 'STEP':
                return '    step();';
              case 'TURN_LEFT':
                return '    turn_left();';
              case 'TURN_RIGHT':
                return '    turn_right();';
              case 'IF_WALL_LEFT':
                return '    if (is_wall_ahead()) { turn_left(); } else { step(); }';
              case 'IF_WALL_RIGHT':
                return '    if (is_wall_ahead()) { turn_right(); } else { step(); }';
            }
          })
          .join('\n');

  const getCodeSnippet = (lesson: number, title: string, lines: string): string => {
    switch (lesson) {
      case 1:
        return `// ${title}
// Занятие 1: Первые команды и строгий порядок выполнения
// Каждая команда заканчивается точкой с запятой ;

#include <robot.h>

void run_mission() {
${lines}
}`;

      case 2:
        return `// ${title}
// Занятие 2: Повторяющиеся команды объединяют в циклы for / while

#include <robot.h>

void run_mission() {
${lines}
}

/* 
 * В языке Си одинаковый блок команд повторяют так:
 * for (int step = 0; step < 3; step++) {
 *     step();
 * }
 * А на плате Arduino функция loop() повторяет код бесконечно!
 */`;

      case 3:
        return `// ${title}
// Занятие 3: Ветвление в языке Си (if / else) по сигналу сенсора

#include <robot.h>

void run_mission() {
${lines}
}

/* 
 * Как процессор Arduino читает сигнал датчика-бампера:
 * if (digitalRead(BUMPER_PIN) == LOW) {
 *     turn_left();  // препятствие обнаружено!
 * } else {
 *     step();       // путь свободен
 * }
 */`;

      case 4:
        return `// ${title}
// Занятие 4: Переменные (int) и состояние робота (счётчик энергии)

#include <stdio.h>
#include <robot.h>

int energy = 6;
int crystals = 0;

void step_with_battery() {
    if (energy <= 0) {
        printf("Авария: батарея разряжена!\\n");
        return;
    }
    step();
    energy--; // уменьшаем запас энергии на 1
}

void run_mission() {
${lines}
}`;

      case 5:
        return `// ${title}
// Занятие 5: От блоков к тексту — синтаксис Си и вывод в консоль

#include <stdio.h>
#include <robot.h>

int main(void) {
    printf("== Запуск программы миссии ==\\n");
${lines}
    printf("Миссия завершена успешно!\\n");
    return 0;
}`;

      case 6:
        return `// ${title}
// Занятие 6: Первый C на компьютере. Компиляция: gcc mission.c -o robot

#include <stdio.h>

int main(int argc, char *argv[]) {
    printf("Робот инициализирован. Выполнение маршрута:\\n");
${lines}
    printf("Код возврата: 0 (успех)\\n");
    return 0;
}`;

      case 7:
        return `// ${title}
// Занятие 7: Ввод данных с клавиатуры (scanf) и проверка условий

#include <stdio.h>
#include <robot.h>

int main(void) {
    int secret_pin = 0;
    printf("Введите PIN доступа к маяку: ");
    if (scanf("%d", &secret_pin) == 1 && secret_pin == 42) {
        printf("Доступ разрешён! Выполняем маршрут:\\n");
${lines}
    } else {
        printf("Ошибка: неверный PIN! Система заблокирована.\\n");
    }
    return 0;
}`;

      case 8:
        return `// ${title}
// Занятие 8: Циклы while и for с проверкой аварийного флага (break)

#include <stdbool.h>
#include <robot.h>

void run_mission() {
    int steps_done = 0;
    bool emergency_stop = false;

    while (steps_done < 10 && !emergency_stop) {
${lines}
        steps_done++;
        if (is_wall_ahead()) {
            emergency_stop = true;
            break; // экстренный выход из цикла
        }
    }
}`;

      case 9:
        return `// ${title}
// Занятие 9: Функции, аргументы и локальные области видимости (scope)

#include <robot.h>

// Модульная функция с параметром шагов
void walk_distance(int cells) {
    for (int i = 0; i < cells; i++) {
        step();
    }
}

void navigate_corner() {
    turn_right();
    step();
}

void run_mission() {
${lines}
}`;

      case 10:
        return `// ${title}
// Занятие 10: Архитектура компьютера — что видит процессор (регистры CPU)
/*
 * Команды C компилируются в машинные инструкции ассемблера:
 * MOV R0, #1       ; загрузить 1 в регистр R0
 * ADD R1, R0, #2   ; R1 = R0 + 2
 * CMP R1, #5       ; сравнить R1 с 5
 * JNE skip_jump    ; переход если не равно
 */

#include <stdint.h>
#include <robot.h>

void run_mission() {
    register uint8_t robot_acc asm("r4") = 0; // переменная в регистре CPU
${lines}
}`;

      case 11:
        return `// ${title}
// Занятие 11: Arduino — первый свет (GPIO, закон Ома, резистор 220 Ом)

#define LED_PIN 13

void setup() {
    pinMode(LED_PIN, OUTPUT);
}

void loop() {
    digitalWrite(LED_PIN, HIGH); // зажечь светодиод (5 Вольт)
    delay(500);                  // ждать 500 мс
    digitalWrite(LED_PIN, LOW);  // погасить светодиод (0 Вольт)
    delay(500);
}

void run_mission() {
${lines}
}`;

      case 12:
        return `// ${title}
// Занятие 12: Arduino — кнопка-бампер и подтяжка INPUT_PULLUP

#define BUMPER_PIN 2
#define MOTOR_PIN  9

void setup() {
    pinMode(BUMPER_PIN, INPUT_PULLUP); // внутренний резистор 20кОм к +5V
    pinMode(MOTOR_PIN, OUTPUT);
}

void loop() {
    int bumper_state = digitalRead(BUMPER_PIN);
    if (bumper_state == LOW) { // кнопка нажата, замкнута на GND!
        digitalWrite(MOTOR_PIN, LOW); // стоп моторы
    }
}

void run_mission() {
${lines}
}`;

      case 13:
        return `// ${title}
// Занятие 13: Arduino — АЦП (0..1023) и ШИМ-яркость (0..255)

#define SENSOR_PIN A0
#define MOTOR_PWM   6

void loop() {
    int raw_light = analogRead(SENSOR_PIN); // 0 .. 1023 (10 бит АЦП)
    // Преобразуем диапазон АЦП в диапазон ШИМ мотора:
    int motor_speed = map(raw_light, 0, 1023, 0, 255);
    analogWrite(MOTOR_PWM, motor_speed);    // ШИМ 490 Гц
}

void run_mission() {
${lines}
}`;

      case 14:
        return `// ${title}
// Занятие 14: Сети — TCP сокеты, пакеты и удалённый терминал
// Тестирование: nc -l 8080 (сервер) и передача команд по сети

#include <stdio.h>
#include <sys/socket.h>
#include <netinet/in.h>

void send_telemetry_packet(int socket_fd, const char *msg) {
    send(socket_fd, msg, strlen(msg), 0);
}

void run_mission() {
    // Выполнение команд полученных по TCP пакету
${lines}
}`;

      case 15:
      default:
        return `// ${title}
// Занятие 15: Проект «Кибер-Маяк» — автономный охранный комплекс C + Arduino

#include <stdio.h>
#include <robot.h>

typedef struct {
    int x;
    int y;
    int battery;
    bool alarm;
} RoverStatus;

RoverStatus rover = { .x = 0, .y = 0, .battery = 100, .alarm = false };

void run_mission() {
    printf("[TELEMETRY] Старт автономного патрулирования\\n");
${lines}
    printf("[TELEMETRY] Патруль завершён без аварий\\n");
}`;
    }
  };

  const getPedagogyNote = (lesson: number) => {
    switch (lesson) {
      case 1:
        return (
          <>
            <strong>Обрати внимание:</strong> Каждая команда заканчивается точкой с запятой <code>;</code>.
            Смысл команд остаётся тем же, что и на игровом поле. На 5–8 занятиях мы научимся писать такие команды словами!
          </>
        );
      case 2:
        return (
          <>
            <strong>Взгляд в будущее:</strong> Чтобы не писать одинаковые команды много раз, в языке Си используют циклы <code>for</code> или <code>while</code>. А на плате Arduino функция <code>loop()</code> повторяет команды бесконечно!
          </>
        );
      case 3:
        return (
          <>
            <strong>Взгляд в будущее:</strong> Конструкция <code>if (...) &#123; ... &#125; else &#123; ... &#125;</code> позволяет роботу принимать решения. В настоящей робототехнике микроконтроллер считывает сигнал датчика через <code>digitalRead()</code> и выбирает ветку алгоритма!
          </>
        );
      case 4:
        return (
          <>
            <strong>Переменные и память:</strong> Слово <code>int</code> обозначает целое число в оперативной памяти компьютера. Операция <code>energy--</code> уменьшает счётчик каждый раз, когда робот совершает действие!
          </>
        );
      case 5:
        return (
          <>
            <strong>Текстовый код:</strong> В отличие от графических блоков, здесь важна каждая скобка <code>&#123; &#125;</code>. Функция <code>printf()</code> выводит текст прямо в окно консоли.
          </>
        );
      case 6:
        return (
          <>
            <strong>Компилятор GCC:</strong> Программа на языке Си превращается в машинный код процессора с помощью компилятора: <code>gcc file.c -o program</code>. Компьютер начинает выполнение с функции <code>main()</code>.
          </>
        );
      case 7:
        return (
          <>
            <strong>Ввод scanf:</strong> Знак амперсанда <code>&amp;</code> передаёт адрес ячейки памяти, куда операционная система запишет введённое пользователем число.
          </>
        );
      case 8:
        return (
          <>
            <strong>Управление циклами:</strong> Команда <code>break</code> позволяет прервать цикл в любой момент — например, если сенсор обнаружил внезапное препятствие на пути.
          </>
        );
      case 9:
        return (
          <>
            <strong>Модульность:</strong> Оформление повторяющихся действий в отдельные функции (например <code>walk_distance()</code>) делает программу надёжной, чистой и понятной коллегам.
          </>
        );
      case 10:
        return (
          <>
            <strong>Архитектура CPU:</strong> Процессор содержит сверхбыстрые ячейки памяти — регистры (R0, R1...). Ассемблер напрямую командует транзисторам процессора.
          </>
        );
      case 11:
        return (
          <>
            <strong>Электроника:</strong> Команда <code>digitalWrite(pin, HIGH)</code> подаёт на контакт 5 Вольт. Резистор 220 Ом защищает светодиод от сгорания по закону Ома ($I = U / R$).
          </>
        );
      case 12:
        return (
          <>
            <strong>Схемотехника:</strong> Режим <code>INPUT_PULLUP</code> включает внутренний подтягивающий резистор микроконтроллера, исключая случайные наводки и помехи на контакте кнопки.
          </>
        );
      case 13:
        return (
          <>
            <strong>Аналоговый сигнал:</strong> АЦП преобразует непрерывное напряжение сенсора в дискретное число от 0 до 1023, а ШИМ регулирует эффективную мощность мотора.
          </>
        );
      case 14:
        return (
          <>
            <strong>Сетевые сокеты:</strong> Данные передаются в виде байтовых пакетов через протокол TCP на указанный IP-адрес и порт, позволяя управлять роботом из любой точки планеты!
          </>
        );
      case 15:
      default:
        return (
          <>
            <strong>Инженерный финал:</strong> Ты объединил алгоритмы, язык Си, микроконтроллер Arduino и сетевые протоколы в единую надежную систему автономного ровера!
          </>
        );
    }
  };

  const codeSnippet = getCodeSnippet(lessonId, missionTitle, commandLines);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-card"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="code-modal-title"
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Code2 size={20} className="modal-title-icon" aria-hidden="true" />
            <h2 id="code-modal-title" className="modal-title">
              Текстовый вид программы
            </h2>
            <span className="badge-honest">Похоже на код</span>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Закрыть окно"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-intro">
            Команды на экране и настоящий код делают одно и то же. Вот как твоя программа
            выглядела бы в текстовом редакторе:
          </p>

          <div className="code-container">
            <div className="code-toolbar">
              <span className="code-filename">mission.c</span>
              <button
                type="button"
                className="code-copy-btn"
                onClick={handleCopy}
                aria-label="Скопировать пример кода"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Скопировано!' : 'Скопировать'}</span>
              </button>
            </div>
            <pre className="code-block">
              <code>{codeSnippet}</code>
            </pre>
          </div>

          <div className="modal-pedagogy-note">
            {getPedagogyNote(lessonId)}
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="modal-action-btn"
            onClick={onClose}
          >
            Вернуться к роботу
          </button>
        </div>
      </div>
    </div>
  );
};
