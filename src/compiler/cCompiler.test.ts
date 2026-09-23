import { describe, it, expect } from 'vitest';
import { compileCCode } from './cCompiler';
import { RobotState } from '../types';
import { GridRules } from '../simulator/engine';

describe('C Compiler for Robot Code', () => {
  const startState: RobotState = { x: 0, y: 2, direction: 'EAST' };
  const rules: GridRules = {
    gridWidth: 5,
    gridHeight: 5,
    goal: { x: 3, y: 2 },
    obstacles: [{ x: 1, y: 1 }],
  };

  it('compiles standard sequential C program and produces all 4 stages', () => {
    const code = `#include <robot.h>

void run_mission() {
    step();
    turn_left();
    step();
}`;

    const result = compileCCode(code, startState, rules);
    expect(result.success).toBe(true);
    expect(result.commands).toEqual(['STEP', 'TURN_LEFT', 'STEP']);
    expect(result.stages.preprocessor.filename).toBe('main.i');
    expect(result.stages.compiler.filename).toBe('main.s');
    expect(result.stages.assembler.filename).toBe('main.o');
    expect(result.stages.linker.filename).toBe('firmware.hex');
    expect(result.stages.compiler.code).toContain('bl step');
    expect(result.stages.compiler.code).toContain('bl turn_left');
  });

  it('supports move_to(x, y) with coordinate navigation', () => {
    const code = `#include <robot.h>

void run_mission() {
    move_to(3, 2);
}`;

    const result = compileCCode(code, startState, rules);
    expect(result.success).toBe(true);
    // From (0, 2) EAST to (3, 2) should be 3 STEPs
    expect(result.commands).toEqual(['STEP', 'STEP', 'STEP']);
  });

  it('supports user-defined custom functions with coordinates', () => {
    const code = `#include <robot.h>

void go_beacon(int x, int y) {
    move_to(x, y);
}

void run_mission() {
    go_beacon(2, 2);
    step();
}`;

    const result = compileCCode(code, startState, rules);
    expect(result.success).toBe(true);
    expect(result.stats.definedFunctions).toContain('go_beacon');
    expect(result.stats.definedFunctions).toContain('run_mission');
    expect(result.commands).toEqual(['STEP', 'STEP', 'STEP']);
  });

  it('catches missing semicolons with accurate line number and helpful advice', () => {
    const code = `#include <robot.h>

void run_mission() {
    step()
    turn_left();
}`;

    const result = compileCCode(code, startState, rules);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.stage).toBe('compiler');
    expect(result.error?.line).toBe(4);
    expect(result.error?.message).toContain('Пропущена точка с запятой');
  });

  it('catches unmatched braces', () => {
    const code = `#include <robot.h>

void run_mission() {
    step();
`;

    const result = compileCCode(code, startState, rules);
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Не закрыто фигурных скобок');
  });

  it('catches out of bounds coordinates in move_to', () => {
    const code = `#include <robot.h>

void run_mission() {
    move_to(10, 2);
}`;

    const result = compileCCode(code, startState, rules);
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('выходят за пределы поля 5×5');
  });
});
