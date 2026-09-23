import React from 'react';
import { CommandType } from '../types';
import {
  ArrowUp,
  RotateCcw,
  RotateCw,
  ChevronUp,
  ChevronDown,
  Trash2,
  XCircle,
} from 'lucide-react';
import './ProgramList.css';

interface ProgramListProps {
  commands: CommandType[];
  activeStepIndex: number | null;
  errorStepIndex: number | null;
  onRemoveCommand: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onClear: () => void;
  disabled?: boolean;
}

export const ProgramList: React.FC<ProgramListProps> = ({
  commands,
  activeStepIndex,
  errorStepIndex,
  onRemoveCommand,
  onMoveUp,
  onMoveDown,
  onClear,
  disabled = false,
}) => {
  const getCommandInfo = (cmd: CommandType) => {
    switch (cmd) {
      case 'STEP':
        return {
          label: 'Шаг вперёд',
          icon: <ArrowUp size={16} aria-hidden="true" />,
          code: 'step()',
        };
      case 'TURN_LEFT':
        return {
          label: 'Повернуть налево',
          icon: <RotateCcw size={16} aria-hidden="true" />,
          code: 'turn_left()',
        };
      case 'TURN_RIGHT':
        return {
          label: 'Повернуть направо',
          icon: <RotateCw size={16} aria-hidden="true" />,
          code: 'turn_right()',
        };
    }
  };

  return (
    <div className="program-container">
      <div className="program-header">
        <div className="program-title-row">
          <span className="program-title">Программа</span>
          <span className="program-count" aria-live="polite">
            {commands.length} / 50
          </span>
        </div>
        {commands.length > 0 && (
          <button
            type="button"
            className="clear-button"
            onClick={onClear}
            disabled={disabled}
            title="Очистить все команды"
            aria-label="Очистить всю программу"
          >
            <XCircle size={14} aria-hidden="true" />
            <span>Очистить</span>
          </button>
        )}
      </div>

      <div className="program-scroll-area">
        {commands.length === 0 ? (
          <div className="program-empty">
            <p className="empty-title">В программе пока нет команд</p>
            <p className="empty-hint">
              Выбери команду выше или нажми клавишу 1, 2 или 3, чтобы робот начал движение.
            </p>
          </div>
        ) : (
          <ol className="program-list" aria-label="Список команд программы">
            {commands.map((cmd, index) => {
              const info = getCommandInfo(cmd);
              const isActive = activeStepIndex === index;
              const isError = errorStepIndex === index;

              return (
                <li
                  key={`${index}-${cmd}`}
                  className={`program-item ${isActive ? 'item-active' : ''} ${
                    isError ? 'item-error' : ''
                  }`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  <span className="item-index">{index + 1}.</span>
                  <div className="item-icon-wrap">{info.icon}</div>
                  <span className="item-label">{info.label}</span>

                  <div className="item-actions">
                    <button
                      type="button"
                      className="item-btn"
                      onClick={() => onMoveUp(index)}
                      disabled={disabled || index === 0}
                      title="Поднять команду выше"
                      aria-label={`Переместить команду ${index + 1} выше`}
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      className="item-btn"
                      onClick={() => onMoveDown(index)}
                      disabled={disabled || index === commands.length - 1}
                      title="Опустить команду ниже"
                      aria-label={`Переместить команду ${index + 1} ниже`}
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      type="button"
                      className="item-btn item-btn-delete"
                      onClick={() => onRemoveCommand(index)}
                      disabled={disabled}
                      title="Удалить команду"
                      aria-label={`Удалить команду ${index + 1}: ${info.label}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
};
