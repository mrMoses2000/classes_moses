import React from 'react';
import { CommandType } from '../types';
import { ArrowUp, RotateCcw, RotateCw } from 'lucide-react';
import './CommandPalette.css';

interface CommandPaletteProps {
  onAddCommand: (cmd: CommandType) => void;
  disabled?: boolean;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  onAddCommand,
  disabled = false,
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
    </div>
  );
};
