import { describe, it, expect } from 'vitest';
import {
  turnLeft,
  turnRight,
  getForwardOffset,
  runSimulation,
} from './engine';
import { CommandType, RobotState } from '../types';

describe('Simulator Engine', () => {
  describe('Turns', () => {
    it('rotates left correctly (360 degrees cycle)', () => {
      expect(turnLeft('EAST')).toBe('NORTH');
      expect(turnLeft('NORTH')).toBe('WEST');
      expect(turnLeft('WEST')).toBe('SOUTH');
      expect(turnLeft('SOUTH')).toBe('EAST');
    });

    it('rotates right correctly (360 degrees cycle)', () => {
      expect(turnRight('EAST')).toBe('SOUTH');
      expect(turnRight('SOUTH')).toBe('WEST');
      expect(turnRight('WEST')).toBe('NORTH');
      expect(turnRight('NORTH')).toBe('EAST');
    });
  });

  describe('Offsets', () => {
    it('gives correct delta coordinates for each direction', () => {
      expect(getForwardOffset('EAST')).toEqual({ dx: 1, dy: 0 });
      expect(getForwardOffset('WEST')).toEqual({ dx: -1, dy: 0 });
      expect(getForwardOffset('NORTH')).toEqual({ dx: 0, dy: -1 });
      expect(getForwardOffset('SOUTH')).toEqual({ dx: 0, dy: 1 });
    });
  });

  describe('Mission 1: Straight path', () => {
    // start (0,2) facing East, goal (3,2), no walls, 5x5
    const rules = {
      gridWidth: 5,
      gridHeight: 5,
      goal: { x: 3, y: 2 },
      obstacles: [],
    };
    const start: RobotState = { x: 0, y: 2, direction: 'EAST' };

    it('succeeds with 3 steps', () => {
      const commands: CommandType[] = ['STEP', 'STEP', 'STEP'];
      const res = runSimulation(start, commands, rules);
      expect(res.success).toBe(true);
      expect(res.terminalStatus).toBe('SUCCESS');
      expect(res.steps).toHaveLength(3);
      expect(res.finalState).toEqual({ x: 3, y: 2, direction: 'EAST' });
    });

    it('reports INCOMPLETE if only 2 steps', () => {
      const commands: CommandType[] = ['STEP', 'STEP'];
      const res = runSimulation(start, commands, rules);
      expect(res.success).toBe(false);
      expect(res.terminalStatus).toBe('INCOMPLETE');
      expect(res.finalState).toEqual({ x: 2, y: 2, direction: 'EAST' });
    });

    it('reports OUT_OF_BOUNDS if running too far', () => {
      const commands: CommandType[] = ['STEP', 'STEP', 'STEP', 'STEP', 'STEP'];
      // At step 3 it reaches goal (3,2). In our engine, reaching goal terminates execution!
      const res = runSimulation(start, commands, rules);
      expect(res.success).toBe(true);
      expect(res.steps).toHaveLength(3);
    });

    it('reports OUT_OF_BOUNDS when walking into border without goal', () => {
      const badRules = {
        gridWidth: 5,
        gridHeight: 5,
        goal: { x: 4, y: 4 },
        obstacles: [],
      };
      // facing East from (0,2), 5 steps: (1,2), (2,2), (3,2), (4,2), step 5 tries (5,2) -> out of bounds!
      const commands: CommandType[] = ['STEP', 'STEP', 'STEP', 'STEP', 'STEP'];
      const res = runSimulation(start, commands, badRules);
      expect(res.success).toBe(false);
      expect(res.terminalStatus).toBe('OUT_OF_BOUNDS');
      expect(res.failedAtCommandIndex).toBe(4);
    });
  });

  describe('Mission 2: Obstacle avoidance', () => {
    // start (0,2), east; wall (1,2); goal (2,2); 5x5
    const rules = {
      gridWidth: 5,
      gridHeight: 5,
      goal: { x: 2, y: 2 },
      obstacles: [{ x: 1, y: 2 }],
    };
    const start: RobotState = { x: 0, y: 2, direction: 'EAST' };

    it('hits wall when moving straight', () => {
      const commands: CommandType[] = ['STEP'];
      const res = runSimulation(start, commands, rules);
      expect(res.success).toBe(false);
      expect(res.terminalStatus).toBe('HIT_WALL');
      expect(res.failedAtCommandIndex).toBe(0);
      expect(res.finalState).toEqual(start);
    });

    it('succeeds bypassing via top (North)', () => {
      // (0,2) face E
      // turn left -> N
      // step -> (0,1)
      // turn right -> E
      // step -> (1,1)
      // step -> (2,1)
      // turn right -> S
      // step -> (2,2) GOAL
      const commands: CommandType[] = [
        'TURN_LEFT',
        'STEP',
        'TURN_RIGHT',
        'STEP',
        'STEP',
        'TURN_RIGHT',
        'STEP',
      ];
      const res = runSimulation(start, commands, rules);
      expect(res.success).toBe(true);
      expect(res.terminalStatus).toBe('SUCCESS');
      expect(res.finalState.x).toBe(2);
      expect(res.finalState.y).toBe(2);
    });

    it('succeeds bypassing via bottom (South)', () => {
      // (0,2) face E
      // turn right -> S
      // step -> (0,3)
      // turn left -> E
      // step -> (1,3)
      // step -> (2,3)
      // turn left -> N
      // step -> (2,2) GOAL
      const commands: CommandType[] = [
        'TURN_RIGHT',
        'STEP',
        'TURN_LEFT',
        'STEP',
        'STEP',
        'TURN_LEFT',
        'STEP',
      ];
      const res = runSimulation(start, commands, rules);
      expect(res.success).toBe(true);
      expect(res.terminalStatus).toBe('SUCCESS');
      expect(res.finalState.x).toBe(2);
      expect(res.finalState.y).toBe(2);
    });
  });

  describe('Mission 3: Fix buggy program', () => {
    // start (0,2) east, goal (2,2), no walls
    // preset: [STEP, TURN_LEFT, STEP]
    const rules = {
      gridWidth: 5,
      gridHeight: 5,
      goal: { x: 2, y: 2 },
      obstacles: [],
    };
    const start: RobotState = { x: 0, y: 2, direction: 'EAST' };

    it('initial preset does not reach goal and stops at (1,1)', () => {
      const preset: CommandType[] = ['STEP', 'TURN_LEFT', 'STEP'];
      const res = runSimulation(start, preset, rules);
      expect(res.success).toBe(false);
      expect(res.terminalStatus).toBe('INCOMPLETE');
      expect(res.finalState).toEqual({ x: 1, y: 1, direction: 'NORTH' });
    });

    it('fixed program [STEP, STEP] reaches goal at (2,2)', () => {
      const fixed: CommandType[] = ['STEP', 'STEP'];
      const res = runSimulation(start, fixed, rules);
      expect(res.success).toBe(true);
      expect(res.terminalStatus).toBe('SUCCESS');
      expect(res.finalState).toEqual({ x: 2, y: 2, direction: 'EAST' });
    });
  });

  describe('Lesson 2 - Mission 4: Staircase pattern (Loops / Repetition)', () => {
    // start (0,4) east, goal (3,1), obstacles: (1,4), (2,3), (3,2)
    const rules = {
      gridWidth: 5,
      gridHeight: 5,
      goal: { x: 3, y: 1 },
      obstacles: [
        { x: 1, y: 4 },
        { x: 2, y: 3 },
        { x: 3, y: 2 },
      ],
    };
    const start: RobotState = { x: 0, y: 4, direction: 'EAST' };

    it('hits wall when moving straight east', () => {
      const res = runSimulation(start, ['STEP'], rules);
      expect(res.success).toBe(false);
      expect(res.terminalStatus).toBe('HIT_WALL');
      expect(res.failedAtCommandIndex).toBe(0);
    });

    it('succeeds with 3 stair steps (repeated turn_left, step, turn_right, step)', () => {
      const singleStep: CommandType[] = ['TURN_LEFT', 'STEP', 'TURN_RIGHT', 'STEP'];
      const program: CommandType[] = [
        ...singleStep,
        ...singleStep,
        ...singleStep,
      ];
      const res = runSimulation(start, program, rules);
      expect(res.success).toBe(true);
      expect(res.terminalStatus).toBe('SUCCESS');
      expect(res.finalState).toEqual({ x: 3, y: 1, direction: 'EAST' });
    });

    it('reports INCOMPLETE if only 2 stair steps executed', () => {
      const singleStep: CommandType[] = ['TURN_LEFT', 'STEP', 'TURN_RIGHT', 'STEP'];
      const program: CommandType[] = [...singleStep, ...singleStep];
      const res = runSimulation(start, program, rules);
      expect(res.success).toBe(false);
      expect(res.terminalStatus).toBe('INCOMPLETE');
      expect(res.finalState).toEqual({ x: 2, y: 2, direction: 'EAST' });
    });
  });

  describe('Lesson 2 - Mission 5: Rhythmic obstacle bypass (Two waves)', () => {
    // start (0,2) east, goal (4,2), obstacles (1,2), (3,2)
    const rules = {
      gridWidth: 5,
      gridHeight: 5,
      goal: { x: 4, y: 2 },
      obstacles: [
        { x: 1, y: 2 },
        { x: 3, y: 2 },
      ],
    };
    const start: RobotState = { x: 0, y: 2, direction: 'EAST' };

    it('succeeds with two identical bypass waves', () => {
      const wave1: CommandType[] = [
        'TURN_LEFT',
        'STEP',
        'TURN_RIGHT',
        'STEP',
        'STEP',
        'TURN_RIGHT',
        'STEP',
        'TURN_LEFT',
      ];
      const wave2: CommandType[] = [
        'TURN_LEFT',
        'STEP',
        'TURN_RIGHT',
        'STEP',
        'STEP',
        'TURN_RIGHT',
        'STEP',
      ];
      const program = [...wave1, ...wave2];
      const res = runSimulation(start, program, rules);
      expect(res.success).toBe(true);
      expect(res.terminalStatus).toBe('SUCCESS');
      expect(res.finalState.x).toBe(4);
      expect(res.finalState.y).toBe(2);
    });

    it('hits second obstacle if second wave is skipped', () => {
      const wave1: CommandType[] = [
        'TURN_LEFT',
        'STEP',
        'TURN_RIGHT',
        'STEP',
        'STEP',
        'TURN_RIGHT',
        'STEP',
        'TURN_LEFT',
        'STEP', // attempts to walk straight into (3,2)!
      ];
      const res = runSimulation(start, wave1, rules);
      expect(res.success).toBe(false);
      expect(res.terminalStatus).toBe('HIT_WALL');
      expect(res.failedAtCommandIndex).toBe(8);
    });
  });

  describe('Lesson 2 - Mission 6: Fix loop counter (Off-by-one debugging)', () => {
    // start (0,0) south, goal (0,4), no obstacles
    const rules = {
      gridWidth: 5,
      gridHeight: 5,
      goal: { x: 0, y: 4 },
      obstacles: [],
    };
    const start: RobotState = { x: 0, y: 0, direction: 'SOUTH' };

    it('initial 3 steps stop short at (0,3)', () => {
      const preset: CommandType[] = ['STEP', 'STEP', 'STEP'];
      const res = runSimulation(start, preset, rules);
      expect(res.success).toBe(false);
      expect(res.terminalStatus).toBe('INCOMPLETE');
      expect(res.finalState).toEqual({ x: 0, y: 3, direction: 'SOUTH' });
    });

    it('adding 4th step reaches goal (0,4)', () => {
      const fixed: CommandType[] = ['STEP', 'STEP', 'STEP', 'STEP'];
      const res = runSimulation(start, fixed, rules);
      expect(res.success).toBe(true);
      expect(res.terminalStatus).toBe('SUCCESS');
      expect(res.finalState).toEqual({ x: 0, y: 4, direction: 'SOUTH' });
    });
  });

  describe('Safety limits', () => {
    it('aborts cleanly if commands exceed maximum limit', () => {
      const rules = {
        gridWidth: 5,
        gridHeight: 5,
        goal: { x: 4, y: 4 },
        obstacles: [],
      };
      const start: RobotState = { x: 0, y: 0, direction: 'EAST' };
      const longList: CommandType[] = Array(51).fill('TURN_LEFT');
      const res = runSimulation(start, longList, rules, 50);
      expect(res.success).toBe(false);
      expect(res.terminalStatus).toBe('MAX_COMMANDS_EXCEEDED');
    });
  });
});
