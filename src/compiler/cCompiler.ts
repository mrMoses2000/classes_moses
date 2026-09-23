import { CommandType, Coordinate, Direction, RobotState } from '../types';
import { GridRules, turnLeft, turnRight, getForwardOffset, isObstacle } from '../simulator/engine';

export interface CompilationStage {
  id: 'preprocessor' | 'compiler' | 'assembler' | 'linker';
  name: string;
  tool: string;
  filename: string;
  code: string;
  description: string;
  analogy: string;
}

export interface CompilationError {
  stage: 'preprocessor' | 'compiler' | 'assembler' | 'linker';
  line: number;
  column?: number;
  message: string;
  friendlyTip: string;
  snippet?: string;
}

export interface CompilationResult {
  success: boolean;
  commands: CommandType[];
  stages: {
    preprocessor: CompilationStage;
    compiler: CompilationStage;
    assembler: CompilationStage;
    linker: CompilationStage;
  };
  error?: CompilationError;
  stats: {
    sourceLines: number;
    commandsCount: number;
    machineBytesCount: number;
    definedFunctions: string[];
  };
}

/**
 * Pathfinding BFS helper to generate step/turn commands for move_to(x, y)
 */
function planPathToCoordinate(
  start: RobotState,
  target: Coordinate,
  rules: GridRules
): { commands: CommandType[]; endState: RobotState } {
  // If already at target
  if (start.x === target.x && start.y === target.y) {
    return { commands: [], endState: { ...start } };
  }

  interface BFSNode {
    state: RobotState;
    commands: CommandType[];
  }

  const queue: BFSNode[] = [{ state: { ...start }, commands: [] }];
  const visited = new Set<string>();
  visited.add(`${start.x},${start.y},${start.direction}`);

  let bestNode: BFSNode | null = null;
  let iterations = 0;
  const MAX_BFS_ITERATIONS = 1000;

  while (queue.length > 0 && iterations < MAX_BFS_ITERATIONS) {
    iterations++;
    const current = queue.shift()!;

    if (current.state.x === target.x && current.state.y === target.y) {
      bestNode = current;
      break;
    }

    if (current.commands.length >= 35) continue;

    // Option 1: Turn Left
    const dirLeft = turnLeft(current.state.direction);
    const keyLeft = `${current.state.x},${current.state.y},${dirLeft}`;
    if (!visited.has(keyLeft)) {
      visited.add(keyLeft);
      queue.push({
        state: { ...current.state, direction: dirLeft },
        commands: [...current.commands, 'TURN_LEFT'],
      });
    }

    // Option 2: Turn Right
    const dirRight = turnRight(current.state.direction);
    const keyRight = `${current.state.x},${current.state.y},${dirRight}`;
    if (!visited.has(keyRight)) {
      visited.add(keyRight);
      queue.push({
        state: { ...current.state, direction: dirRight },
        commands: [...current.commands, 'TURN_RIGHT'],
      });
    }

    // Option 3: Step Forward (if free)
    const offset = getForwardOffset(current.state.direction);
    const nx = current.state.x + offset.dx;
    const ny = current.state.y + offset.dy;

    const inBounds = nx >= 0 && nx < rules.gridWidth && ny >= 0 && ny < rules.gridHeight;
    const blocked = isObstacle({ x: nx, y: ny }, rules.obstacles);

    if (inBounds && !blocked) {
      const keyStep = `${nx},${ny},${current.state.direction}`;
      if (!visited.has(keyStep)) {
        visited.add(keyStep);
        queue.push({
          state: { x: nx, y: ny, direction: current.state.direction },
          commands: [...current.commands, 'STEP'],
        });
      }
    }
  }

  if (bestNode) {
    return { commands: bestNode.commands, endState: bestNode.state };
  }

  // Fallback: simple axis alignment without obstacle guarantee
  const fallbackCmds: CommandType[] = [];
  let curState = { ...start };

  // Align X
  while (curState.x !== target.x) {
    const wantDir: Direction = target.x > curState.x ? 'EAST' : 'WEST';
    while (curState.direction !== wantDir) {
      curState.direction = turnRight(curState.direction);
      fallbackCmds.push('TURN_RIGHT');
    }
    curState.x += wantDir === 'EAST' ? 1 : -1;
    fallbackCmds.push('STEP');
  }

  // Align Y
  while (curState.y !== target.y) {
    const wantDir: Direction = target.y > curState.y ? 'SOUTH' : 'NORTH';
    while (curState.direction !== wantDir) {
      curState.direction = turnRight(curState.direction);
      fallbackCmds.push('TURN_RIGHT');
    }
    curState.y += wantDir === 'SOUTH' ? 1 : -1;
    fallbackCmds.push('STEP');
  }

  return { commands: fallbackCmds, endState: curState };
}

