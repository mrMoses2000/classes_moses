import {
  CommandType,
  Coordinate,
  Direction,
  RobotState,
  SimulationResult,
  SimulationStep,
  StepStatus,
} from '../types';

export const MAX_COMMANDS_LIMIT = 50;

export function turnLeft(direction: Direction): Direction {
  switch (direction) {
    case 'NORTH':
      return 'WEST';
    case 'WEST':
      return 'SOUTH';
    case 'SOUTH':
      return 'EAST';
    case 'EAST':
      return 'NORTH';
  }
}

export function turnRight(direction: Direction): Direction {
  switch (direction) {
    case 'NORTH':
      return 'EAST';
    case 'EAST':
      return 'SOUTH';
    case 'SOUTH':
      return 'WEST';
    case 'WEST':
      return 'NORTH';
  }
}

export function getForwardOffset(direction: Direction): { dx: number; dy: number } {
  switch (direction) {
    case 'NORTH':
      return { dx: 0, dy: -1 };
    case 'EAST':
      return { dx: 1, dy: 0 };
    case 'SOUTH':
      return { dx: 0, dy: 1 };
    case 'WEST':
      return { dx: -1, dy: 0 };
  }
}

export function isOutOfBounds(coord: Coordinate, width: number, height: number): boolean {
  return coord.x < 0 || coord.x >= width || coord.y < 0 || coord.y >= height;
}

export function isObstacle(coord: Coordinate, obstacles: Coordinate[]): boolean {
  return obstacles.some((obs) => obs.x === coord.x && obs.y === coord.y);
}

export function isGoal(coord: Coordinate, goal: Coordinate): boolean {
  return coord.x === goal.x && coord.y === goal.y;
}

export interface GridRules {
  gridWidth: number;
  gridHeight: number;
  goal: Coordinate;
  obstacles: Coordinate[];
}

export function executeSingleCommand(
  currentState: RobotState,
  command: CommandType,
  rules: GridRules,
  stepNumber: number
): { nextState: RobotState; status: StepStatus; message: string } {
  if (command === 'TURN_LEFT') {
    const nextDir = turnLeft(currentState.direction);
    const nextState: RobotState = { ...currentState, direction: nextDir };
    return {
      nextState,
      status: 'OK',
      message: `Шаг ${stepNumber}: робот повернул налево`,
    };
  }

  if (command === 'TURN_RIGHT') {
    const nextDir = turnRight(currentState.direction);
    const nextState: RobotState = { ...currentState, direction: nextDir };
    return {
      nextState,
      status: 'OK',
      message: `Шаг ${stepNumber}: робот повернул направо`,
    };
  }

  // command === 'STEP'
  const offset = getForwardOffset(currentState.direction);
  const targetCoord: Coordinate = {
    x: currentState.x + offset.dx,
    y: currentState.y + offset.dy,
  };

  if (isOutOfBounds(targetCoord, rules.gridWidth, rules.gridHeight)) {
    return {
      nextState: currentState,
      status: 'OUT_OF_BOUNDS',
      message: `Робот попытался выйти за край поля на шаге ${stepNumber}.`,
    };
  }

  if (isObstacle(targetCoord, rules.obstacles)) {
    return {
      nextState: currentState,
      status: 'HIT_WALL',
      message: `Робот упёрся в стену на шаге ${stepNumber}.`,
    };
  }

  const nextState: RobotState = {
    x: targetCoord.x,
    y: targetCoord.y,
    direction: currentState.direction,
  };

  if (isGoal(targetCoord, rules.goal)) {
    return {
      nextState,
      status: 'GOAL_REACHED',
      message: `Робот добрался до маяка на шаге ${stepNumber}!`,
    };
  }

  return {
    nextState,
    status: 'OK',
    message: `Шаг ${stepNumber}: робот шагнул вперёд.`,
  };
}

export function runSimulation(
  startState: RobotState,
  commands: CommandType[],
  rules: GridRules,
  maxCommands = MAX_COMMANDS_LIMIT
): SimulationResult {
  const steps: SimulationStep[] = [];
  let currentState: RobotState = { ...startState };

  if (commands.length === 0) {
    const alreadyAtGoal = isGoal(startState, rules.goal);
    return {
      success: alreadyAtGoal,
      steps: [],
      finalState: startState,
      terminalStatus: alreadyAtGoal ? 'SUCCESS' : 'INCOMPLETE',
      terminalMessage: alreadyAtGoal
        ? 'Робот уже на маяке!'
        : 'Добавь команды в программу и нажми «Запустить».',
      failedAtCommandIndex: null,
    };
  }

  if (commands.length > maxCommands) {
    return {
      success: false,
      steps: [],
      finalState: startState,
      terminalStatus: 'MAX_COMMANDS_EXCEEDED',
      terminalMessage: `В программе слишком много команд (${commands.length}). Максимум — ${maxCommands}.`,
      failedAtCommandIndex: maxCommands,
    };
  }

  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    const stepNumber = i + 1;
    const fromState = { ...currentState };
    const { nextState, status, message } = executeSingleCommand(
      currentState,
      command,
      rules,
      stepNumber
    );

    steps.push({
      stepIndex: i,
      command,
      fromState,
      toState: nextState,
      status,
      message,
    });

    currentState = nextState;

    if (status === 'GOAL_REACHED') {
      return {
        success: true,
        steps,
        finalState: currentState,
        terminalStatus: 'SUCCESS',
        terminalMessage: `Маяк достигнут за ${stepNumber} ${pluralSteps(stepNumber)}! Отличная работа.`,
        failedAtCommandIndex: null,
      };
    }

    if (status === 'HIT_WALL') {
      return {
        success: false,
        steps,
        finalState: currentState,
        terminalStatus: 'HIT_WALL',
        terminalMessage: `Робот упёрся в стену на шаге ${stepNumber}. Попробуй обойти её!`,
        failedAtCommandIndex: i,
      };
    }

    if (status === 'OUT_OF_BOUNDS') {
      return {
        success: false,
        steps,
        finalState: currentState,
        terminalStatus: 'OUT_OF_BOUNDS',
        terminalMessage: `Робот попытался выйти за край поля на шаге ${stepNumber}. Проверь повороты.`,
        failedAtCommandIndex: i,
      };
    }
  }

  const reachedGoalAtEnd = isGoal(currentState, rules.goal);
  if (reachedGoalAtEnd) {
    return {
      success: true,
      steps,
      finalState: currentState,
      terminalStatus: 'SUCCESS',
      terminalMessage: 'Маяк достигнут! Программа выполнена успешно.',
      failedAtCommandIndex: null,
    };
  }

  return {
    success: false,
    steps,
    finalState: currentState,
    terminalStatus: 'INCOMPLETE',
    terminalMessage:
      'Все команды выполнены, но робот ещё не дошёл до маяка. Добавь нужные шаги.',
    failedAtCommandIndex: null,
  };
}

function pluralSteps(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'шагов';
  if (mod10 === 1) return 'шаг';
  if (mod10 >= 2 && mod10 <= 4) return 'шага';
  return 'шагов';
}
