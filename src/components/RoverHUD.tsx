import React from 'react';
import { RobotState, Direction } from '../types';
import { Compass, Cpu, Radio, ShieldAlert, ShieldCheck, Zap } from 'lucide-react';
import './RoverHUD.css';

interface RoverHUDProps {
  robot: RobotState;
  isHitWall: boolean;
  isGoalReached: boolean;
  lessonId: number;
}

export const RoverHUD: React.FC<RoverHUDProps> = ({
  robot,
  isHitWall,
  isGoalReached,
  lessonId,
}) => {
  const getDirectionText = (dir: Direction): { label: string; arrow: string } => {
    switch (dir) {
      case 'EAST':
        return { label: 'Восток', arrow: '→' };
      case 'SOUTH':
        return { label: 'Юг', arrow: '↓' };
      case 'WEST':
        return { label: 'Запад', arrow: '←' };
      case 'NORTH':
        return { label: 'Север', arrow: '↑' };
    }
  };

  const dirInfo = getDirectionText(robot.direction);

  return (
    <div className="rover-hud" role="region" aria-label="Бортовая телеметрия ровера">
      <div className="hud-title-row">
        <div className="hud-title-group">
          <Radio size={14} className="hud-icon-radio" aria-hidden="true" />
          <span className="hud-rover-name">Телеметрия Ровера</span>
        </div>
        <div className="hud-mcu-badge">
          <Cpu size={12} aria-hidden="true" />
          <span>{lessonId >= 11 ? 'Arduino Nano (Pinout)' : 'Бортовой MCU'}</span>
        </div>
      </div>

      <div className="hud-metrics-grid">
        {/* Координаты */}
        <div className="hud-card">
          <span className="hud-card-label">Координаты</span>
          <span className="hud-card-value">
            X: <strong>{robot.x}</strong>, Y: <strong>{robot.y}</strong>
          </span>
        </div>

        {/* Компас */}
        <div className="hud-card">
          <span className="hud-card-label">
            <Compass size={11} aria-hidden="true" /> Курс
          </span>
          <span className="hud-card-value">
            {dirInfo.arrow} {dirInfo.label}
          </span>
        </div>

        {/* Бампер Pin 2 */}
        <div className={`hud-card ${isHitWall ? 'hud-card-alert' : ''}`}>
          <span className="hud-card-label">
            {isHitWall ? (
              <ShieldAlert size={11} className="icon-alert" aria-hidden="true" />
            ) : (
              <ShieldCheck size={11} className="icon-ok" aria-hidden="true" />
            )}
            Бампер (Pin 2)
          </span>
          <span className="hud-card-value">
            {isHitWall ? '🔴 КОНТАКТ' : '🟢 ЧИСТО'}
          </span>
        </div>

        {/* Фара Pin 13 */}
        <div className={`hud-card ${isGoalReached ? 'hud-card-success' : ''}`}>
          <span className="hud-card-label">
            <Zap size={11} aria-hidden="true" /> Фара (Pin 13)
          </span>
          <span className="hud-card-value">
            {isGoalReached ? '💡 ВКЛ (HIGH)' : '⚪ ВЫКЛ'}
          </span>
        </div>
      </div>
    </div>
  );
};