/**
 * Main compilation and execution engine
 */
export function compileCCode(
  sourceCode: string,
  startState: RobotState,
  rules: GridRules
): CompilationResult {
  const sourceLines = sourceCode.split('\n');

  // ==========================================
  // STAGE 1: PREPROCESSOR (`cpp`)
  // ==========================================
  let preprocessedCode = '';
  const macros: Record<string, string> = {};
  let inBlockComment = false;

  const preprocHeader = `/* === robot.h (Библиотека ввода/вывода для робота) === */
extern void step(void);
extern void turn_left(void);
extern void turn_right(void);
extern void move_to(int x, int y);
extern void step_n(int count);
extern int is_wall_ahead(void);
/* ==================================================== */\n\n`;

  for (let i = 0; i < sourceLines.length; i++) {
    let line = sourceLines[i];

    // Handle block comments /* ... */
    if (inBlockComment) {
      const endCommentIdx = line.indexOf('*/');
      if (endCommentIdx !== -1) {
        line = line.substring(endCommentIdx + 2);
        inBlockComment = false;
      } else {
        continue;
      }
    }

    const startCommentIdx = line.indexOf('/*');
    if (startCommentIdx !== -1) {
      const endCommentIdx = line.indexOf('*/', startCommentIdx + 2);
      if (endCommentIdx !== -1) {
        line = line.substring(0, startCommentIdx) + line.substring(endCommentIdx + 2);
      } else {
        line = line.substring(0, startCommentIdx);
        inBlockComment = true;
      }
    }

    // Handle line comments //
    const lineCommentIdx = line.indexOf('//');
    if (lineCommentIdx !== -1) {
      line = line.substring(0, lineCommentIdx);
    }

    const trimmed = line.trim();

    if (trimmed.startsWith('#include')) {
      continue;
    }

    if (trimmed.startsWith('#define')) {
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 3) {
        macros[parts[1]] = parts[2];
      }
      continue;
    }

    // Apply macro expansion
    let expandedLine = line;
    for (const [key, val] of Object.entries(macros)) {
      expandedLine = expandedLine.replace(new RegExp(`\\b${key}\\b`, 'g'), val);
    }

    preprocessedCode += expandedLine + '\n';
  }

  const finalPreprocessed = preprocHeader + preprocessedCode.trim();

  // ==========================================
  // STAGE 2: COMPILER (`cc1` / Grammar & Syntax Analysis)
  // ==========================================

  // Check balanced braces
  let braceDepth = 0;
  for (let i = 0; i < sourceLines.length; i++) {
    const rawLine = sourceLines[i];
    const cleanLine = rawLine.replace(/\/\/.*/, '').replace(/\/\*.*?\*\//g, '');
    for (let c = 0; c < cleanLine.length; c++) {
      if (cleanLine[c] === '{') braceDepth++;
      if (cleanLine[c] === '}') braceDepth--;
      if (braceDepth < 0) {
        return buildErrorResult(
          'compiler',
          i + 1,
          'Лишняя закрывающая фигурная скобка "}"',
          'Проверь баланс скобок: закрывающая скобка "}" встретилась раньше открывающей "{"',
          rawLine,
          sourceLines.length,
          finalPreprocessed
        );
      }
    }
  }

  if (braceDepth > 0) {
    return buildErrorResult(
      'compiler',
      sourceLines.length,
      `Не закрыто фигурных скобок: ${braceDepth}`,
      'В конце программы не хватает закрывающей фигурной скобки "}". Каждая функция должна заканчиваться скобкой "}"',
      sourceLines[sourceLines.length - 1] || '}',
      sourceLines.length,
      finalPreprocessed
    );
  }

  // Parse Functions
  interface FunctionDef {
    name: string;
    params: string[];
    bodyLines: { text: string; origLineNumber: number }[];
  }

  const functions: Record<string, FunctionDef> = {};
  let currentFunc: FunctionDef | null = null;
  let inFuncBraces = 0;

  for (let i = 0; i < sourceLines.length; i++) {
    const origLineNum = i + 1;
    const rawLine = sourceLines[i];
    const cleanLine = rawLine.replace(/\/\/.*/, '').replace(/\/\*.*?\*\//g, '').trim();

    if (!cleanLine) continue;

    // Check function signature: void name(...) { or int name(...) {
    const funcMatch = cleanLine.match(/^(?:void|int)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*\{?$/);
    if (funcMatch && inFuncBraces === 0) {
      const funcName = funcMatch[1];
      const paramList = funcMatch[2]
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p && p !== 'void');

      currentFunc = {
        name: funcName,
        params: paramList,
        bodyLines: [],
      };
      functions[funcName] = currentFunc;
      inFuncBraces = cleanLine.includes('{') ? 1 : 0;
      continue;
    }

    if (currentFunc) {
      if (inFuncBraces === 0 && cleanLine.startsWith('{')) {
        inFuncBraces = 1;
        continue;
      }

      for (let c = 0; c < cleanLine.length; c++) {
        if (cleanLine[c] === '{') inFuncBraces++;
        if (cleanLine[c] === '}') inFuncBraces--;
      }

      if (inFuncBraces > 0) {
        currentFunc.bodyLines.push({ text: cleanLine, origLineNumber: origLineNum });
      } else {
        // Function ended
        currentFunc = null;
      }
    } else {
      // Code outside any function
      if (!cleanLine.startsWith('#') && cleanLine !== '}' && cleanLine !== '{') {
        return buildErrorResult(
          'compiler',
          origLineNum,
          `Команда "${cleanLine}" находится вне функции`,
          'В языке Си все выполняемые команды должны находиться внутри функций, например внутри "void run_mission() { ... }"',
          rawLine,
          sourceLines.length,
          finalPreprocessed
        );
      }
    }
  }

  // Determine entry function (run_mission or main)
  const entryFuncName = functions['run_mission']
    ? 'run_mission'
    : functions['main']
    ? 'main'
    : Object.keys(functions)[0];

  if (!entryFuncName) {
    return buildErrorResult(
      'compiler',
      1,
      'В программе не найдена главная функция',
      'Опиши главную функцию для робота: "void run_mission() { ... }" или "int main() { ... }"',
      sourceLines[0] || '',
      sourceLines.length,
      finalPreprocessed
    );
  }

  // Execution environment for extracting CommandType[]
  const commands: CommandType[] = [];
  let simState: RobotState = { ...startState };
  const definedFunctions = Object.keys(functions);
  const callStack: string[] = [];

  function executeBody(
    bodyLines: { text: string; origLineNumber: number }[],
    scopeVars: Record<string, number>
  ): CompilationError | null {
    let lineIdx = 0;

    while (lineIdx < bodyLines.length) {
      const { text, origLineNumber } = bodyLines[lineIdx];
      lineIdx++;

      // Check missing semicolon on non-block statements
      if (
        !text.startsWith('for') &&
        !text.startsWith('while') &&
        !text.startsWith('if') &&
        !text.startsWith('else') &&
        !text.endsWith(';') &&
        !text.endsWith('{') &&
        !text.endsWith('}')
      ) {
        return {
          stage: 'compiler',
          line: origLineNumber,
          message: 'Пропущена точка с запятой ";" в конце команды',
          friendlyTip: 'В языке Си каждая отдельная команда должна завершаться точкой с запятой ";"',
          snippet: text,
        };
      }

      const stmt = text.replace(/;$/, '').trim();
      if (!stmt || stmt === '{' || stmt === '}') continue;

      // Statement: step();
      if (stmt === 'step()') {
        commands.push('STEP');
        const offset = getForwardOffset(simState.direction);
        simState = {
          ...simState,
          x: simState.x + offset.dx,
          y: simState.y + offset.dy,
        };
        continue;
      }

      // Statement: turn_left();
      if (stmt === 'turn_left()') {
        commands.push('TURN_LEFT');
        simState = {
          ...simState,
          direction: turnLeft(simState.direction),
        };
        continue;
      }

      // Statement: turn_right();
      if (stmt === 'turn_right()') {
        commands.push('TURN_RIGHT');
        simState = {
          ...simState,
          direction: turnRight(simState.direction),
        };
        continue;
      }

      // Statement: if_wall_turn_left();
      if (stmt === 'if_wall_turn_left()') {
        commands.push('IF_WALL_LEFT');
        continue;
      }

      // Statement: if_wall_turn_right();
      if (stmt === 'if_wall_turn_right()') {
        commands.push('IF_WALL_RIGHT');
        continue;
      }

      // Statement: step_n(count);
      const stepNMatch = stmt.match(/^step_n\s*\(\s*([^)]+)\s*\)$/);
      if (stepNMatch) {
        const valStr = stepNMatch[1].trim();
        const count = scopeVars[valStr] !== undefined ? scopeVars[valStr] : parseInt(valStr, 10);
        if (isNaN(count) || count < 0 || count > 50) {
          return {
            stage: 'compiler',
            line: origLineNumber,
            message: `Некорректное число шагов в step_n: "${valStr}"`,
            friendlyTip: 'Функция step_n(N) принимает положительное число повторов, например step_n(3);',
            snippet: text,
          };
        }
        for (let s = 0; s < count; s++) {
          commands.push('STEP');
          const offset = getForwardOffset(simState.direction);
          simState = {
            ...simState,
            x: simState.x + offset.dx,
            y: simState.y + offset.dy,
          };
        }
        continue;
      }

      // Statement: move_to(x, y);
      const moveMatch = stmt.match(/^move_to\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)$/);
      if (moveMatch) {
        const xArg = moveMatch[1].trim();
        const yArg = moveMatch[2].trim();

        const targetX = scopeVars[xArg] !== undefined ? scopeVars[xArg] : parseInt(xArg, 10);
        const targetY = scopeVars[yArg] !== undefined ? scopeVars[yArg] : parseInt(yArg, 10);

        if (isNaN(targetX) || isNaN(targetY)) {
          return {
            stage: 'compiler',
            line: origLineNumber,
            message: `Функция move_to ожидает 2 координаты, получено: move_to(${xArg}, ${yArg})`,
            friendlyTip: 'Укажи координаты числами от 0 до 4, например: move_to(3, 2);',
            snippet: text,
          };
        }

        if (targetX < 0 || targetX >= rules.gridWidth || targetY < 0 || targetY >= rules.gridHeight) {
          return {
            stage: 'compiler',
            line: origLineNumber,
            message: `Координаты (${targetX}, ${targetY}) выходят за пределы поля 5×5!`,
            friendlyTip: 'Игровое поле робота имеет размер 5 на 5 клеток: координаты от 0 до 4.',
            snippet: text,
          };
        }

        // Plan path
        const planned = planPathToCoordinate(simState, { x: targetX, y: targetY }, rules);
        commands.push(...planned.commands);
        simState = planned.endState;
        continue;
      }

      // Loop: for (int i = 0; i < N; i++)
      const forMatch = stmt.match(/^for\s*\(\s*(?:int\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(\d+)\s*;\s*\1\s*<\s*(\d+)\s*;\s*\1\+\+\s*\)\s*\{?$/);
      if (forMatch) {
        const varName = forMatch[1];
        const startVal = parseInt(forMatch[2], 10);
        const endVal = parseInt(forMatch[3], 10);

        // Collect lines inside loop
        const loopLines: { text: string; origLineNumber: number }[] = [];
        let forBraces = stmt.includes('{') ? 1 : 0;

        while (lineIdx < bodyLines.length) {
          const l = bodyLines[lineIdx];
          lineIdx++;
          if (l.text.includes('{')) forBraces++;
          if (l.text.includes('}')) forBraces--;
          if (forBraces === 0) break;
          loopLines.push(l);
        }

        const loopCount = Math.min(Math.max(0, endVal - startVal), 50);
        for (let iter = 0; iter < loopCount; iter++) {
          const loopScope = { ...scopeVars, [varName]: startVal + iter };
          const err = executeBody(loopLines, loopScope);
          if (err) return err;
        }
        continue;
      }

      // If Statement: if (is_wall_ahead()) { ... } else { ... }
      if (stmt.startsWith('if')) {
        if (stmt.includes('turn_left')) {
          commands.push('IF_WALL_LEFT');
          continue;
        } else if (stmt.includes('turn_right')) {
          commands.push('IF_WALL_RIGHT');
          continue;
        }
      }

      // User function call: my_func(args);
      const callMatch = stmt.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)$/);
      if (callMatch) {
        const calledName = callMatch[1];
        const argStrings = callMatch[2]
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean);

        if (functions[calledName]) {
          if (callStack.includes(calledName)) {
            return {
              stage: 'compiler',
              line: origLineNumber,
              message: `Обнаружена бесконечная рекурсия функции "${calledName}"`,
              friendlyTip: 'Функция не должна бесконечно вызывать саму себя — робот зависнет!',
              snippet: text,
            };
          }

          callStack.push(calledName);
          const funcDef = functions[calledName];
          const funcScope: Record<string, number> = {};

          funcDef.params.forEach((param, pIdx) => {
            const pName = param.split(/\s+/).pop()!;
            const argVal = argStrings[pIdx];
            if (argVal !== undefined) {
              funcScope[pName] = scopeVars[argVal] !== undefined ? scopeVars[argVal] : parseInt(argVal, 10) || 0;
            }
          });

          const err = executeBody(funcDef.bodyLines, funcScope);
          callStack.pop();
          if (err) return err;
          continue;
        } else {
          return {
            stage: 'compiler',
            line: origLineNumber,
            message: `Неизвестная функция: "${calledName}()"`,
            friendlyTip: getTypoSuggestion(calledName),
            snippet: text,
          };
        }
      }

      // Unrecognized statement
      return {
        stage: 'compiler',
        line: origLineNumber,
        message: `Неизвестная инструкция или опечатка: "${stmt}"`,
        friendlyTip: 'Проверь написание команд: step(), turn_left(), turn_right(), move_to(x, y);',
        snippet: text,
      };
    }

    return null;
  }

  // Execute entry point
  const execError = executeBody(functions[entryFuncName].bodyLines, {});
  if (execError) {
    return buildErrorResult(
      execError.stage,
      execError.line,
      execError.message,
      execError.friendlyTip,
      execError.snippet || '',
      sourceLines.length,
      finalPreprocessed
    );
  }

  // ==========================================
  // STAGE 2 ARTIFACT: ASSEMBLY CODE (`main.s`)
  // ==========================================
  let assemblyCode = `/* === GNU ARM / Cortex-M3 Assembler (main.s) === */
.syntax unified
.cpu cortex-m3
.thumb
.section .text
.align 2
`;

  for (const [fName, fDef] of Object.entries(functions)) {
    assemblyCode += `
.global ${fName}
.type ${fName}, %function
${fName}:
    push {r4, r5, lr}          @ сохранить регистры и адрес возврата
`;
    for (const bLine of fDef.bodyLines) {
      if (bLine.text.includes('step()')) {
        assemblyCode += `    bl step                    @ вызов моторов движения вперед\n`;
      } else if (bLine.text.includes('turn_left()')) {
        assemblyCode += `    bl turn_left               @ поворот левого колеса назад\n`;
      } else if (bLine.text.includes('turn_right()')) {
        assemblyCode += `    bl turn_right              @ поворот правого колеса назад\n`;
      } else if (bLine.text.includes('move_to')) {
        const m = bLine.text.match(/move_to\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/);
        const x = m ? m[1].trim() : '0';
        const y = m ? m[2].trim() : '0';
        assemblyCode += `    movs r0, #${x}                @ аргумент X в регистр R0\n`;
        assemblyCode += `    movs r1, #${y}                @ аргумент Y в регистр R1\n`;
        assemblyCode += `    bl move_to                 @ вызов процедуры перемещения по координатам\n`;
      } else if (bLine.text.includes('(') && bLine.text.endsWith(');')) {
        const callee = bLine.text.split('(')[0].trim();
        assemblyCode += `    bl ${callee}               @ вызов пользовательской функции ${callee}\n`;
      }
    }
    assemblyCode += `    pop {r4, r5, pc}           @ восстановить стек и вернуться\n`;
  }

  // ==========================================
  // STAGE 3 ARTIFACT: MACHINE CODE (`main.o`)
  // ==========================================
  let machineHexDump = `/* === ELF Relocatable Object File (main.o) === */\n`;
  machineHexDump += `Offset      00 01 02 03 04 05 06 07  08 09 0A 0B 0C 0D 0E 0F  ASCII\n`;
  machineHexDump += `----------------------------------------------------------------------\n`;

  let offset = 0;
  const hexLines = [
    '7F 45 4C 46 01 01 01 00  00 00 00 00 00 00 00 00  |.ELF............|',
    '01 00 28 00 01 00 00 00  00 00 00 00 00 00 00 00  |..(.............|',
    'B5 30 48 02 E8 00 00 00  20 03 21 02 E8 00 00 00  |..H..... .!. ...|',
    'BD 30 00 00 B5 08 E8 00  00 00 BD 08 00 00 00 00  |................|',
  ];

  for (const hl of hexLines) {
    const offStr = offset.toString(16).padStart(8, '0').toUpperCase();
    machineHexDump += `${offStr}   ${hl}\n`;
    offset += 16;
  }

  // ==========================================
  // STAGE 4 ARTIFACT: FIRMWARE (`firmware.hex`)
  // ==========================================
  const firmwareHex = `:020000040800F2
:1000000000040020090100080D01000811010008C8
:10001000B5304802E800000020032102E8000000BE
:10002000BD300000B508E8000000BD08000000009B
:0400000508000109E5
:00000001FF`;

  return {
    success: true,
    commands,
    stages: {
      preprocessor: {
        id: 'preprocessor',
        name: '1. Препроцессор',
        tool: 'arm-none-eabi-cpp',
        filename: 'main.i',
        code: finalPreprocessed,
        description: 'Раскрывает #include <robot.h>, подставляет константы и убирает комментарии //',
        analogy: 'Шеф-повар распаковывает коробки с ингредиентами и убирает черновики со стола.',
      },
      compiler: {
        id: 'compiler',
        name: '2. Компилятор',
        tool: 'arm-none-eabi-gcc -S',
        filename: 'main.s',
        code: assemblyCode,
        description: 'Проверяет правила языка Си и переводит код на ассемблер (мнемоники MOV, BL, POP)',
        analogy: 'Главный переводчик: превращает человеческие слова Си в элементарные инструкции для чипа.',
      },
      assembler: {
        id: 'assembler',
        name: '3. Ассемблер',
        tool: 'arm-none-eabi-as',
        filename: 'main.o',
        code: machineHexDump,
        description: 'Кодирует команды в реальные нули и единицы — бинарный машинный код процессора',
        analogy: 'Типография микросхемы: превращает слова в электрические сигналы (ток есть = 1, тока нет = 0).',
      },
      linker: {
        id: 'linker',
        name: '4. Компоновщик',
        tool: 'arm-none-eabi-ld',
        filename: 'firmware.hex',
        code: firmwareHex,
        description: 'Сшивает программу с драйверами моторов и создаёт готовую прошивку Intel HEX',
        analogy: 'Мастер на фабрике: соединяет написанный софт с моторами и датчиками в единую готовую систему.',
      },
    },
    stats: {
      sourceLines: sourceLines.length,
      commandsCount: commands.length,
      machineBytesCount: 64 + commands.length * 4,
      definedFunctions,
    },
  };
}

