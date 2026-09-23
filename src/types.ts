export type Direction = 'NORTH' | 'EAST' | 'SOUTH' | 'WEST';

export type CommandType = 'STEP' | 'TURN_LEFT' | 'TURN_RIGHT';

export interface CommandItem {
  id: string;
  type: CommandType;
}

export interface Coordinate {
  x: number;
  y: number;
}

export interface RobotState {
  x: number;
  y: number;
  direction: Direction;
}

export type StepStatus = 'OK' | 'GOAL_REACHED' | 'HIT_WALL' | 'OUT_OF_BOUNDS';

export interface SimulationStep {
  stepIndex: number;
  command: CommandType;
  fromState: RobotState;
  toState: RobotState;
  status: StepStatus;
  message: string;
}

export type TerminalStatus =
  | 'READY'
  | 'SUCCESS'
  | 'HIT_WALL'
  | 'OUT_OF_BOUNDS'
  | 'INCOMPLETE'
  | 'MAX_COMMANDS_EXCEEDED';

export interface SimulationResult {
  success: boolean;
  steps: SimulationStep[];
  finalState: RobotState;
  terminalStatus: TerminalStatus;
  terminalMessage: string;
  failedAtCommandIndex: number | null;
}

export interface TeacherNote {
  goal: string;
  difficulty: string;
  guidingQuestions: string[];
  understandingSigns: string[];
  timing: string;
}

export interface LessonInfo {
  id: number;
  title: string;
  subtitle: string;
  themeBadge: string;
}

export interface Mission {
  id: number;
  lessonId: number;
  title: string;
  subtitle: string;
  objective: string;
  hint: string;
  gridWidth: number;
  gridHeight: number;
  startState: RobotState;
  goal: Coordinate;
  obstacles: Coordinate[];
  initialCommands: CommandType[];
  teacherNote: TeacherNote;
}

export interface RoadmapLesson {
  id: number;
  title: string;
  practicalResult: string;
  transitionCondition: string;
}
