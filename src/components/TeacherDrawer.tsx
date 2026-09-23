import React, { useState } from 'react';
import { TeacherNote } from '../types';
import {
  GraduationCap,
  Clock,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import './TeacherDrawer.css';

interface TeacherDrawerProps {
  currentLessonId: number;
  currentMissionId: number;
  missionTitle: string;
  teacherNote: TeacherNote;
  isOpen: boolean;
  onToggle: () => void;
  onResetAllProgress: () => void;
}

const LESSON_SCHEDULES: Record<number, { time: string; childAction: string; teacherPrompt: string }[]> = {
  1: [
    {
      time: '0–5 мин',
      childAction: 'Scratch-опыт, три команды учителю до карандаша',
      teacherPrompt: '«Я робот: выполню буквально то, что ты скажешь»',
    },
    {
      time: '5–10 мин',
      childAction: 'Предсказывает, куда придёт робот (Задание 1)',
      teacherPrompt: '«Сначала покажи пальцем результат, потом нажми Запустить»',
    },
    {
      time: '10–20 мин',
      childAction: 'Сам составляет маршрут на пустом поле, меняет порядок',
      teacherPrompt: '«Какая команда изменила результат?»',
    },
    {
      time: '20–32 мин',
      childAction: 'Обходит преграду (Задание 2); рисует путь, собирает команды',
      teacherPrompt: '«Сколько раз робот повернёт и где?»',
    },
    {
      time: '32–42 мин',
      childAction: 'Исправляет ошибку в готовом маршруте (Задание 3)',
      teacherPrompt: '«Что программа делает сейчас? Где ожидание разошлось с результатом?»',
    },
    {
      time: '42–50 мин',
      childAction: 'Создаёт свой маршрут для преподавателя; преподаватель проходит',
      teacherPrompt: '«Как проверить, что твоё задание решаемо?»',
    },
    {
      time: '50–57 мин',
      childAction: 'Открывает «Показать код» и сопоставляет команды с текстом',
      teacherPrompt: '«Команды те же; позже мы научимся писать их сами»',
    },
    {
      time: '57–60 мин',
      childAction: 'Рефлексия: понятая идея и план на будущее',
      teacherPrompt: '«Что ты сделаешь первым, если робот поедет не туда?»',
    },
  ],
  2: [
    {
      time: '0–5 мин',
      childAction: 'Разминка «Робот-танцор»: повторяет связку хлопок+присед',
      teacherPrompt: '«Я назвал одно правило и число повторов. В коде это называется цикл»',
    },
    {
      time: '5–12 мин',
      childAction: 'Столкновение с рутиной: набирает 12 команд вручную и устаёт',
      teacherPrompt: '«Удобно ли писать 100 раз одно и то же? Какой кусочек повторяется?»',
    },
    {
      time: '12–22 мин',
      childAction: 'Задание 1: находит шаблон ступеньки [Шаг, Влево, Шаг, Вправо] × 3',
      teacherPrompt: '«Покажи пальцем, где кончается первая ступенька. Куда смотрит робот?»',
    },
    {
      time: '22–33 мин',
      childAction: 'Задание 2: обобщает обход камней в одинаковые волны',
      teacherPrompt: '«Ты уже научил робота обойти первый камень. Сделай то же для второго!»',
    },
    {
      time: '33–43 мин',
      childAction: 'Задание 3: исправляет недолёт счётчика на 1 шаг',
      teacherPrompt: '«Робот выполнил все повторы, но не дошёл. Сам кирпичик сломался или счётчик мал?»',
    },
    {
      time: '43–48 мин',
      childAction: 'Смотрит for в коде и мигающий светодиод Arduino loop()',
      teacherPrompt: '«На плате функция loop() крутит этот кирпичик бесконечно!»',
    },
    {
      time: '48–53 мин',
      childAction: 'Творческое задание: придумывает собственный танец робота',
      teacherPrompt: '«Придумай короткое правило, которое при повторе нарисует узор»',
    },
    {
      time: '53–55 мин',
      childAction: 'Устная рефлексия: объясняет, зачем нужны циклы',
      teacherPrompt: '«Когда цикл удобнее обычных команд?»',
    },
  ],
  3: [
    {
      time: '0–5 мин',
      childAction: 'Разминка «Робот с бампером»: закрывает глаза, выставляет руку-сенсор',
      teacherPrompt: '«Коснулся ладони — поворот, свободно — шаг. Это условие if/else!»',
    },
    {
      time: '5–12 мин',
      childAction: 'Вызов: слепая программа из шагов разбивается о стену',
      teacherPrompt: '«Жёсткий маршрут сломался. Как научить робота проверять путь перед собой?»',
    },
    {
      time: '12–22 мин',
      childAction: 'Задание 1: ветвление «Если стена ➔ Влево, иначе Шаг»',
      teacherPrompt: '«Команда одна, а действия разные: почему на пустом месте шаг, а у камня поворот?»',
    },
    {
      time: '22–35 мин',
      childAction: 'Задание 2: сложный лабиринт с двойной развилкой',
      teacherPrompt: '«Проверь обе развилки пальцем: куда ведёт правый путь, а куда левый?»',
    },
    {
      time: '35–45 мин',
      childAction: 'Задание 3: отладка ложной ветки (замена IF_WALL_RIGHT на LEFT)',
      teacherPrompt: '«Датчик заметил стену, но куда повернул? Почему робот угодил в скалы?»',
    },
    {
      time: '45–50 мин',
      childAction: 'Смотрит if/else в коде и кнопку бампера Arduino digitalRead()',
      teacherPrompt: '«В Си if выбирает ветку. А провод на плате замыкает пин digitalRead()!»',
    },
    {
      time: '50–53 мин',
      childAction: 'Творческое задание: строит лабиринт-ловушку для учителя',
      teacherPrompt: '«Придумай препятствие, которое робот без сенсора не сможет обойти»',
    },
    {
      time: '53–55 мин',
      childAction: 'Выходной вопрос: чем команда с условием умнее обычного шага',
      teacherPrompt: '«В какой именно момент условие меняет поведение робота?»',
    },
  ],
};

export const TeacherDrawer: React.FC<TeacherDrawerProps> = ({
  currentLessonId,
  currentMissionId,
  missionTitle,
  teacherNote,
  isOpen,
  onToggle,
  onResetAllProgress,
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showFullSchedule, setShowFullSchedule] = useState(false);

  const schedule = LESSON_SCHEDULES[currentLessonId] || LESSON_SCHEDULES[1];

  return (
    <>
      <button
        type="button"
        className="teacher-toggle-btn"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls="teacher-drawer-panel"
        title="Методическая панель для преподавателя"
      >
        <GraduationCap size={18} aria-hidden="true" />
        <span>Преподавателю</span>
        {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>

      {isOpen && (
        <aside
          id="teacher-drawer-panel"
          className="teacher-drawer"
          aria-label="Методические подсказки преподавателя"
        >
          <div className="drawer-header">
            <div className="drawer-title-group">
              <GraduationCap size={20} className="drawer-icon" aria-hidden="true" />
              <h3 className="drawer-title">Методическая шпаргалка</h3>
            </div>
            <button
              type="button"
              className="drawer-close-btn"
              onClick={onToggle}
              aria-label="Свернуть панель преподавателя"
            >
              <X size={18} />
            </button>
          </div>

          <div className="drawer-body">
            {/* Current Mission Context */}
            <div className="teacher-section">
              <div className="section-label">
                <Clock size={16} aria-hidden="true" />
                <span>Текущий этап (Задание {currentMissionId}: {missionTitle})</span>
              </div>
              <div className="timing-pill">Тайминг: {teacherNote.timing}</div>

              <div className="note-card">
                <div className="note-item">
                  <span className="note-heading">Педагогическая цель:</span>
                  <p className="note-text">{teacherNote.goal}</p>
                </div>

                <div className="note-item">
                  <div className="note-subheading">
                    <AlertCircle size={15} className="icon-warn" aria-hidden="true" />
                    <span>Ожидаемая трудность:</span>
                  </div>
                  <p className="note-text">{teacherNote.difficulty}</p>
                </div>

                <div className="note-item">
                  <div className="note-subheading">
                    <HelpCircle size={15} className="icon-info" aria-hidden="true" />
                    <span>Вопросы вместо готовой подсказки:</span>
                  </div>
                  <ul className="guiding-list">
                    {teacherNote.guidingQuestions.map((q, idx) => (
                      <li key={idx}>«{q}»</li>
                    ))}
                  </ul>
                </div>

                <div className="note-item">
                  <div className="note-subheading">
                    <CheckCircle size={15} className="icon-check" aria-hidden="true" />
                    <span>Признаки понимания:</span>
                  </div>
                  <ul className="guiding-list">
                    {teacherNote.understandingSigns.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Course Plan Schedule Accordion */}
            <div className="teacher-section">
              <button
                type="button"
                className="schedule-accordion-btn"
                onClick={() => setShowFullSchedule(!showFullSchedule)}
                aria-expanded={showFullSchedule}
              >
                <span>Сценарий занятия {currentLessonId} (55–60 мин)</span>
                {showFullSchedule ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showFullSchedule && (
                <div className="schedule-table-wrap">
                  <table className="schedule-table">
                    <thead>
                      <tr>
                        <th>Время</th>
                        <th>Действие ребёнка</th>
                        <th>Реплика преподавателя</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((row, idx) => (
                        <tr key={idx}>
                          <td className="schedule-time">{row.time}</td>
                          <td>{row.childAction}</td>
                          <td className="schedule-prompt">{row.teacherPrompt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Danger Zone: Reset Progress */}
            <div className="drawer-reset-section">
              {showConfirmReset ? (
                <div className="confirm-reset-box">
                  <p className="confirm-text">
                    Сбросить весь прогресс и вернуть программу к исходному состоянию?
                  </p>
                  <div className="confirm-actions">
                    <button
                      type="button"
                      className="btn-danger-confirm"
                      onClick={() => {
                        onResetAllProgress();
                        setShowConfirmReset(false);
                      }}
                    >
                      Да, сбросить всё
                    </button>
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setShowConfirmReset(false)}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-reset-drawer"
                  onClick={() => setShowConfirmReset(true)}
                >
                  <RotateCcw size={16} />
                  <span>Сбросить весь прогресс урока</span>
                </button>
              )}
            </div>
          </div>
        </aside>
      )}
    </>
  );
};