function getTypoSuggestion(name: string): string {
  if (name.includes('step') || name.includes('stp')) {
    return 'Возможно, ты имел в виду функцию "step();" — сделать 1 шаг вперед?';
  }
  if (name.includes('left') || name.includes('lft')) {
    return 'Возможно, ты имел в виду функцию "turn_left();" — повернуть налево?';
  }
  if (name.includes('right') || name.includes('rgt')) {
    return 'Возможно, ты имел в виду функцию "turn_right();" — повернуть направо?';
  }
  if (name.includes('move') || name.includes('coord') || name.includes('goto')) {
    return 'Возможно, ты имел в виду функцию с координатами "move_to(x, y);"?';
  }
  return `Убедись, что функция "${name}()" объявлена выше через "void ${name}() { ... }"`;
}

function buildErrorResult(
  stage: 'preprocessor' | 'compiler' | 'assembler' | 'linker',
  line: number,
  message: string,
  friendlyTip: string,
  snippet: string,
  sourceLineCount: number,
  preprocCode: string
): CompilationResult {
  return {
    success: false,
    commands: [],
    error: {
      stage,
      line,
      message,
      friendlyTip,
      snippet,
    },
    stages: {
      preprocessor: {
        id: 'preprocessor',
        name: '1. Препроцессор',
        tool: 'arm-none-eabi-cpp',
        filename: 'main.i',
        code: preprocCode,
        description: 'Раскрывает #include <robot.h>, подставляет константы и убирает комментарии //',
        analogy: 'Шеф-повар распаковывает коробки с ингредиентами и убирает черновики со стола.',
      },
      compiler: {
        id: 'compiler',
        name: '2. Компилятор',
        tool: 'arm-none-eabi-gcc -S',
        filename: 'main.s',
        code: `/* Ошибка компиляции на строке ${line} */\n/* ${message} */`,
        description: 'Компилятор остановился из-за синтаксической ошибки',
        analogy: 'Переводчик не смог понять фразу: правило языка Си было нарушено.',
      },
      assembler: {
        id: 'assembler',
        name: '3. Ассемблер',
        tool: 'arm-none-eabi-as',
        filename: 'main.o',
        code: '/* Сборка невозможна: исправь ошибку на этапе компилятора */',
        description: 'Ожидает успешной компиляции',
        analogy: 'Типография не может напечатать текст, пока в нем есть грамматические ошибки.',
      },
      linker: {
        id: 'linker',
        name: '4. Компоновщик',
        tool: 'arm-none-eabi-ld',
        filename: 'firmware.hex',
        code: '/* Прошивка не создана */',
        description: 'Ожидает объектный файл',
        analogy: 'Сборщик ждёт готовую деталь.',
      },
    },
    stats: {
      sourceLines: sourceLineCount,
      commandsCount: 0,
      machineBytesCount: 0,
      definedFunctions: [],
    },
  };
}
