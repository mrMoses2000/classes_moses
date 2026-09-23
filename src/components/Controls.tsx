import React from 'react';
import { Play, SkipForward, RotateCcw, Pause } from 'lucide-react';
import './Controls.css';

interface ControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  isStepMode: boolean;
  canStepForward: boolean;
  hasCommands: boolean;
  onRun: () => void;
  onStep: () => void;
  onReset: () => void;
  onPauseResume?: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  isRunning,
  isPaused,
  isStepMode,
  canStepForward,
  hasCommands,
  onRun,
  onStep,
  onReset,
  onPauseResume,
}) => {
  return (
    <div className="controls-container" aria-label="Управление выполнением программы">
      {/* Primary Action Button: Запустить */}
      <button
        type="button"
        className="btn-primary-run"
        onClick={onRun}
        disabled={!hasCommands || (isRunning && !isPaused)}
        title="Запустить выполнение программы робота (Пробел)"
        aria-label="Запустить программу робота"
      >
        <Play size={20} fill="currentColor" aria-hidden="true" />
        <span>Запустить</span>
      </button>

      {/* Step by Step Action */}
      <button
        type="button"
        className="btn-secondary btn-step"
        onClick={onStep}
        disabled={!hasCommands || (isRunning && !isStepMode) || (!canStepForward && isStepMode)}
        title="Выполнить один следующий шаг программы"
        aria-label="Выполнить один шаг программы"
      >
        <SkipForward size={18} aria-hidden="true" />
        <span>{isStepMode ? 'Следующий шаг' : 'По шагам'}</span>
      </button>

      {/* Pause/Resume if running */}
      {isRunning && onPauseResume && (
        <button
          type="button"
          className="btn-secondary"
          onClick={onPauseResume}
          title={isPaused ? 'Продолжить' : 'Пауза'}
          aria-label={isPaused ? 'Продолжить выполнение' : 'Поставить на паузу'}
        >
          {isPaused ? <Play size={18} /> : <Pause size={18} />}
          <span>{isPaused ? 'Продолжить' : 'Пауза'}</span>
        </button>
      )}

      {/* Reset Attempt Action */}
      <button
        type="button"
        className="btn-secondary btn-reset"
        onClick={onReset}
        title="Вернуть робота в начальную точку задания"
        aria-label="Сбросить попытку и вернуть робота на старт"
      >
        <RotateCcw size={18} aria-hidden="true" />
        <span>Сбросить попытку</span>
      </button>
    </div>
  );
};
