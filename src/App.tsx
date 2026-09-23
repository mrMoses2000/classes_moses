import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CommandType,
  Coordinate,
  Mission,
  RobotState,
  SimulationResult,
  TerminalStatus,
} from './types';
import { MISSIONS } from './data/missions';
import { runSimulation, executeSingleCommand } from './simulator/engine';
import {
  loadStoredProgress,
  saveStoredProgress,
  clearStoredProgress,
} from './storage/progress';
import { Grid } from './components/Grid';
import { CommandPalette } from './components/CommandPalette';
import { ProgramList } from './components/ProgramList';
import { Controls } from './components/Controls';
import { FeedbackBanner } from './components/FeedbackBanner';
import { CodeModal } from './components/CodeModal';
import { RoadmapModal } from './components/RoadmapModal';
import { TeacherDrawer } from './components/TeacherDrawer';
import { Header } from './components/Header';
import { Target, HelpCircle } from 'lucide-react';
import './App.css';

export const App: React.FC = () => {
  // Stored state initialization
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [currentMissionId, setCurrentMissionId] = useState<number>(1);
  const [completedMissionIds, setCompletedMissionIds] = useState<number[]>([]);
  const [programs, setPrograms] = useState<Record<number, CommandType[]>>({
    1: [],
    2: [],
    3: ['STEP', 'TURN_LEFT', 'STEP'],
  });

  // Current mission
  const currentMission: Mission =
    MISSIONS.find((m) => m.id === currentMissionId) || MISSIONS[0];
  const currentProgram = programs[currentMissionId] || [];

  // Simulator playback state
  const [robotState, setRobotState] = useState<RobotState>(currentMission.startState);
  const [visitedCoords, setVisitedCoords] = useState<Coordinate[]>([
    { x: currentMission.startState.x, y: currentMission.startState.y },
  ]);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [errorStepIndex, setErrorStepIndex] = useState<number | null>(null);
  const [highlightObstacle, setHighlightObstacle] = useState<Coordinate | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isStepMode, setIsStepMode] = useState(false);
  const [stepPointer, setStepPointer] = useState<number>(0);

  // Terminal Feedback
  const [terminalStatus, setTerminalStatus] = useState<TerminalStatus>('READY');
  const [terminalMessage, setTerminalMessage] = useState<string>('');

  // Modals & Panels
  const [isCodeOpen, setIsCodeOpen] = useState(false);
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const [isTeacherOpen, setIsTeacherOpen] = useState(false);
  const [showReflection, setShowReflection] = useState(false);

  // Animation timer ref
  const timerRef = useRef<number | null>(null);

  // Load progress once on mount
  useEffect(() => {
    const loaded = loadStoredProgress();
    setCurrentMissionId(loaded.currentMissionId);
    setCompletedMissionIds(loaded.completedMissionIds);
    setPrograms(loaded.programs);

    const m = MISSIONS.find((item) => item.id === loaded.currentMissionId) || MISSIONS[0];
    setRobotState(m.startState);
    setVisitedCoords([{ x: m.startState.x, y: m.startState.y }]);
    setInitialLoaded(true);
  }, []);

  // Save progress on state change
  useEffect(() => {
    if (!initialLoaded) return;
    saveStoredProgress({
      version: 1,
      currentMissionId,
      completedMissionIds,
      programs,
    });
  }, [initialLoaded, currentMissionId, completedMissionIds, programs]);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  // Reset simulator state back to starting position
  const resetAttempt = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
    setIsPaused(false);
    setIsStepMode(false);
    setStepPointer(0);
    setActiveStepIndex(null);
    setErrorStepIndex(null);
    setHighlightObstacle(null);
    setRobotState(currentMission.startState);
    setVisitedCoords([{ x: currentMission.startState.x, y: currentMission.startState.y }]);
    setTerminalStatus('READY');
    setTerminalMessage('');
  }, [currentMission]);

  // Change mission
  const handleSelectMission = useCallback(
    (missionId: number) => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const target = MISSIONS.find((m) => m.id === missionId) || MISSIONS[0];
      setCurrentMissionId(missionId);
      setIsRunning(false);
      setIsPaused(false);
      setIsStepMode(false);
      setStepPointer(0);
      setActiveStepIndex(null);
      setErrorStepIndex(null);
      setHighlightObstacle(null);
      setRobotState(target.startState);
      setVisitedCoords([{ x: target.startState.x, y: target.startState.y }]);
      setTerminalStatus('READY');
      setTerminalMessage('');
    },
    []
  );

  // Command updates
  const handleAddCommand = useCallback(
    (cmd: CommandType) => {
      if (currentProgram.length >= 50) return;
      resetAttempt();
      setPrograms((prev) => ({
        ...prev,
        [currentMissionId]: [...(prev[currentMissionId] || []), cmd],
      }));
    },
    [currentMissionId, currentProgram.length, resetAttempt]
  );

  const handleRemoveCommand = useCallback(
    (index: number) => {
      resetAttempt();
      setPrograms((prev) => {
        const next = [...(prev[currentMissionId] || [])];
        next.splice(index, 1);
        return { ...prev, [currentMissionId]: next };
      });
    },
    [currentMissionId, resetAttempt]
  );

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index === 0) return;
      resetAttempt();
      setPrograms((prev) => {
        const next = [...(prev[currentMissionId] || [])];
        const temp = next[index];
        next[index] = next[index - 1];
        next[index - 1] = temp;
        return { ...prev, [currentMissionId]: next };
      });
    },
    [currentMissionId, resetAttempt]
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      resetAttempt();
      setPrograms((prev) => {
        const next = [...(prev[currentMissionId] || [])];
        if (index >= next.length - 1) return prev;
        const temp = next[index];
        next[index] = next[index + 1];
        next[index + 1] = temp;
        return { ...prev, [currentMissionId]: next };
      });
    },
    [currentMissionId, resetAttempt]
  );

  const handleClearProgram = useCallback(() => {
    resetAttempt();
    setPrograms((prev) => ({
      ...prev,
      [currentMissionId]: [],
    }));
  }, [currentMissionId, resetAttempt]);

  // Full run simulation
  const handleRun = useCallback(() => {
    if (currentProgram.length === 0) return;

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Always start from mission start position
    const start = currentMission.startState;
    setRobotState(start);
    setVisitedCoords([{ x: start.x, y: start.y }]);
    setActiveStepIndex(null);
    setErrorStepIndex(null);
    setHighlightObstacle(null);
    setIsRunning(true);
    setIsPaused(false);
    setIsStepMode(false);
    setTerminalStatus('READY');
    setTerminalMessage('');

    const simResult: SimulationResult = runSimulation(start, currentProgram, {
      gridWidth: currentMission.gridWidth,
      gridHeight: currentMission.gridHeight,
      goal: currentMission.goal,
      obstacles: currentMission.obstacles,
    });

    let currentStepIdx = 0;

    const playNextStep = () => {
      if (currentStepIdx < simResult.steps.length) {
        const step = simResult.steps[currentStepIdx];
        setActiveStepIndex(step.stepIndex);
        setRobotState(step.toState);
        setVisitedCoords((prev) => [...prev, { x: step.toState.x, y: step.toState.y }]);

        if (step.status === 'HIT_WALL') {
          // Highlight the wall obstacle
          const offset = currentMission.obstacles.find(
            (obs) =>
              obs.x === step.fromState.x + (step.command === 'STEP' ? (step.fromState.direction === 'EAST' ? 1 : step.fromState.direction === 'WEST' ? -1 : 0) : 0) &&
              obs.y === step.fromState.y + (step.command === 'STEP' ? (step.fromState.direction === 'SOUTH' ? 1 : step.fromState.direction === 'NORTH' ? -1 : 0) : 0)
          );
          if (offset) setHighlightObstacle(offset);
          setErrorStepIndex(step.stepIndex);
        } else if (step.status === 'OUT_OF_BOUNDS') {
          setErrorStepIndex(step.stepIndex);
        }

        currentStepIdx++;
        timerRef.current = window.setTimeout(playNextStep, 450);
      } else {
        // Animation finished
        setIsRunning(false);
        setTerminalStatus(simResult.terminalStatus);
        setTerminalMessage(simResult.terminalMessage);

        if (simResult.success) {
          setCompletedMissionIds((prev) => {
            const next = prev.includes(currentMissionId) ? prev : [...prev, currentMissionId];
            if (next.includes(1) && next.includes(2) && next.includes(3)) {
              setShowReflection(true);
            }
            return next;
          });
        }
      }
    };

    timerRef.current = window.setTimeout(playNextStep, 150);
  }, [currentMission, currentMissionId, currentProgram]);

  // Step-by-step execution
  const handleStep = useCallback(() => {
    if (currentProgram.length === 0) return;
    if (isRunning && !isStepMode) return; // Do not interrupt automatic animation!

    if (!isStepMode) {
      // Initialize step mode from start
      setIsStepMode(true);
      setIsRunning(true);
      setStepPointer(0);
      setRobotState(currentMission.startState);
      setVisitedCoords([{ x: currentMission.startState.x, y: currentMission.startState.y }]);
      setActiveStepIndex(null);
      setErrorStepIndex(null);
      setHighlightObstacle(null);
      setTerminalStatus('READY');
      setTerminalMessage('Режим по шагам начат. Нажимай «Следующий шаг».');
      return;
    }

    if (stepPointer >= currentProgram.length) {
      setIsRunning(false);
      setIsStepMode(false);
      return;
    }

    const command = currentProgram[stepPointer];
    const stepNumber = stepPointer + 1;
    const isLastCommand = stepPointer + 1 >= currentProgram.length;

    const { nextState, status, message } = executeSingleCommand(
      robotState,
      command,
      {
        gridWidth: currentMission.gridWidth,
        gridHeight: currentMission.gridHeight,
        goal: currentMission.goal,
        obstacles: currentMission.obstacles,
      },
      stepNumber
    );

    setActiveStepIndex(stepPointer);
    setRobotState(nextState);
    setVisitedCoords((prev) => [...prev, { x: nextState.x, y: nextState.y }]);

    if (status === 'GOAL_REACHED') {
      setIsRunning(false);
      setIsStepMode(false);
      setTerminalStatus('SUCCESS');
      setTerminalMessage(`Маяк достигнут на шаге ${stepNumber}! Отличная работа.`);
      setCompletedMissionIds((prev) => {
        const next = prev.includes(currentMissionId) ? prev : [...prev, currentMissionId];
        if (next.includes(1) && next.includes(2) && next.includes(3)) {
          setShowReflection(true);
        }
        return next;
      });
    } else if (status === 'HIT_WALL') {
      setIsRunning(false);
      setIsStepMode(false);
      setErrorStepIndex(stepPointer);
      const offset = currentMission.obstacles.find(
        (obs) =>
          obs.x === robotState.x + (command === 'STEP' ? (robotState.direction === 'EAST' ? 1 : robotState.direction === 'WEST' ? -1 : 0) : 0) &&
          obs.y === robotState.y + (command === 'STEP' ? (robotState.direction === 'SOUTH' ? 1 : robotState.direction === 'NORTH' ? -1 : 0) : 0)
      );
      if (offset) setHighlightObstacle(offset);
      setTerminalStatus('HIT_WALL');
      setTerminalMessage(`Робот упёрся в стену на шаге ${stepNumber}. Попробуй обойти её!`);
    } else if (status === 'OUT_OF_BOUNDS') {
      setIsRunning(false);
      setIsStepMode(false);
      setErrorStepIndex(stepPointer);
      setTerminalStatus('OUT_OF_BOUNDS');
      setTerminalMessage(
        `Робот попытался выйти за край поля на шаге ${stepNumber}. Проверь повороты.`
      );
    } else {
      // status === 'OK'
      if (isLastCommand) {
        // Last command executed, immediately evaluate completion and end step mode
        const isAtGoal =
          nextState.x === currentMission.goal.x && nextState.y === currentMission.goal.y;
        setIsRunning(false);
        setIsStepMode(false);
        if (isAtGoal) {
          setTerminalStatus('SUCCESS');
          setTerminalMessage(`Маяк достигнут на шаге ${stepNumber}! Отличная работа.`);
          setCompletedMissionIds((prev) => {
            const next = prev.includes(currentMissionId) ? prev : [...prev, currentMissionId];
            if (next.includes(1) && next.includes(2) && next.includes(3)) {
              setShowReflection(true);
            }
            return next;
          });
        } else {
          setTerminalStatus('INCOMPLETE');
          setTerminalMessage(
            'Все команды выполнены, но робот ещё не дошёл до маяка. Добавь нужные шаги.'
          );
        }
      } else {
        setStepPointer((p) => p + 1);
        setTerminalMessage(message);
      }
    }
  }, [
    currentMission,
    currentMissionId,
    currentProgram,
    isStepMode,
    stepPointer,
    robotState,
    isRunning,
  ]);

  // Keyboard shortcut support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input, textarea, or if modal is open
      if (
        isCodeOpen ||
        isRoadmapOpen ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === '1') {
        e.preventDefault();
        handleAddCommand('STEP');
      } else if (e.key === '2') {
        e.preventDefault();
        handleAddCommand('TURN_LEFT');
      } else if (e.key === '3') {
        e.preventDefault();
        handleAddCommand('TURN_RIGHT');
      } else if (e.key === ' ' && !isRunning) {
        e.preventDefault();
        handleRun();
      } else if (e.key === 'Backspace' && !isRunning && currentProgram.length > 0) {
        e.preventDefault();
        handleRemoveCommand(currentProgram.length - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isCodeOpen,
    isRoadmapOpen,
    isRunning,
    currentProgram.length,
    handleAddCommand,
    handleRun,
    handleRemoveCommand,
  ]);

  // Check whether all three missions are truly completed
  const areAllCompleted =
    completedMissionIds.includes(1) &&
    completedMissionIds.includes(2) &&
    completedMissionIds.includes(3);

  // Transition to next mission
  const handleNextMission = () => {
    if (areAllCompleted) {
      setShowReflection(true);
      setIsRoadmapOpen(true);
      return;
    }

    if (currentMissionId < 3) {
      handleSelectMission(currentMissionId + 1);
    } else {
      // User is on Mission 3, but mission 1 or 2 is incomplete:
      const firstIncomplete = MISSIONS.find((m) => !completedMissionIds.includes(m.id));
      if (firstIncomplete) {
        handleSelectMission(firstIncomplete.id);
      } else {
        setShowReflection(true);
        setIsRoadmapOpen(true);
      }
    }
  };

  const getNextButtonLabel = () => {
    if (areAllCompleted) {
      return 'Завершить урок и рефлексия →';
    }
    if (currentMissionId === 3) {
      const remaining = MISSIONS.find((m) => !completedMissionIds.includes(m.id));
      if (remaining) {
        return `Перейти к заданию ${remaining.id} →`;
      }
    }
    return 'Следующее задание →';
  };

  // Reset all progress safely
  const handleResetAllProgress = () => {
    clearStoredProgress();
    setCompletedMissionIds([]);
    setPrograms({
      1: [],
      2: [],
      3: ['STEP', 'TURN_LEFT', 'STEP'],
    });
    handleSelectMission(1);
  };

  return (
    <div className="app-layout">
      {/* Header */}
      <Header
        missions={MISSIONS}
        currentMissionId={currentMissionId}
        completedMissionIds={completedMissionIds}
        onSelectMission={handleSelectMission}
        onOpenCode={() => setIsCodeOpen(true)}
        onOpenRoadmap={() => {
          setShowReflection(areAllCompleted);
          setIsRoadmapOpen(true);
        }}
      />

      {/* Main Workshop Area */}
      <main className="main-content" id={`panel-mission-${currentMissionId}`} role="tabpanel">
        <div className="workshop-layout">
          {/* Left Column: Mission Brief & 5x5 Grid */}
          <section className="left-panel" aria-label="Игровое поле робота">
            <div className="mission-card">
              <div className="mission-card-header">
                <div className="mission-badge">Задание {currentMission.id} из 3</div>
                <h2 className="mission-title">{currentMission.subtitle}</h2>
              </div>
              <p className="mission-objective">
                <Target size={18} className="objective-icon" aria-hidden="true" />
                <span>{currentMission.objective}</span>
              </p>
              <div className="mission-hint">
                <HelpCircle size={16} className="hint-icon" aria-hidden="true" />
                <span>{currentMission.hint}</span>
              </div>
            </div>

            <div className="grid-wrapper">
              <Grid
                width={currentMission.gridWidth}
                height={currentMission.gridHeight}
                robot={robotState}
                goal={currentMission.goal}
                obstacles={currentMission.obstacles}
                visitedCoordinates={visitedCoords}
                highlightObstacle={highlightObstacle}
              />
            </div>

            {/* Honest Feedback Banner */}
            <FeedbackBanner
              status={terminalStatus}
              message={terminalMessage}
              onNextMission={handleNextMission}
              hasNextMission={currentMissionId <= 3}
              nextButtonLabel={getNextButtonLabel()}
            />
          </section>

          {/* Right Column: Command Palette, Program Sequence & Execution Controls */}
          <section className="right-panel" aria-label="Мастерская команд программы">
            {/* Command Palette */}
            <CommandPalette
              onAddCommand={handleAddCommand}
              disabled={isRunning && !isPaused}
            />

            {/* Program Sequence List */}
            <ProgramList
              commands={currentProgram}
              activeStepIndex={activeStepIndex}
              errorStepIndex={errorStepIndex}
              onRemoveCommand={handleRemoveCommand}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onClear={handleClearProgram}
              disabled={isRunning && !isPaused}
            />

            {/* Execution Controls */}
            <Controls
              isRunning={isRunning}
              isPaused={isPaused}
              isStepMode={isStepMode}
              canStepForward={stepPointer < currentProgram.length}
              hasCommands={currentProgram.length > 0}
              onRun={handleRun}
              onStep={handleStep}
              onReset={resetAttempt}
            />
          </section>
        </div>
      </main>

      {/* Floating Teacher Toggle & Drawer */}
      <TeacherDrawer
        currentMissionId={currentMissionId}
        missionTitle={currentMission.title}
        teacherNote={currentMission.teacherNote}
        isOpen={isTeacherOpen}
        onToggle={() => setIsTeacherOpen(!isTeacherOpen)}
        onResetAllProgress={handleResetAllProgress}
      />

      {/* Code Representation Modal */}
      <CodeModal
        isOpen={isCodeOpen}
        onClose={() => setIsCodeOpen(false)}
        commands={currentProgram}
        missionTitle={currentMission.title}
      />

      {/* Roadmap & Reflection Modal */}
      <RoadmapModal
        isOpen={isRoadmapOpen}
        onClose={() => setIsRoadmapOpen(false)}
        showReflection={showReflection && areAllCompleted}
      />
    </div>
  );
};
