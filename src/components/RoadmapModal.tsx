import React, { useEffect, useRef } from 'react';
import {
  ROADMAP_LESSONS,
  REFLECTION_QUESTIONS,
  COURSE_FINAL_SKILL,
  COURSE_ROADMAP_NOTE,
} from '../data/roadmap';
import { Map, X, Sparkles, MessageCircleQuestion, Target } from 'lucide-react';
import './RoadmapModal.css';

interface RoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  showReflection?: boolean;
  currentLessonId?: number;
  onSelectLesson?: (lessonId: number) => void;
}

export const RoadmapModal: React.FC<RoadmapModalProps> = ({
  isOpen,
  onClose,
  showReflection = false,
  currentLessonId = 1,
  onSelectLesson,
}) => {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      closeBtnRef.current?.focus();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-card roadmap-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="roadmap-modal-title"
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Map size={22} className="modal-title-icon" aria-hidden="true" />
            <h2 id="roadmap-modal-title" className="modal-title">
              {showReflection
                ? 'Урок завершён! Рефлексия и первые темы курса'
                : 'Первые темы более длинного курса'}
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body roadmap-body">
          {showReflection && (
            <div className="reflection-banner">
              <div className="reflection-title-row">
                <MessageCircleQuestion size={20} className="reflection-icon" aria-hidden="true" />
                <h3 className="reflection-title">Вопросы для обсуждения (рефлексия 57–60 мин):</h3>
              </div>
              <ol className="reflection-list">
                {REFLECTION_QUESTIONS.map((q, idx) => (
                  <li key={idx}>«{q}»</li>
                ))}
              </ol>
            </div>
          )}

          {/* Конечное умение курса */}
          <div className="goal-highlight-card">
            <div className="goal-badge-row">
              <span className="goal-pill">
                <Target size={14} aria-hidden="true" />
                Конечное умение курса
              </span>
            </div>
            <p className="goal-main-text">
              <strong>{COURSE_FINAL_SKILL}</strong>
            </p>
            <p className="goal-subtext">
              {COURSE_ROADMAP_NOTE}
            </p>
          </div>

          <div className="roadmap-grid">
            {ROADMAP_LESSONS.map((lesson) => {
              const isToday = lesson.id === currentLessonId;
              return (
                <div
                  key={lesson.id}
                  className={`roadmap-item ${isToday ? 'roadmap-item-current' : ''} ${
                    onSelectLesson ? 'roadmap-item-clickable' : ''
                  }`}
                  onClick={() => {
                    if (onSelectLesson) {
                      onSelectLesson(lesson.id);
                      onClose();
                    }
                  }}
                  role={onSelectLesson ? 'button' : undefined}
                  tabIndex={onSelectLesson ? 0 : undefined}
                  title={onSelectLesson ? `Перейти к занятию ${lesson.id}` : undefined}
                  onKeyDown={(e) => {
                    if (onSelectLesson && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onSelectLesson(lesson.id);
                      onClose();
                    }
                  }}
                >
                  <div className="lesson-badge-row">
                    <span className="lesson-num">Тема {lesson.id}</span>
                    {isToday && (
                      <span className="badge-today">
                        <Sparkles size={12} aria-hidden="true" />
                        Сегодня
                      </span>
                    )}
                  </div>
                  <h4 className="lesson-title">{lesson.title}</h4>
                  <div className="lesson-detail">
                    <span className="detail-label">Результат:</span> {lesson.practicalResult}
                  </div>
                  <div className="lesson-detail">
                    <span className="detail-label">Переход дальше:</span> {lesson.transitionCondition}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="modal-action-btn" onClick={onClose}>
            Понятно, закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
