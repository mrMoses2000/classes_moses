import React, { useEffect, useRef } from 'react';
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
  const [copied, setCopied] = React.useState(false);
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

  const codeSnippet =
    lessonId === 3
      ? `// ${missionTitle}
// Ветвление в языке Си (if / else): выбор действия по сигналу датчика

#include <robot.h>

void run_mission() {
${commandLines}
}

/* 
 * Как процессор Arduino читает сигнал датчика-бампера:
 * if (digitalRead(BUMPER_PIN) == LOW) {
 *     turn_left();  // препятствие обнаружено!
 * } else {
 *     step();       // путь свободен
 * }
 */`
      : lessonId === 2
      ? `// ${missionTitle}
// В языке Си повторяющиеся действия объединяют в циклы с помощью for:

#include <robot.h>

void run_mission() {
${commandLines}
}

/* 
 * Как этот же алгоритм можно записать через цикл for:
 * for (int step = 0; step < 3; step++) {
 *     // повторяющийся кусочек команд
 * }
 */`
      : `// ${missionTitle}
// Похоже на код на языке Си:
// В текстовом виде те же самые команды пишутся словами на английском со скобками ()

#include <robot.h>

void run_mission() {
${commandLines}
}`;

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
            {lessonId === 3 ? (
              <>
                <strong>Взгляд в будущее:</strong> Конструкция <code>if (...) &#123; ... &#125; else &#123; ... &#125;</code> позволяет роботу принимать решения. В настоящей робототехнике микроконтроллер считывает сигнал датчика через <code>digitalRead()</code> и выбирает ветку алгоритма!
              </>
            ) : lessonId === 2 ? (
              <>
                <strong>Взгляд в будущее:</strong> Чтобы не писать одинаковые команды много раз, в языке Си используют циклы <code>for</code> или <code>while</code>. А на плате Arduino функция <code>loop()</code> повторяет команды бесконечно!
              </>
            ) : (
              <>
                <strong>Обрати внимание:</strong> Каждая команда заканчивается точкой с запятой <code>;</code>.
                Смысл команд остаётся тем же, что и на игровом поле. На 5–8 занятиях мы научимся писать такие команды словами!
              </>
            )}
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
