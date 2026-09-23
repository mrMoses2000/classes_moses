import React, { useState, useEffect, useRef } from 'react';
import { CommandType, Coordinate, RobotState } from '../types';
import { runSimulation } from '../simulator/engine';
import { Play, RotateCcw, ArrowRight, Compass, Plus, CheckCircle2 } from 'lucide-react';
import './HeroShowcase.css';

interface HeroShowcaseProps {
  onGoToWorkshop: () => void;
}

const START_STATE: RobotState = { x: 0, y: 2, direction: 'EAST' };
const GOAL_COORD: Coordinate = { x: 3, y: 2 };

export const HeroShowcase: React.FC<HeroShowcaseProps> = ({ onGoToWorkshop }) => {
  const [commands, setCommands] = useState<CommandType[]>(['STEP', 'STEP', 'STEP']);
  const [robotState, setRobotState] = useState<RobotState>(START_STATE);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>('Программа из 3 шагов готова к проверке.');
  const [reachedGoal, setReachedGoal] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleReset = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
    setActiveStep(null);
    setRobotState(START_STATE);
    setReachedGoal(false);
    setFeedback('Робот на старте. Нажми «Запустить», чтобы проверить маршрут.');
  };

  const handleAddStep = () => {
    if (isRunning) return;
    if (commands.length >= 6) return;
    handleReset();
    setCommands((prev) => [...prev, 'STEP']);
    setFeedback(`В программе ${commands.length + 1} команд(ы).`);
  };

  const handleRemoveStep = () => {
    if (isRunning || commands.length <= 1) return;
    handleReset();
    setCommands((prev) => prev.slice(0, -1));
    setFeedback(`В программе ${commands.length - 1} команд(ы).`);
  };

  const handleRun = () => {
    if (isRunning || commands.length === 0) return;

    handleReset();
    setIsRunning(true);
    setFeedback('Выполняем команды по очереди...');

    const result = runSimulation(START_STATE, commands, {
      gridWidth: 5,
      gridHeight: 5,
      goal: GOAL_COORD,
      obstacles: [],
    });

    let stepIdx = 0;
    const playNext = () => {
      if (stepIdx < result.steps.length) {
        const step = result.steps[stepIdx];
        setActiveStep(step.stepIndex);
        setRobotState(step.toState);
        stepIdx++;
        timerRef.current = window.setTimeout(playNext, 400);
      } else {
        setIsRunning(false);
        setActiveStep(null);
        if (result.success) {
          setReachedGoal(true);
          setFeedback('Маяк достигнут! Прогноз подтвердился.');
        } else {
          setFeedback(result.terminalMessage);
        }
      }
    };

    timerRef.current = window.setTimeout(playNext, 200);
  };

  // Render cells for 5x5 grid
  const cells = [];
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      const isRobot = robotState.x === x && robotState.y === y;
      const isGoal = GOAL_COORD.x === x && GOAL_COORD.y === y;
      const isStart = START_STATE.x === x && START_STATE.y === y;

      cells.push(
        <div
          key={`${x}-${y}`}
          className={`showcase-cell ${isStart ? 'cell-start' : ''} ${isGoal ? 'cell-goal' : ''}`}
          aria-hidden="true"
        >
          {isGoal && (
            <div className="showcase-goal-badge" title="Маяк (цель)">
              <Compass size={20} className="goal-icon" />
              <span className="goal-label">Маяк</span>
            </div>
          )}
          {isRobot && (
            <div
              className={`showcase-robot robot-dir-${robotState.direction.toLowerCase()}`}
              title="Робот"
            >
              <div className="robot-body">
                <span className="robot-eye" />
                <span className="robot-arrow">▲</span>
              </div>
            </div>
          )}
        </div>
      );
    }
  }

  return (
    <div className="hero-showcase-container" aria-label="Интерактивная витрина симулятора">
      <div className="showcase-header">
        <div className="showcase-title-row">
          <span className="showcase-badge">Живая витрина первого урока</span>
          <span className="showcase-task-name">Поле 5×5 · Задача: дойти до маяка</span>
        </div>
      </div>

      <div className="showcase-body">
        {/* 5x5 Grid */}
        <div className="showcase-grid-wrapper">
          <div className="showcase-grid">{cells}</div>
        </div>

        {/* Mini Workbench Panel */}
        <div className="showcase-panel">
          <div className="showcase-program-bar">
            <span className="program-label">Программа:</span>
            <div className="program-chips">
              {commands.map((_, idx) => (
                <span
                  key={idx}
                  className={`command-chip ${activeStep === idx ? 'chip-active' : ''}`}
                >
                  {idx + 1}. Шаг
                </span>
              ))}
            </div>
          </div>

          <div className="showcase-actions">
            <button
              type="button"
              className="showcase-btn btn-run"
              onClick={handleRun}
              disabled={isRunning}
              title="Запустить программу"
            >
              <Play size={16} aria-hidden="true" />
              <span>Запустить</span>
            </button>

            <button
              type="button"
              className="showcase-btn btn-add"
              onClick={handleAddStep}
              disabled={isRunning || commands.length >= 6}
              title="Добавить команду «Шаг»"
            >
              <Plus size={16} aria-hidden="true" />
              <span>+ Шаг</span>
            </button>

            {commands.length > 3 && (
              <button
                type="button"
                className="showcase-btn btn-remove"
                onClick={handleRemoveStep}
                disabled={isRunning}
                title="Удалить шаг"
              >
                <span>− Шаг</span>
              </button>
            )}

            <button
              type="button"
              className="showcase-btn btn-reset"
              onClick={handleReset}
              title="Вернуть робота на старт"
            >
              <RotateCcw size={16} aria-hidden="true" />
              <span>Сброс</span>
            </button>
          </div>

          <div className={`showcase-feedback ${reachedGoal ? 'feedback-success' : ''}`}>
            {reachedGoal && <CheckCircle2 size={16} className="feedback-icon" aria-hidden="true" />}
            <span>{feedback}</span>
          </div>
        </div>
      </div>

      <div className="showcase-footer">
        <button
          type="button"
          className="showcase-open-workshop-link"
          onClick={onGoToWorkshop}
        >
          <span>Открыть полную мастерскую с 3 миссиями</span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
