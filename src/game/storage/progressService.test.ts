import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TowerType } from '../types';
import { StorageService, createMemoryStorage } from './StorageService';
import {
  loadProgress,
  saveProgress,
  clearProgress,
  getDefaultProgress,
} from './progressService';

describe('progressService', () => {
  let storage: StorageService;

  beforeEach(() => {
    storage = new StorageService(createMemoryStorage());
  });

  describe('getDefaultProgress', () => {
    it('should return default progress with zero wave credits', () => {
      const progress = getDefaultProgress();
      expect(progress.waveCredits).toBe(0);
    });

    it('should return default progress with base towers unlocked', () => {
      const progress = getDefaultProgress();
      expect(progress.unlockedTowers).toContain(TowerType.LASER);
      expect(progress.unlockedTowers).toContain(TowerType.MISSILE);
      expect(progress.unlockedTowers).toContain(TowerType.TESLA);
      expect(progress.unlockedTowers).toContain(TowerType.CANNON);
    });

    it('should return default progress with highest wave 0', () => {
      const progress = getDefaultProgress();
      expect(progress.highestWaveCompleted).toBe(0);
    });

    it('should return default progress with null loadout', () => {
      const progress = getDefaultProgress();
      expect(progress.lastSelectedLoadout).toBeNull();
    });

    it('should return a new copy each time', () => {
      const progress1 = getDefaultProgress();
      const progress2 = getDefaultProgress();
      expect(progress1).not.toBe(progress2);
      expect(progress1.unlockedTowers).not.toBe(progress2.unlockedTowers);
    });
  });

  describe('loadProgress', () => {
    it('should return defaults when no data exists', () => {
      const progress = loadProgress(storage);
      expect(progress).toEqual(getDefaultProgress());
    });

    it('should load saved progress', () => {
      const savedProgress = {
        waveCredits: 100,
        unlockedTowers: [TowerType.LASER, TowerType.MISSILE, TowerType.TESLA, TowerType.CANNON, TowerType.GRAVITY],
        highestWaveCompleted: 5,
        lastSelectedLoadout: [TowerType.LASER, TowerType.MISSILE],
      };
      storage.set('user_progress', savedProgress);

      const progress = loadProgress(storage);
      expect(progress.waveCredits).toBe(100);
      expect(progress.highestWaveCompleted).toBe(5);
      expect(progress.unlockedTowers).toContain(TowerType.GRAVITY);
      expect(progress.lastSelectedLoadout).toEqual([TowerType.LASER, TowerType.MISSILE]);
    });

    it('should return defaults for corrupt data (invalid JSON structure)', () => {
      // Directly set invalid data in backend
      const backend = createMemoryStorage();
      backend.setItem('space_towers_user_progress', 'not valid json{');
      const corruptStorage = new StorageService(backend);

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const progress = loadProgress(corruptStorage);

      expect(progress).toEqual(getDefaultProgress());
      consoleWarnSpy.mockRestore();
    });

    it('should return defaults for corrupt data (missing waveCredits)', () => {
      const corruptData = {
        unlockedTowers: [TowerType.LASER],
        highestWaveCompleted: 5,
        lastSelectedLoadout: null,
      };
      storage.set('user_progress', corruptData);

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const progress = loadProgress(storage);

      expect(progress).toEqual(getDefaultProgress());
      consoleWarnSpy.mockRestore();
    });

    it('should return defaults for corrupt data (negative waveCredits)', () => {
      const corruptData = {
        waveCredits: -10,
        unlockedTowers: [TowerType.LASER],
        highestWaveCompleted: 5,
        lastSelectedLoadout: null,
      };
      storage.set('user_progress', corruptData);

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const progress = loadProgress(storage);

      expect(progress).toEqual(getDefaultProgress());
      consoleWarnSpy.mockRestore();
    });

    it('should return defaults for corrupt data (invalid tower type)', () => {
      const corruptData = {
        waveCredits: 100,
        unlockedTowers: ['invalid_tower_type'],
        highestWaveCompleted: 5,
        lastSelectedLoadout: null,
      };
      storage.set('user_progress', corruptData);

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const progress = loadProgress(storage);

      expect(progress).toEqual(getDefaultProgress());
      consoleWarnSpy.mockRestore();
    });

    it('should return defaults for corrupt data (unlockedTowers not array)', () => {
      const corruptData = {
        waveCredits: 100,
        unlockedTowers: 'not an array',
        highestWaveCompleted: 5,
        lastSelectedLoadout: null,
      };
      storage.set('user_progress', corruptData);

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const progress = loadProgress(storage);

      expect(progress).toEqual(getDefaultProgress());
      consoleWarnSpy.mockRestore();
    });

    it('should return defaults for corrupt data (invalid loadout tower type)', () => {
      const corruptData = {
        waveCredits: 100,
        unlockedTowers: [TowerType.LASER, TowerType.MISSILE, TowerType.TESLA, TowerType.CANNON],
        highestWaveCompleted: 5,
        lastSelectedLoadout: ['invalid_tower'],
      };
      storage.set('user_progress', corruptData);

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const progress = loadProgress(storage);

      expect(progress).toEqual(getDefaultProgress());
      consoleWarnSpy.mockRestore();
    });

    it('should merge default towers with saved unlocked towers', () => {
      // Save progress with only GRAVITY (missing base towers)
      const savedProgress = {
        waveCredits: 50,
        unlockedTowers: [TowerType.GRAVITY],
        highestWaveCompleted: 3,
        lastSelectedLoadout: null,
      };
      storage.set('user_progress', savedProgress);

      const progress = loadProgress(storage);

      // Should have both GRAVITY and all base towers
      expect(progress.unlockedTowers).toContain(TowerType.GRAVITY);
      expect(progress.unlockedTowers).toContain(TowerType.LASER);
      expect(progress.unlockedTowers).toContain(TowerType.MISSILE);
      expect(progress.unlockedTowers).toContain(TowerType.TESLA);
      expect(progress.unlockedTowers).toContain(TowerType.CANNON);
    });
  });

  describe('saveProgress', () => {
    it('should save progress to storage', () => {
      const progress = {
        waveCredits: 200,
        unlockedTowers: [TowerType.LASER, TowerType.MISSILE, TowerType.TESLA, TowerType.CANNON, TowerType.STORM],
        highestWaveCompleted: 10,
        lastSelectedLoadout: [TowerType.LASER, TowerType.TESLA],
      };

      saveProgress(progress, storage);

      const loaded = storage.get('user_progress');
      expect(loaded).toEqual(progress);
    });

    it('should overwrite existing progress', () => {
      const progress1 = {
        waveCredits: 100,
        unlockedTowers: [TowerType.LASER, TowerType.MISSILE, TowerType.TESLA, TowerType.CANNON],
        highestWaveCompleted: 5,
        lastSelectedLoadout: null,
      };
      const progress2 = {
        waveCredits: 200,
        unlockedTowers: [TowerType.LASER, TowerType.MISSILE, TowerType.TESLA, TowerType.CANNON, TowerType.GRAVITY],
        highestWaveCompleted: 10,
        lastSelectedLoadout: [TowerType.LASER],
      };

      saveProgress(progress1, storage);
      saveProgress(progress2, storage);

      const loaded = storage.get('user_progress');
      expect(loaded).toEqual(progress2);
    });
  });

  describe('clearProgress', () => {
    it('should remove progress from storage', () => {
      const progress = getDefaultProgress();
      saveProgress(progress, storage);

      expect(storage.has('user_progress')).toBe(true);

      clearProgress(storage);

      expect(storage.has('user_progress')).toBe(false);
    });

    it('should not throw if no progress exists', () => {
      expect(() => clearProgress(storage)).not.toThrow();
    });
  });

  describe('round-trip save/load', () => {
    it('should preserve all data through save and load', () => {
      const original = {
        waveCredits: 500,
        unlockedTowers: [TowerType.LASER, TowerType.MISSILE, TowerType.TESLA, TowerType.CANNON, TowerType.GRAVITY, TowerType.STORM],
        highestWaveCompleted: 25,
        lastSelectedLoadout: [TowerType.GRAVITY, TowerType.STORM, TowerType.TESLA],
      };

      saveProgress(original, storage);
      const loaded = loadProgress(storage);

      expect(loaded.waveCredits).toBe(original.waveCredits);
      expect(loaded.highestWaveCompleted).toBe(original.highestWaveCompleted);
      expect(loaded.lastSelectedLoadout).toEqual(original.lastSelectedLoadout);
      // unlockedTowers may have extra base towers merged in, but should contain all original
      for (const tower of original.unlockedTowers) {
        expect(loaded.unlockedTowers).toContain(tower);
      }
    });
  });
});
