import React from 'react';
import { CommandType } from '../types';
import { ArrowUp, RotateCcw, RotateCw, GitBranch } from 'lucide-react';
import './CommandPalette.css';

interface CommandPaletteProps {
  onAddCommand: (cmd: CommandType) => void;
  disabled?: boolean;
  lessonId?: number;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  onAddCommand,
  disabled = false,
  lessonId = 1,
}) => {
  return (
    <div className="palette-container" aria-label="Панель добавления команд">
      <div className="palette-label">Добавить команду:</div>
      <div className="palette-buttons">
        <button
          type="button"
          className="palette-button"
          onClick={() => onAddCommand('STEP')}
          disabled={disabled}
          title="Добавить команду «Шаг» (клавиша 1)"
          aria-label="Добавить команду Шаг вперёд (клавиша 1)"
        >
          <ArrowUp className="palette-icon" aria-hidden="true" size={20} />
          <span className="palette-button-text">Шаг</span>
          <kbd className="palette-kbd" aria-hidden="true">1</kbd>
        </button>

        <button
          type="button"
          className="palette-button"
          onClick={() => onAddCommand('TURN_LEFT')}
          disabled={disabled}
          title="Добавить команду «Повернуть налево» (клавиша 2)"
          aria-label="Добавить команду Повернуть налево (клавиша 2)"
        >
          <RotateCcw className="palette-icon" aria-hidden="true" size={20} />
          <span className="palette-button-text">Повернуть налево</span>
          <kbd className="palette-kbd" aria-hidden="true">2</kbd>
        </button>

        <button
          type="button"
          className="palette-button"
          onClick={() => onAddCommand('TURN_RIGHT')}
          disabled={disabled}
          title="Добавить команду «Повернуть направо» (клавиша 3)"
          aria-label="Добавить команду Повернуть направо (клавиша 3)"
        >
          <RotateCw className="palette-icon" aria-hidden="true" size={20} />
          <span className="palette-button-text">Повернуть направо</span>
          <kbd className="palette-kbd" aria-hidden="true">3</kbd>
        </button>
      </div>

      {lessonId >= 3 && (
        <div className="palette-conditions-group">
          <div className="palette-sublabel">Сенсоры и условия (if / else):</div>
          <div className="palette-buttons palette-buttons-conditions">
            <button
              type="button"
              className="palette-button palette-btn-condition btn-command-condition"
              onClick={() => onAddCommand('IF_WALL_LEFT')}
              disabled={disabled}
              title="Если впереди стена ➔ Влево, иначе Шаг (клавиша 4)"
              aria-label="Если стена ➔ Влево, иначе Шаг (клавиша 4)"
            >
              <GitBranch className="palette-icon icon-condition" aria-hidden="true" size={20} />
              <span className="palette-button-text">Если стена ➔ Влево, иначе Шаг</span>
              <kbd className="palette-kbd" aria-hidden="true">4</kbd>
            </button>

            <button
              type="button"
              className="palette-button palette-btn-condition btn-command-condition"
              onClick={() => onAddCommand('IF_WALL_RIGHT')}
              disabled={disabled}
              title="Если впереди стена ➔ Вправо, иначе Шаг (клавиша 5)"
              aria-label="Если стена ➔ Вправо, иначе Шаг (клавиша 5)"
            >
              <GitBranch className="palette-icon icon-condition" aria-hidden="true" size={20} />
              <span className="palette-button-text">Если стена ➔ Вправо, иначе Шаг</span>
              <kbd className="palette-kbd" aria-hidden="true">5</kbd>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
