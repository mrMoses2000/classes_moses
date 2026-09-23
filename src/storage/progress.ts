import { CommandType } from '../types';
import { MISSIONS, LESSONS } from '../data/missions';

export const STORAGE_KEY = 'robot_lesson_progress_v1';
export const CURRENT_VERSION = 1;

export interface StoredLessonState {
  version: number;
  currentLessonId: number;
  currentMissionId: number;
  completedMissionIds: number[];
  programs: Record<number, CommandType[]>;
}

export function getDefaultStoredState(): StoredLessonState {
  const initialPrograms: Record<number, CommandType[]> = {};
  for (const mission of MISSIONS) {
    initialPrograms[mission.id] = [...mission.initialCommands];
  }

  return {
    version: CURRENT_VERSION,
    currentLessonId: 1,
    currentMissionId: 1,
    completedMissionIds: [],
    programs: initialPrograms,
  };
}

export function loadStoredProgress(): StoredLessonState {
  if (typeof window === 'undefined' || !window.localStorage) {
    return getDefaultStoredState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getDefaultStoredState();
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return getDefaultStoredState();
    }

    if (parsed.version !== CURRENT_VERSION) {
      // Version mismatch or old structure -> reset safely
      return getDefaultStoredState();
    }

    // Validate fields safely
    const currentLessonId =
      typeof parsed.currentLessonId === 'number' &&
      LESSONS.some((l) => l.id === parsed.currentLessonId)
        ? parsed.currentLessonId
        : 1;

    const currentMissionId =
      typeof parsed.currentMissionId === 'number' &&
      MISSIONS.some((m) => m.id === parsed.currentMissionId)
        ? parsed.currentMissionId
        : 1;

    const completedMissionIds = Array.isArray(parsed.completedMissionIds)
      ? parsed.completedMissionIds.filter((id: unknown) => typeof id === 'number')
      : [];

    const programs: Record<number, CommandType[]> = {};
    const defaultPrograms = getDefaultStoredState().programs;

    for (const mission of MISSIONS) {
      const savedProgram = parsed.programs?.[mission.id];
      if (
        Array.isArray(savedProgram) &&
        savedProgram.every(
          (c) => c === 'STEP' || c === 'TURN_LEFT' || c === 'TURN_RIGHT'
        )
      ) {
        programs[mission.id] = savedProgram;
      } else {
        programs[mission.id] = defaultPrograms[mission.id] || [];
      }
    }

    return {
      version: CURRENT_VERSION,
      currentLessonId,
      currentMissionId,
      completedMissionIds,
      programs,
    };
  } catch (error) {
    console.warn('Не удалось прочитать сохранённый прогресс из localStorage:', error);
    return getDefaultStoredState();
  }
}

export function saveStoredProgress(state: StoredLessonState): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    const payload = JSON.stringify({
      version: CURRENT_VERSION,
      currentLessonId: state.currentLessonId,
      currentMissionId: state.currentMissionId,
      completedMissionIds: state.completedMissionIds,
      programs: state.programs,
    });
    window.localStorage.setItem(STORAGE_KEY, payload);
    return true;
  } catch (error) {
    console.warn('Не удалось сохранить прогресс в localStorage:', error);
    return false;
  }
}

export function clearStoredProgress(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.warn('Не удалось очистить localStorage:', error);
    return false;
  }
}
