import { describe, it, expect, beforeEach } from 'vitest';
import {
  ProgressService,
  createProgressService,
  getDefaultProgress,
} from './ProgressService';
import { createMemoryStorage } from './StorageService';
import { TowerType } from '../types';

describe('ProgressService', () => {
  let service: ProgressService;

  beforeEach(() => {
    service = createProgressService(createMemoryStorage());
  });

  describe('loadProgress', () => {
    it('should return default progress when no saved data exists', () => {
      const progress = service.loadProgress();

      expect(progress.waveCredits).toBe(0);
      expect(progress.highestWaveCompleted).toBe(0);
      expect(progress.lastSelectedLoadout).toBeNull();
    });

    it('should include default unlocked towers', () => {
      const progress = service.loadProgress();

      expect(progress.unlockedTowers).toContain(TowerType.LASER);
      expect(progress.unlockedTowers).toContain(TowerType.MISSILE);
      expect(progress.unlockedTowers).toContain(TowerType.TESLA);
      expect(progress.unlockedTowers).toContain(TowerType.CANNON);
    });

    it('should return saved progress', () => {
      service.saveProgress({
        waveCredits: 50,
        unlockedTowers: [TowerType.LASER, TowerType.SNIPER],
        highestWaveCompleted: 10,
        lastSelectedLoadout: [TowerType.LASER],
      });

      const progress = service.loadProgress();

      expect(progress.waveCredits).toBe(50);
      expect(progress.highestWaveCompleted).toBe(10);
    });
  });

  describe('saveProgress', () => {
    it('should persist progress data', () => {
      const progressToSave = {
        waveCredits: 100,
        unlockedTowers: [TowerType.LASER, TowerType.MISSILE, TowerType.TESLA, TowerType.CANNON, TowerType.SNIPER],
        highestWaveCompleted: 15,
        lastSelectedLoadout: [TowerType.LASER, TowerType.MISSILE],
      };

      service.saveProgress(progressToSave);
      const loaded = service.loadProgress();

      expect(loaded.waveCredits).toBe(100);
      // Validate saved towers are present (default towers are always included)
      expect(loaded.unlockedTowers).toContain(TowerType.LASER);
      expect(loaded.unlockedTowers).toContain(TowerType.MISSILE);
      expect(loaded.unlockedTowers).toContain(TowerType.SNIPER);
      expect(loaded.highestWaveCompleted).toBe(15);
      expect(loaded.lastSelectedLoadout).toEqual([TowerType.LASER, TowerType.MISSILE]);
    });
  });

  describe('unlockTower', () => {
    it('should fail for invalid tower type', () => {
      const result = service.unlockTower('invalid_tower' as TowerType);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid tower type');
    });

    it('should fail if tower is already unlocked', () => {
      // LASER is unlocked by default
      const result = service.unlockTower(TowerType.LASER);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Tower already unlocked');
    });

    it('should fail if not enough wave credits', () => {
      // SNIPER costs 10 wave credits
      const result = service.unlockTower(TowerType.SNIPER);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not enough wave credits');
    });

    it('should succeed and deduct credits when unlocking', () => {
      // Give user enough credits
      service.saveProgress({
        ...getDefaultProgress(),
        waveCredits: 20,
      });

      // SNIPER costs 10 wave credits
      const result = service.unlockTower(TowerType.SNIPER);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      // Check credits were deducted
      const progress = service.loadProgress();
      expect(progress.waveCredits).toBe(10);
    });

    it('should add tower to unlockedTowers after successful unlock', () => {
      service.saveProgress({
        ...getDefaultProgress(),
        waveCredits: 20,
      });

      service.unlockTower(TowerType.SNIPER);

      const progress = service.loadProgress();
      expect(progress.unlockedTowers).toContain(TowerType.SNIPER);
    });

    it('should persist unlock across loads', () => {
      service.saveProgress({
        ...getDefaultProgress(),
        waveCredits: 20,
      });

      service.unlockTower(TowerType.SNIPER);

      // Verify within the same service that unlock persisted
      expect(service.isTowerUnlocked(TowerType.SNIPER)).toBe(true);
    });

    it('should unlock free towers (cost 0) without requiring credits', () => {
      // Remove GRAVITY from unlocked towers to test unlock
      service.saveProgress({
        waveCredits: 0,
        unlockedTowers: [TowerType.LASER], // Only LASER, missing other defaults
        highestWaveCompleted: 0,
        lastSelectedLoadout: null,
      });

      // GRAVITY has unlockCost of 0
      const result = service.unlockTower(TowerType.GRAVITY);

      expect(result.success).toBe(true);
      expect(service.isTowerUnlocked(TowerType.GRAVITY)).toBe(true);
    });
  });

  describe('isTowerUnlocked', () => {
    it('should return true for default unlocked towers', () => {
      expect(service.isTowerUnlocked(TowerType.LASER)).toBe(true);
      expect(service.isTowerUnlocked(TowerType.MISSILE)).toBe(true);
    });

    it('should return false for locked towers', () => {
      expect(service.isTowerUnlocked(TowerType.SNIPER)).toBe(false);
    });

    it('should return true after unlocking', () => {
      service.saveProgress({
        ...getDefaultProgress(),
        waveCredits: 20,
      });

      service.unlockTower(TowerType.SNIPER);

      expect(service.isTowerUnlocked(TowerType.SNIPER)).toBe(true);
    });
  });

  describe('getWaveCredits', () => {
    it('should return 0 by default', () => {
      expect(service.getWaveCredits()).toBe(0);
    });

    it('should return saved credits', () => {
      service.saveProgress({
        ...getDefaultProgress(),
        waveCredits: 42,
      });

      expect(service.getWaveCredits()).toBe(42);
    });
  });

  describe('addWaveCredits', () => {
    it('should add credits to balance', () => {
      service.addWaveCredits(10);

      expect(service.getWaveCredits()).toBe(10);
    });

    it('should accumulate credits', () => {
      service.addWaveCredits(10);
      service.addWaveCredits(15);

      expect(service.getWaveCredits()).toBe(25);
    });

    it('should not add negative or zero amounts', () => {
      service.addWaveCredits(10);
      service.addWaveCredits(-5);
      service.addWaveCredits(0);

      expect(service.getWaveCredits()).toBe(10);
    });
  });

  describe('resetProgress', () => {
    it('should reset to default values', () => {
      service.saveProgress({
        waveCredits: 100,
        unlockedTowers: [TowerType.LASER, TowerType.SNIPER],
        highestWaveCompleted: 20,
        lastSelectedLoadout: [TowerType.SNIPER],
      });

      service.resetProgress();

      const progress = service.loadProgress();
      expect(progress.waveCredits).toBe(0);
      expect(progress.highestWaveCompleted).toBe(0);
      expect(progress.lastSelectedLoadout).toBeNull();
    });
  });

  describe('validateProgress', () => {
    it('should repair negative wave credits', () => {
      service.saveProgress({
        waveCredits: -10,
        unlockedTowers: [TowerType.LASER],
        highestWaveCompleted: 0,
        lastSelectedLoadout: null,
      });

      const progress = service.loadProgress();
      expect(progress.waveCredits).toBe(0);
    });

    it('should repair invalid tower types in unlockedTowers', () => {
      service.saveProgress({
        waveCredits: 0,
        unlockedTowers: ['invalid' as TowerType, TowerType.LASER],
        highestWaveCompleted: 0,
        lastSelectedLoadout: null,
      });

      const progress = service.loadProgress();
      expect(progress.unlockedTowers).not.toContain('invalid');
      expect(progress.unlockedTowers).toContain(TowerType.LASER);
    });

    it('should ensure default towers are always included', () => {
      service.saveProgress({
        waveCredits: 0,
        unlockedTowers: [TowerType.SNIPER], // Missing default towers
        highestWaveCompleted: 0,
        lastSelectedLoadout: null,
      });

      const progress = service.loadProgress();
      expect(progress.unlockedTowers).toContain(TowerType.LASER);
      expect(progress.unlockedTowers).toContain(TowerType.MISSILE);
      expect(progress.unlockedTowers).toContain(TowerType.TESLA);
      expect(progress.unlockedTowers).toContain(TowerType.CANNON);
      expect(progress.unlockedTowers).toContain(TowerType.SNIPER);
    });

    it('should repair negative highestWaveCompleted', () => {
      service.saveProgress({
        waveCredits: 0,
        unlockedTowers: [TowerType.LASER],
        highestWaveCompleted: -5,
        lastSelectedLoadout: null,
      });

      const progress = service.loadProgress();
      expect(progress.highestWaveCompleted).toBe(0);
    });
  });
});

describe('getDefaultProgress', () => {
  it('should return fresh defaults each time', () => {
    const p1 = getDefaultProgress();
    const p2 = getDefaultProgress();

    // Should be equal but not the same reference
    expect(p1).toEqual(p2);
    expect(p1).not.toBe(p2);
    expect(p1.unlockedTowers).not.toBe(p2.unlockedTowers);
  });

  it('should have default unlocked towers', () => {
    const progress = getDefaultProgress();

    expect(progress.unlockedTowers).toContain(TowerType.LASER);
    expect(progress.unlockedTowers).toContain(TowerType.MISSILE);
    expect(progress.unlockedTowers).toContain(TowerType.TESLA);
    expect(progress.unlockedTowers).toContain(TowerType.CANNON);
  });

  it('should have zero wave credits', () => {
    expect(getDefaultProgress().waveCredits).toBe(0);
  });
});
