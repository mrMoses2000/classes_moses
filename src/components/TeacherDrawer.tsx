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
  currentMissionId: number;
  missionTitle: string;
  teacherNote: TeacherNote;
  isOpen: boolean;
  onToggle: () => void;
  onResetAllProgress: () => void;
}

const LESSON_SCHEDULE = [
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
];

export const TeacherDrawer: React.FC<TeacherDrawerProps> = ({
  currentMissionId,
  missionTitle,
  teacherNote,
  isOpen,
  onToggle,
  onResetAllProgress,
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showFullSchedule, setShowFullSchedule] = useState(false);

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
                <span>Текущий этап (Задание {currentMissionId}): {missionTitle}</span>
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
                <span>Полный сценарий урока (55–60 мин)</span>
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
                      {LESSON_SCHEDULE.map((row, idx) => (
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
