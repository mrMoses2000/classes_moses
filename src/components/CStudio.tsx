import React, { useState, useEffect, useRef } from 'react';
import { CommandType, Coordinate, RobotState } from '../types';
import { GridRules } from '../simulator/engine';
import {
  compileCCode,
  CompilationResult,
} from '../compiler/cCompiler';
import {
  Code2,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Binary,
  Layers,
  Cpu,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import './CStudio.css';

interface CStudioProps {
  initialCommands: CommandType[];
  startState: RobotState;
  gridRules: GridRules;
  missionTitle: string;
  onApplyCompiledCommands: (commands: CommandType[]) => void;
  onRunSimulation: (commands?: CommandType[]) => void;
  disabled?: boolean;
}

export function generateDefaultCCode(
  commands: CommandType[],
  missionTitle: string,
  goal?: Coordinate
): string {
  const commandLines =
    commands.length === 0
      ? '    // Напиши команды роботу или используй координаты:\n    // move_to(x, y);\n    step();'
      : commands
          .map((cmd) => {
            switch (cmd) {
              case 'STEP':
                return '    step();';
              case 'TURN_LEFT':
                return '    turn_left();';
              case 'TURN_RIGHT':
                return '    turn_right();';
              case 'IF_WALL_LEFT':
                return '    if_wall_turn_left();';
              case 'IF_WALL_RIGHT':
                return '    if_wall_turn_right();';
            }
          })
          .join('\n');

  const coordComment = goal
    ? `\n    // Подсказка: функция с координатами маяка:\n    // move_to(${goal.x}, ${goal.y});`
    : '';

  return `// ${missionTitle}
// Программа управления автономным роботом на языке Си

#include <robot.h>

// Ты можешь объявлять собственные функции с координатами:
void deliver_to(int target_x, int target_y) {
    move_to(target_x, target_y);
}

void run_mission() {
${commandLines}${coordComment}
}
`;
}

export const CStudio: React.FC<CStudioProps> = ({
  initialCommands,
  startState,
  gridRules,
  missionTitle,
  onApplyCompiledCommands,
  onRunSimulation,
  disabled = false,
}) => {
  const [code, setCode] = useState<string>(() =>
    generateDefaultCCode(initialCommands, missionTitle, gridRules.goal)
  );
  const [compilationResult, setCompilationResult] = useState<CompilationResult | null>(null);
  const [activeStageId, setActiveStageId] = useState<
    'source' | 'preprocessor' | 'compiler' | 'assembler' | 'linker'
  >('source');
  const [isCompilingAnim, setIsCompilingAnim] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync default code when mission changes
  useEffect(() => {
    setCode(generateDefaultCCode(initialCommands, missionTitle, gridRules.goal));
    setCompilationResult(null);
    setActiveStageId('source');
  }, [missionTitle]);

  const handleCompile = (autoRun: boolean = false) => {
    setIsCompilingAnim(true);

    setTimeout(() => {
      const res = compileCCode(code, startState, gridRules);
      setCompilationResult(res);
      setIsCompilingAnim(false);

      if (res.success) {
        onApplyCompiledCommands(res.commands);
        if (autoRun) {
          setTimeout(() => {
            onRunSimulation(res.commands);
          }, 80);
        }
      } else {
        setActiveStageId('compiler');
      }
    }, 250);
  };

  const handleInsertSnippet = (snippet: string) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = code.substring(0, start);
    const after = code.substring(end);

    const newCode = before + snippet + after;
    setCode(newCode);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + snippet.length;
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab key support
    if (e.key === 'Tab') {
      e.preventDefault();
      handleInsertSnippet('    ');
      return;
    }
    // Ctrl+Enter or Cmd+Enter to compile and run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleCompile(true);
    }
  };

  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 8) }, (_, i) => i + 1);

  return (
    <div className="cstudio-container" aria-label="Среда разработки Си и компилятор">
      {/* Studio Header Toolbar */}
      <div className="cstudio-header">
        <div className="cstudio-title-group">
          <Code2 size={20} className="icon-studio-title" aria-hidden="true" />
          <span className="cstudio-title">Редактор кода Си (C99 / GCC)</span>
          <span className="cstudio-badge">Текстовый режим</span>
        </div>

        <div className="cstudio-header-actions">
          <button
            type="button"
            className="btn-sync-blocks"
            onClick={() =>
              setCode(generateDefaultCCode(initialCommands, missionTitle, gridRules.goal))
            }
            title="Сгенерировать C код из текущих блоков миссии"
          >
            <RotateCcw size={14} />
            <span>К образцу</span>
          </button>
        </div>
      </div>

      {/* Snippet Insertion Quick Buttons */}
      <div className="snippet-bar" role="toolbar" aria-label="Быстрые команды Си">
        <span className="snippet-bar-label">Вставить команду:</span>
        <button
          type="button"
          className="btn-snippet"
          onClick={() => handleInsertSnippet('step();\n')}
          title="Сделать шаг вперёд"
        >
          + step();
        </button>
        <button
          type="button"
          className="btn-snippet"
          onClick={() => handleInsertSnippet('turn_left();\n')}
          title="Повернуть налево"
        >
          + turn_left();
        </button>
        <button
          type="button"
          className="btn-snippet"
          onClick={() => handleInsertSnippet('turn_right();\n')}
          title="Повернуть направо"
        >
          + turn_right();
        </button>
        <button
          type="button"
          className="btn-snippet btn-snippet-coord"
          onClick={() => handleInsertSnippet(`move_to(${gridRules.goal.x}, ${gridRules.goal.y});\n`)}
          title={`Переместиться по координатам к (${gridRules.goal.x}, ${gridRules.goal.y})`}
        >
          <Sparkles size={13} aria-hidden="true" />
          <span>+ move_to({gridRules.goal.x}, {gridRules.goal.y});</span>
        </button>
        <button
          type="button"
          className="btn-snippet"
          onClick={() =>
            handleInsertSnippet(
              'void custom_route() {\n    step();\n    turn_right();\n}\n'
            )
          }
          title="Создать свою вспомогательную функцию"
        >
          + void func()
        </button>
        <button
          type="button"
          className="btn-snippet"
          onClick={() =>
            handleInsertSnippet('for (int i = 0; i < 3; i++) {\n    step();\n}\n')
          }
          title="Вставить цикл for"
        >
          + for (i = 0..)
        </button>
      </div>

      {/* Editor & Line Numbers */}
      <div className="editor-wrap">
        <div className="line-numbers" aria-hidden="true">
          {lineNumbers.map((num) => (
            <div
              key={num}
              className={`line-num ${
                compilationResult?.error?.line === num ? 'line-num-error' : ''
              }`}
            >
              {num}
            </div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          className={`cstudio-textarea ${
            compilationResult && !compilationResult.success ? 'textarea-has-error' : ''
          }`}
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (compilationResult && !compilationResult.success) {
              setCompilationResult(null);
            }
          }}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          disabled={disabled}
          placeholder="// Введи код на языке Си..."
          aria-label="Редактор исходного кода Си"
        />
      </div>

      {/* Main Compile and Run Action Buttons */}
      <div className="compile-action-bar">
        <button
          type="button"
          className={`btn-compile-main ${isCompilingAnim ? 'compiling-pulse' : ''}`}
          onClick={() => handleCompile(true)}
          disabled={disabled || isCompilingAnim}
        >
          <Play size={18} fill="currentColor" />
          <span>Скомпилировать и запустить</span>
          <kbd className="compile-kbd">Ctrl+Enter</kbd>
        </button>

        <button
          type="button"
          className="btn-compile-only"
          onClick={() => handleCompile(false)}
          disabled={disabled || isCompilingAnim}
        >
          <Cpu size={16} />
          <span>Только компиляция</span>
        </button>
      </div>

      {/* Compiler Error Diagnostics Box */}
      {compilationResult && !compilationResult.success && compilationResult.error && (
        <div className="compiler-error-banner" role="alert">
          <div className="error-title-row">
            <AlertTriangle size={18} className="icon-error-warn" />
            <span className="error-headline">
              Ошибка компиляции на строке {compilationResult.error.line}
            </span>
          </div>
          <p className="error-msg-text">{compilationResult.error.message}</p>
          <div className="error-tip-box">
            <Info size={15} className="icon-tip-info" />
            <span className="error-tip-text">
              <strong>Совет:</strong> {compilationResult.error.friendlyTip}
            </span>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {compilationResult && compilationResult.success && (
        <div className="compiler-success-banner">
          <CheckCircle2 size={18} className="icon-success-check" />
          <div className="success-text-wrap">
            <strong>Сборка успешна!</strong> Прошивка скомпилирована ({compilationResult.stats.commandsCount} команд мотора, {compilationResult.stats.machineBytesCount} байт). Робот готов к работе.
          </div>
        </div>
      )}

      {/* 4 STAGES OF COMPILATION VISUAL PIPELINE */}
      <div className="stages-container">
        <div className="stages-header-row">
          <Layers size={16} className="icon-stages-title" />
          <span className="stages-heading">Этапы компиляции программы (GCC Pipeline):</span>
        </div>

        <div className="stages-stepper" role="tablist" aria-label="Этапы компиляции">
          {/* Stage 0: Source */}
          <button
            type="button"
            role="tab"
            aria-selected={activeStageId === 'source'}
            className={`stage-pill ${activeStageId === 'source' ? 'stage-pill-active' : ''}`}
            onClick={() => setActiveStageId('source')}
          >
            <FileCode size={14} />
            <span>1. main.c (Код)</span>
          </button>

          <ArrowRight size={14} className="stage-arrow" aria-hidden="true" />

          {/* Stage 1: Preprocessor */}
          <button
            type="button"
            role="tab"
            aria-selected={activeStageId === 'preprocessor'}
            className={`stage-pill ${
              activeStageId === 'preprocessor' ? 'stage-pill-active' : ''
            } ${compilationResult?.success ? 'stage-pill-success' : ''}`}
            onClick={() => setActiveStageId('preprocessor')}
          >
            <FileCode size={14} />
            <span>2. Препроцессор (.i)</span>
          </button>

          <ArrowRight size={14} className="stage-arrow" aria-hidden="true" />

          {/* Stage 2: Compiler */}
          <button
            type="button"
            role="tab"
            aria-selected={activeStageId === 'compiler'}
            className={`stage-pill ${
              activeStageId === 'compiler' ? 'stage-pill-active' : ''
            } ${
              compilationResult
                ? compilationResult.success
                  ? 'stage-pill-success'
                  : 'stage-pill-error'
                : ''
            }`}
            onClick={() => setActiveStageId('compiler')}
          >
            <Cpu size={14} />
            <span>3. Ассемблер (.s)</span>
          </button>

          <ArrowRight size={14} className="stage-arrow" aria-hidden="true" />

          {/* Stage 3: Assembler to Machine Bytes */}
          <button
            type="button"
            role="tab"
            aria-selected={activeStageId === 'assembler'}
            className={`stage-pill ${
              activeStageId === 'assembler' ? 'stage-pill-active' : ''
            } ${compilationResult?.success ? 'stage-pill-success' : ''}`}
            onClick={() => setActiveStageId('assembler')}
          >
            <Binary size={14} />
            <span>4. Байткод (.o)</span>
          </button>

          <ArrowRight size={14} className="stage-arrow" aria-hidden="true" />

          {/* Stage 4: Linker */}
          <button
            type="button"
            role="tab"
            aria-selected={activeStageId === 'linker'}
            className={`stage-pill ${
              activeStageId === 'linker' ? 'stage-pill-active' : ''
            } ${compilationResult?.success ? 'stage-pill-success' : ''}`}
            onClick={() => setActiveStageId('linker')}
          >
            <Binary size={14} />
            <span>5. Прошивка (.hex)</span>
          </button>
        </div>

        {/* Stage Content Inspector Box */}
        <div className="stage-artifact-box">
          {activeStageId === 'source' && (
            <div className="artifact-content">
              <div className="artifact-toolbar">
                <span className="artifact-filename">main.c (Исходный код ребёнка)</span>
                <span className="artifact-badge">Текст на языке C</span>
              </div>
              <p className="artifact-expl">
                <strong>Как это устроено:</strong> Ты пишешь команды и функции на человеко-понятном языке Си. Компьютер пока не понимает эти слова — ему нужен компилятор, чтобы превратить их в сигналы процессора.
              </p>
              <pre className="artifact-code">
                <code>{code}</code>
              </pre>
            </div>
          )}

          {activeStageId === 'preprocessor' && (
            <div className="artifact-content">
              <div className="artifact-toolbar">
                <span className="artifact-filename">main.i (После препроцессора arm-cpp)</span>
                <span className="artifact-badge">Чистый код C без комментариев</span>
              </div>
              <p className="artifact-expl">
                <strong>Детская аналогия (Шеф-повар):</strong> Препроцессор — как повар, который перед готовкой достает из шкафа библиотеку <code>robot.h</code> (моторы, повороты, координаты) и выбрасывает со стола черновики (все комментарии <code>//</code>).
              </p>
              <pre className="artifact-code">
                <code>
                  {compilationResult
                    ? compilationResult.stages.preprocessor.code
                    : '/* Нажми «Скомпилировать», чтобы увидеть результат работы препроцессора */'}
                </code>
              </pre>
            </div>
          )}

          {activeStageId === 'compiler' && (
            <div className="artifact-content">
              <div className="artifact-toolbar">
                <span className="artifact-filename">main.s (Ассемблер ARM Cortex-M3)</span>
                <span className="artifact-badge">Команды процессора: MOV, BL, POP</span>
              </div>
              <p className="artifact-expl">
                <strong>Детская аналогия (Переводчик):</strong> Компилятор проверяет синтаксис (точки с запятой, фигурные скобки) и переводит слова Си в элементарные приказы чипа: <code>mov</code> (положить в регистр), <code>bl</code> (вызвать мотор).
              </p>
              <pre className="artifact-code">
                <code>
                  {compilationResult
                    ? compilationResult.stages.compiler.code
                    : '/* Нажми «Скомпилировать», чтобы увидеть сгенерированный код на ассемблере */'}
                </code>
              </pre>
            </div>
          )}

          {activeStageId === 'assembler' && (
            <div className="artifact-content">
              <div className="artifact-toolbar">
                <span className="artifact-filename">main.o (Объектный файл / Hex Dump)</span>
                <span className="artifact-badge">Машинный бинарный код</span>
              </div>
              <p className="artifact-expl">
                <strong>Детская аналогия (Типография чипа):</strong> Ассемблер превращает текстовые слова в настоящие байты, нули и единицы. Процессор внутри понимает только электрические импульсы — ток пошел (1) или тока нет (0).
              </p>
              <pre className="artifact-code">
                <code>
                  {compilationResult
                    ? compilationResult.stages.assembler.code
                    : '/* Нажми «Скомпилировать», чтобы увидеть дамп нулей и единиц */'}
                </code>
              </pre>
            </div>
          )}

          {activeStageId === 'linker' && (
            <div className="artifact-content">
              <div className="artifact-toolbar">
                <span className="artifact-filename">firmware.hex (Готовая прошивка)</span>
                <span className="artifact-badge">Intel HEX для чипа Arduino / ARM</span>
              </div>
              <p className="artifact-expl">
                <strong>Детская аналогия (Сборщик на заводе):</strong> Компоновщик сшивает наш файл с реальными моторными платами и генерирует единую прошивку. Именно этот файл по кабелю USB заливается в память робота!
              </p>
              <pre className="artifact-code">
                <code>
                  {compilationResult
                    ? compilationResult.stages.linker.code
                    : '/* Нажми «Скомпилировать», чтобы сгенерировать итоговую прошивку */'}
                </code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
