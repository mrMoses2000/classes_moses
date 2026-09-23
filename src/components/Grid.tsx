import React from 'react';
import { Coordinate, Direction, RobotState } from '../types';
import './Grid.css';

interface GridProps {
  width: number;
  height: number;
  robot: RobotState;
  goal: Coordinate;
  obstacles: Coordinate[];
  visitedCoordinates?: Coordinate[];
  highlightObstacle?: Coordinate | null;
}

export const Grid: React.FC<GridProps> = ({
  width,
  height,
  robot,
  goal,
  obstacles,
  visitedCoordinates = [],
  highlightObstacle = null,
}) => {
  const getDirectionAngle = (dir: Direction): number => {
    switch (dir) {
      case 'EAST':
        return 0;
      case 'SOUTH':
        return 90;
      case 'WEST':
        return 180;
      case 'NORTH':
        return 270;
    }
  };

  const getDirectionLabel = (dir: Direction): string => {
    switch (dir) {
      case 'EAST':
        return 'смотрит направо (восток)';
      case 'SOUTH':
        return 'смотрит вниз (юг)';
      case 'WEST':
        return 'смотрит налево (запад)';
      case 'NORTH':
        return 'смотрит вверх (север)';
    }
  };

  const cells = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const isRobotHere = robot.x === x && robot.y === y;
      const isGoalHere = goal.x === x && goal.y === y;
      const isObstacleHere = obstacles.some((obs) => obs.x === x && obs.y === y);
      const isHighlightedObstacle =
        highlightObstacle !== null &&
        highlightObstacle.x === x &&
        highlightObstacle.y === y;
      const isVisited = visitedCoordinates.some((coord) => coord.x === x && coord.y === y);

      cells.push(
        <div
          key={`${x}-${y}`}
          className={`grid-cell ${isVisited ? 'cell-visited' : ''} ${
            isObstacleHere ? 'cell-obstacle' : ''
          } ${isHighlightedObstacle ? 'cell-obstacle-hit' : ''}`}
          role="gridcell"
          aria-label={`Клетка ряд ${y + 1}, колонка ${x + 1}${
            isRobotHere ? `, Робот, ${getDirectionLabel(robot.direction)}` : ''
          }${isGoalHere ? ', Маяк' : ''}${isObstacleHere ? ', Стена' : ''}`}
        >
          {/* Subtle coordinate dot for orientation */}
          <span className="cell-dot" aria-hidden="true" />

          {/* Goal: Lighthouse */}
          {isGoalHere && (
            <div className="goal-marker" aria-hidden="true">
              <svg
                className="goal-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Lighthouse tower and light beam */}
                <path d="M12 2v2" />
                <path d="M9 4h6l-1 16H10L9 4z" />
                <path d="M7 20h10" />
                <circle cx="12" cy="7" r="1.5" fill="currentColor" />
                <path d="M5 8l-3-2" strokeDasharray="2 2" />
                <path d="M19 8l3-2" strokeDasharray="2 2" />
              </svg>
              <span className="goal-label">Маяк</span>
            </div>
          )}

          {/* Obstacle: Wall */}
          {isObstacleHere && (
            <div className="obstacle-marker" aria-hidden="true">
              <svg
                className="obstacle-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" fillOpacity="0.15" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
                <line x1="12" y1="3" x2="12" y2="9" />
                <line x1="8" y1="9" x2="8" y2="15" />
                <line x1="16" y1="9" x2="16" y2="15" />
                <line x1="12" y1="15" x2="12" y2="21" />
              </svg>
              <span className="obstacle-label">Стена</span>
            </div>
          )}

          {/* Robot */}
          {isRobotHere && (
            <div
              className="robot-marker"
              style={{
                transform: `rotate(${getDirectionAngle(robot.direction)}deg)`,
              }}
              aria-hidden="true"
            >
              <div className="robot-body">
                <svg
                  className="robot-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* Robot face & body */}
                  <rect x="4" y="5" width="14" height="14" rx="3" fill="var(--color-robot-bg)" />
                  {/* Eyes */}
                  <circle cx="9" cy="10" r="1.5" fill="currentColor" />
                  <circle cx="15" cy="10" r="1.5" fill="currentColor" />
                  {/* Antenna */}
                  <line x1="11" y1="2" x2="11" y2="5" />
                  <circle cx="11" cy="2" r="1" fill="currentColor" />
                  {/* Direction pointer arrow protruding to the right (East) */}
                  <path d="M19 12l4-3v6l-4-3z" fill="currentColor" />
                </svg>
              </div>
              <span
                className="robot-label"
                style={{
                  transform: `rotate(-${getDirectionAngle(robot.direction)}deg)`,
                }}
              >
                Робот
              </span>
            </div>
          )}
        </div>
      );
    }
  }

  return (
    <div
      className="grid-container"
      role="grid"
      aria-label={`Игровое поле ${width} на ${height} клеток`}
      style={{
        gridTemplateColumns: `repeat(${width}, 1fr)`,
        gridTemplateRows: `repeat(${height}, 1fr)`,
      }}
    >
      {cells}
    </div>
  );
};
