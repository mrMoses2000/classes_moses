import React from 'react';
import { Mission, LessonInfo } from '../types';
import { Check, Compass, Code2, Map } from 'lucide-react';
import './Header.css';

interface HeaderProps {
  lessons: LessonInfo[];
  currentLessonId: number;
  onSelectLesson: (lessonId: number) => void;
  missions: Mission[];
  currentMissionId: number;
  completedMissionIds: number[];
  onSelectMission: (missionId: number) => void;
  onOpenCode: () => void;
  onOpenRoadmap: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lessons,
  currentLessonId,
  onSelectLesson,
  missions,
  currentMissionId,
  completedMissionIds,
  onSelectMission,
  onOpenCode,
  onOpenRoadmap,
}) => {
  const currentLesson = lessons.find((l) => l.id === currentLessonId) || lessons[0];

  return (
    <header className="header-container">
      <div className="header-brand-row">
        <div className="brand-group">
          <div className="brand-icon-wrap" aria-hidden="true">
            <Compass size={24} />
          </div>
          <div>
            <h1 className="brand-title">Робот и код</h1>
            <span className="brand-subtitle">{currentLesson.title}</span>
          </div>
        </div>

        {/* Lesson Switcher */}
        <div
          className="lesson-switcher"
          role="radiogroup"
          aria-label="Выбор темы занятия"
        >
          {lessons.map((lesson) => {
            const isActive = lesson.id === currentLessonId;
            const shortName = lesson.id === 1 ? 'Команды' : 'Повторение';
            return (
              <button
                key={lesson.id}
                type="button"
                id={`btn-lesson-${lesson.id}`}
                role="radio"
                aria-checked={isActive}
                className={`lesson-pill ${isActive ? 'lesson-pill-active' : ''}`}
                onClick={() => onSelectLesson(lesson.id)}
              >
                <span className="pill-badge">{lesson.themeBadge}</span>
                <span className="pill-title">{shortName}</span>
              </button>
            );
          })}
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="header-tool-btn"
            onClick={onOpenCode}
            title="Посмотреть текстовый эквивалент команд"
            aria-label="Показать текстовый вид программы"
          >
            <Code2 size={16} aria-hidden="true" />
            <span>Показать код</span>
          </button>

          <button
            type="button"
            className="header-tool-btn"
            onClick={onOpenRoadmap}
            title="Открыть план курса на 12 уроков"
            aria-label="Открыть дорожную карту курса"
          >
            <Map size={16} aria-hidden="true" />
            <span>План курса</span>
          </button>
        </div>
      </div>

      <nav className="mission-nav" aria-label="Выбор задания">
        <div className="nav-tabs" role="tablist">
          {missions.map((mission, index) => {
            const isSelected = currentMissionId === mission.id;
            const isCompleted = completedMissionIds.includes(mission.id);

            return (
              <button
                key={mission.id}
                role="tab"
                type="button"
                id={`tab-mission-${mission.id}`}
                aria-selected={isSelected}
                aria-controls={`panel-mission-${mission.id}`}
                className={`tab-btn ${isSelected ? 'tab-active' : ''} ${
                  isCompleted ? 'tab-completed' : ''
                }`}
                onClick={() => onSelectMission(mission.id)}
              >
                <span className="tab-number">{index + 1}</span>
                <span className="tab-title">
                  {mission.title.replace(/^Задание \d+\.\s*/, '')}
                </span>
                {isCompleted && (
                  <Check size={14} className="tab-check-icon" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
