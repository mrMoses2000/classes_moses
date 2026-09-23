import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadStoredProgress,
  saveStoredProgress,
  clearStoredProgress,
  STORAGE_KEY,
} from './progress';

// In-memory localStorage mock for node test runner
class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

const mockStorage = new LocalStorageMock();
Object.defineProperty(globalThis, 'window', {
  value: { localStorage: mockStorage },
  writable: true,
});
Object.defineProperty(globalThis, 'localStorage', {
  value: mockStorage,
  writable: true,
});

describe('Progress Storage', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('returns default state when localStorage is empty', () => {
    const state = loadStoredProgress();
    expect(state.version).toBe(1);
    expect(state.currentMissionId).toBe(1);
    expect(state.completedMissionIds).toEqual([]);
    expect(state.programs[3]).toEqual(['STEP', 'TURN_LEFT', 'STEP']);
  });

  it('saves and reloads state accurately', () => {
    const sample = {
      version: 1,
      currentLessonId: 1,
      currentMissionId: 2,
      completedMissionIds: [1],
      programs: {
        1: ['STEP' as const, 'STEP' as const, 'STEP' as const],
        2: ['TURN_LEFT' as const, 'STEP' as const],
        3: ['STEP' as const, 'STEP' as const],
      },
    };

    const saved = saveStoredProgress(sample);
    expect(saved).toBe(true);

    const reloaded = loadStoredProgress();
    expect(reloaded.currentMissionId).toBe(2);
    expect(reloaded.completedMissionIds).toEqual([1]);
    expect(reloaded.programs[1]).toEqual(['STEP', 'STEP', 'STEP']);
  });

  it('recovers gracefully from corrupted JSON', () => {
    mockStorage.setItem(STORAGE_KEY, '{invalid json!!');
    const state = loadStoredProgress();
    expect(state.currentMissionId).toBe(1);
    expect(state.version).toBe(1);
  });

  it('recovers safely from version mismatch', () => {
    mockStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 999, currentMissionId: 3 })
    );
    const state = loadStoredProgress();
    expect(state.currentMissionId).toBe(1);
    expect(state.version).toBe(1);
  });

  it('clears progress correctly', () => {
    saveStoredProgress({
      version: 1,
      currentLessonId: 1,
      currentMissionId: 2,
      completedMissionIds: [1],
      programs: { 1: [], 2: [], 3: [] },
    });
    expect(mockStorage.getItem(STORAGE_KEY)).not.toBeNull();
    clearStoredProgress();
    expect(mockStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
