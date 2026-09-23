import React from 'react';
import { Mission } from '../types';
import { Check, Compass, Code2, Map, ArrowLeft } from 'lucide-react';
import './Header.css';

interface HeaderProps {
  missions: Mission[];
  currentMissionId: number;
  completedMissionIds: number[];
  onSelectMission: (missionId: number) => void;
  onOpenCode: () => void;
  onOpenRoadmap: () => void;
  onGoToHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  missions,
  currentMissionId,
  completedMissionIds,
  onSelectMission,
  onOpenCode,
  onOpenRoadmap,
  onGoToHome,
}) => {
  return (
    <header className="header-container">
      <div className="header-brand-row">
        <div className="brand-group">
          {onGoToHome && (
            <button
              type="button"
              className="header-home-btn"
              onClick={onGoToHome}
              aria-label="Вернуться на главную страницу курса"
              title="Вернуться на главную страницу курса"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span>О курсе</span>
            </button>
          )}

          <div
            className={`brand-clickable ${onGoToHome ? 'has-action' : ''}`}
            onClick={onGoToHome}
            role={onGoToHome ? 'button' : undefined}
            tabIndex={onGoToHome ? 0 : undefined}
            onKeyDown={
              onGoToHome
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onGoToHome();
                    }
                  }
                : undefined
            }
          >
            <div className="brand-icon-wrap" aria-hidden="true">
              <Compass size={22} />
            </div>
            <div>
              <h1 className="brand-title">Робот и код</h1>
              <span className="brand-subtitle">Занятие 1: Доставь робота к маяку</span>
            </div>
          </div>
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
          {missions.map((mission) => {
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
                <span className="tab-number">{mission.id}</span>
                <span className="tab-title">
                  {mission.title.replace(`Задание ${mission.id}. `, '')}
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
