import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CommandType,
  Coordinate,
  Mission,
  RobotState,
  SimulationResult,
  TerminalStatus,
} from './types';
import { MISSIONS, LESSONS } from './data/missions';
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
  const [currentLessonId, setCurrentLessonId] = useState<number>(1);
  const [currentMissionId, setCurrentMissionId] = useState<number>(1);
  const [completedMissionIds, setCompletedMissionIds] = useState<number[]>([]);
  const [programs, setPrograms] = useState<Record<number, CommandType[]>>(() => {
    const initial: Record<number, CommandType[]> = {};
    for (const m of MISSIONS) {
      initial[m.id] = [...m.initialCommands];
    }
    return initial;
  });

  // Current mission and lesson
  const currentMission: Mission =
    MISSIONS.find((m) => m.id === currentMissionId) || MISSIONS[0];
  const lessonMissions = MISSIONS.filter((m) => m.lessonId === currentLessonId);
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
    const validLessonId = loaded.currentLessonId || 1;
    setCurrentLessonId(validLessonId);
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
      currentLessonId,
      currentMissionId,
      completedMissionIds,
      programs,
    });
  }, [initialLoaded, currentLessonId, currentMissionId, completedMissionIds, programs]);

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
      setCurrentLessonId(target.lessonId);
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

  // Change lesson
  const handleSelectLesson = useCallback(
    (lessonId: number) => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setCurrentLessonId(lessonId);
      const targetMissions = MISSIONS.filter((m) => m.lessonId === lessonId);
      const target = targetMissions[0] || MISSIONS[0];
      setCurrentMissionId(target.id);
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
        const cur = prev[currentMissionId] || [];
        const next = [...cur.slice(0, index), ...cur.slice(index + 1)];
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
        const cur = [...(prev[currentMissionId] || [])];
        const temp = cur[index - 1];
        cur[index - 1] = cur[index];
        cur[index] = temp;
        return { ...prev, [currentMissionId]: cur };
      });
    },
    [currentMissionId, resetAttempt]
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      setPrograms((prev) => {
        const cur = [...(prev[currentMissionId] || [])];
        if (index >= cur.length - 1) return prev;
        resetAttempt();
        const temp = cur[index + 1];
        cur[index + 1] = cur[index];
        cur[index] = temp;
        return { ...prev, [currentMissionId]: cur };
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

  // Full Automated Simulation Run
  const handleRun = useCallback(() => {
    if (isRunning) return;

    if (currentProgram.length === 0) {
      setTerminalStatus('INCOMPLETE');
      setTerminalMessage('В программе нет команд. Добавь команды из панели слева!');
      return;
    }

    // Reset board before animating
    setIsRunning(true);
    setIsPaused(false);
    setIsStepMode(false);
    setStepPointer(0);
    setErrorStepIndex(null);
    setHighlightObstacle(null);
    setTerminalStatus('READY');
    setTerminalMessage('');

    setRobotState(currentMission.startState);
    setVisitedCoords([{ x: currentMission.startState.x, y: currentMission.startState.y }]);

    // Calculate full deterministic trace upfront
    const simResult: SimulationResult = runSimulation(
      currentMission.startState,
      currentProgram,
      {
        gridWidth: currentMission.gridWidth,
        gridHeight: currentMission.gridHeight,
        goal: currentMission.goal,
        obstacles: currentMission.obstacles,
      }
    );

    let currentStep = 0;
    const playNextStep = () => {
      if (currentStep >= simResult.steps.length) {
        setIsRunning(false);
        setActiveStepIndex(null);
        setTerminalStatus(simResult.terminalStatus);
        setTerminalMessage(simResult.terminalMessage);

        if (simResult.success) {
          setCompletedMissionIds((prev) =>
            prev.includes(currentMissionId) ? prev : [...prev, currentMissionId]
          );
        } else if (simResult.failedAtCommandIndex !== null) {
          setErrorStepIndex(simResult.failedAtCommandIndex);
          if (simResult.terminalStatus === 'HIT_WALL') {
            const hitStep = simResult.steps[simResult.failedAtCommandIndex];
            if (hitStep) {
              const forwardOffset =
                hitStep.fromState.direction === 'EAST'
                  ? { x: hitStep.fromState.x + 1, y: hitStep.fromState.y }
                  : hitStep.fromState.direction === 'WEST'
                  ? { x: hitStep.fromState.x - 1, y: hitStep.fromState.y }
                  : hitStep.fromState.direction === 'NORTH'
                  ? { x: hitStep.fromState.x, y: hitStep.fromState.y - 1 }
                  : { x: hitStep.fromState.x, y: hitStep.fromState.y + 1 };
              setHighlightObstacle(forwardOffset);
            }
          }
        }
        return;
      }

      const step = simResult.steps[currentStep];
      setActiveStepIndex(step.stepIndex);
      setRobotState(step.toState);
      setVisitedCoords((prev) => [...prev, { x: step.toState.x, y: step.toState.y }]);

      currentStep++;
      timerRef.current = window.setTimeout(playNextStep, 500);
    };

    timerRef.current = window.setTimeout(playNextStep, 200);
  }, [isRunning, currentProgram, currentMission, currentMissionId]);

  // Step-by-Step Simulation Execution
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
      setCompletedMissionIds((prev) =>
        prev.includes(currentMissionId) ? prev : [...prev, currentMissionId]
      );
    } else if (status === 'HIT_WALL') {
      setIsRunning(false);
      setIsStepMode(false);
      setErrorStepIndex(stepPointer);
      const offset = currentMission.obstacles.find(
        (obs) =>
          obs.x ===
            robotState.x +
            (command === 'STEP'
              ? robotState.direction === 'EAST'
                ? 1
                : robotState.direction === 'WEST'
                ? -1
                : 0
              : 0) &&
          obs.y ===
            robotState.y +
            (command === 'STEP'
              ? robotState.direction === 'SOUTH'
                ? 1
                : robotState.direction === 'NORTH'
                ? -1
                : 0
              : 0)
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
          setCompletedMissionIds((prev) =>
            prev.includes(currentMissionId) ? prev : [...prev, currentMissionId]
          );
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

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger if any modal is active or active element is an input
      if (isCodeOpen || isRoadmapOpen) return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === '1') {
        e.preventDefault();
        handleAddCommand('STEP');
      } else if (e.key === '2') {
        e.preventDefault();
        handleAddCommand('TURN_LEFT');
      } else if (e.key === '3') {
        e.preventDefault();
        handleAddCommand('TURN_RIGHT');
      } else if (e.key === '4' && currentLessonId >= 3) {
        e.preventDefault();
        handleAddCommand('IF_WALL_LEFT');
      } else if (e.key === '5' && currentLessonId >= 3) {
        e.preventDefault();
        handleAddCommand('IF_WALL_RIGHT');
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (!isRunning) {
          handleRun();
        }
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        if (currentProgram.length > 0 && !isRunning) {
          handleRemoveCommand(currentProgram.length - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isCodeOpen,
    isRoadmapOpen,
    isRunning,
    currentLessonId,
    currentProgram.length,
    handleAddCommand,
    handleRun,
    handleRemoveCommand,
  ]);

  // Check whether all missions in the active lesson are completed
  const areAllCompleted = lessonMissions.every((m) => completedMissionIds.includes(m.id));

  // Transition to next mission
  const handleNextMission = () => {
    if (areAllCompleted) {
      setShowReflection(true);
      setIsRoadmapOpen(true);
      return;
    }

    const currentIdx = lessonMissions.findIndex((m) => m.id === currentMissionId);
    if (currentIdx !== -1 && currentIdx < lessonMissions.length - 1) {
      handleSelectMission(lessonMissions[currentIdx + 1].id);
    } else {
      const firstIncomplete = lessonMissions.find((m) => !completedMissionIds.includes(m.id));
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
    const currentIdx = lessonMissions.findIndex((m) => m.id === currentMissionId);
    if (currentIdx === lessonMissions.length - 1) {
      const remaining = lessonMissions.find((m) => !completedMissionIds.includes(m.id));
      if (remaining) {
        const remainingIdx = lessonMissions.findIndex((m) => m.id === remaining.id) + 1;
        return `Перейти к заданию ${remainingIdx} →`;
      }
    }
    return 'Следующее задание →';
  };

  // Reset all progress safely
  const handleResetAllProgress = () => {
    clearStoredProgress();
    setCompletedMissionIds([]);
    const defaultPrograms: Record<number, CommandType[]> = {};
    for (const m of MISSIONS) {
      defaultPrograms[m.id] = [...m.initialCommands];
    }
    setPrograms(defaultPrograms);
    handleSelectMission(lessonMissions[0]?.id || 1);
  };

  const currentMissionIndexInLesson =
    lessonMissions.findIndex((m) => m.id === currentMission.id) + 1;

  return (
    <div className="app-layout">
      {/* Header with Lesson Switcher */}
      <Header
        lessons={LESSONS}
        currentLessonId={currentLessonId}
        onSelectLesson={handleSelectLesson}
        missions={lessonMissions}
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
                <div className="mission-badge">
                  Задание {currentMissionIndexInLesson} из {lessonMissions.length}
                </div>
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
              hasNextMission={true}
              nextButtonLabel={getNextButtonLabel()}
            />
          </section>

          {/* Right Column: Command Palette, Program Sequence & Execution Controls */}
          <section className="right-panel" aria-label="Мастерская команд программы">
            {/* Command Palette */}
            <CommandPalette
              onAddCommand={handleAddCommand}
              disabled={isRunning && !isPaused}
              lessonId={currentLessonId}
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
        currentLessonId={currentLessonId}
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
        lessonId={currentLessonId}
      />

      {/* Roadmap & Reflection Modal */}
      <RoadmapModal
        isOpen={isRoadmapOpen}
        onClose={() => setIsRoadmapOpen(false)}
        showReflection={showReflection && areAllCompleted}
        currentLessonId={currentLessonId}
        onSelectLesson={handleSelectLesson}
      />
    </div>
  );
};
