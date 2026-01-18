import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUserProgress } from './useUserProgress';
import { TowerType } from '../game/types';
import { StorageService } from '../game/storage/StorageService';

// Mock the storage service module
vi.mock('../game/storage/StorageService', async () => {
  const actual = await vi.importActual('../game/storage/StorageService');
  const memoryStorage = (actual as typeof import('../game/storage/StorageService')).createMemoryStorage();
  const mockStorage = new (actual as typeof import('../game/storage/StorageService')).StorageService(memoryStorage);
  return {
    ...actual,
    createStorageService: () => mockStorage,
    // Export the mock storage for test access
    __mockStorage: mockStorage,
  };
});

// Get the mocked storage for clearing between tests
async function getMockStorage(): Promise<StorageService> {
  const mod = await import('../game/storage/StorageService');
  return (mod as unknown as { __mockStorage: StorageService }).__mockStorage;
}

describe('useUserProgress', () => {
  beforeEach(async () => {
    // Clear storage before each test
    const storage = await getMockStorage();
    storage.remove('user_progress');
  });

  describe('initial state', () => {
    it('should return default progress on first load', () => {
      const { result } = renderHook(() => useUserProgress());

      expect(result.current.progress.waveCredits).toBe(0);
      expect(result.current.progress.unlockedTowers).toEqual([]);
      expect(result.current.progress.highestWaveCompleted).toBe(0);
      expect(result.current.progress.lastSelectedLoadout).toBeNull();
    });

    it('should set isLoaded to true after mount', async () => {
      const { result } = renderHook(() => useUserProgress());

      // After initial render, isLoaded should be true
      expect(result.current.isLoaded).toBe(true);
    });
  });

  describe('addWaveCredits', () => {
    it('should add credits to progress', () => {
      const { result } = renderHook(() => useUserProgress());

      act(() => {
        result.current.actions.addWaveCredits(10);
      });

      expect(result.current.progress.waveCredits).toBe(10);
    });

    it('should accumulate credits on multiple calls', () => {
      const { result } = renderHook(() => useUserProgress());

      act(() => {
        result.current.actions.addWaveCredits(5);
      });
      act(() => {
        result.current.actions.addWaveCredits(7);
      });

      expect(result.current.progress.waveCredits).toBe(12);
    });

    it('should ignore non-positive amounts', () => {
      const { result } = renderHook(() => useUserProgress());

      act(() => {
        result.current.actions.addWaveCredits(10);
      });
      act(() => {
        result.current.actions.addWaveCredits(0);
      });
      act(() => {
        result.current.actions.addWaveCredits(-5);
      });

      expect(result.current.progress.waveCredits).toBe(10);
    });
  });

  describe('spendWaveCredits', () => {
    it('should spend credits when sufficient', () => {
      const { result } = renderHook(() => useUserProgress());

      act(() => {
        result.current.actions.addWaveCredits(20);
      });

      let success = false;
      act(() => {
        success = result.current.actions.spendWaveCredits(15);
      });

      expect(success).toBe(true);
      expect(result.current.progress.waveCredits).toBe(5);
    });

    it('should return false when insufficient credits', () => {
      const { result } = renderHook(() => useUserProgress());

      act(() => {
        result.current.actions.addWaveCredits(10);
      });

      let success = false;
      act(() => {
        success = result.current.actions.spendWaveCredits(15);
      });

      expect(success).toBe(false);
      expect(result.current.progress.waveCredits).toBe(10);
    });

    it('should allow spending exact amount', () => {
      const { result } = renderHook(() => useUserProgress());

      act(() => {
        result.current.actions.addWaveCredits(10);
      });

      let success = false;
      act(() => {
        success = result.current.actions.spendWaveCredits(10);
      });

      expect(success).toBe(true);
      expect(result.current.progress.waveCredits).toBe(0);
    });
  });

  describe('unlockTower', () => {
    it('should add tower to unlocked list', () => {
      const { result } = renderHook(() => useUserProgress());

      let success = false;
      act(() => {
        success = result.current.actions.unlockTower(TowerType.SNIPER);
      });

      expect(success).toBe(true);
      expect(result.current.progress.unlockedTowers).toContain(TowerType.SNIPER);
    });

    it('should return false when tower already unlocked', () => {
      const { result } = renderHook(() => useUserProgress());

      act(() => {
        result.current.actions.unlockTower(TowerType.SNIPER);
      });

      let success = false;
      act(() => {
        success = result.current.actions.unlockTower(TowerType.SNIPER);
      });

      expect(success).toBe(false);
      expect(result.current.progress.unlockedTowers.filter((t) => t === TowerType.SNIPER).length).toBe(1);
    });

    it('should allow unlocking multiple towers', () => {
      const { result } = renderHook(() => useUserProgress());

      act(() => {
        result.current.actions.unlockTower(TowerType.SNIPER);
      });
      act(() => {
        result.current.actions.unlockTower(TowerType.GRAVITY);
      });

      expect(result.current.progress.unlockedTowers).toContain(TowerType.SNIPER);
      expect(result.current.progress.unlockedTowers).toContain(TowerType.GRAVITY);
      expect(result.current.progress.unlockedTowers.length).toBe(2);
    });
  });

  describe('setHighestWave', () => {
    it('should update highest wave when higher', () => {
      const { result } = renderHook(() => useUserProgress());

      act(() => {
        result.current.actions.setHighestWave(5);
      });

      expect(result.current.progress.highestWaveCompleted).toBe(5);
    });

    it('should not update when wave is lower', () => {
      const { result } = renderHook(() => useUserProgress());

      act(() => {
        result.current.actions.setHighestWave(10);
      });
      act(() => {
        result.current.actions.setHighestWave(5);
      });

      expect(result.current.progress.highestWaveCompleted).toBe(10);
    });

    it('should not update when wave is equal', () => {
      const { result } = renderHook(() => useUserProgress());

      act(() => {
        result.current.actions.setHighestWave(5);
      });
      act(() => {
        result.current.actions.setHighestWave(5);
      });

      expect(result.current.progress.highestWaveCompleted).toBe(5);
    });
  });

  describe('setLastLoadout', () => {
    it('should set loadout', () => {
      const { result } = renderHook(() => useUserProgress());
      const loadout = [TowerType.LASER, TowerType.MISSILE];

      act(() => {
        result.current.actions.setLastLoadout(loadout);
      });

      expect(result.current.progress.lastSelectedLoadout).toEqual(loadout);
    });

    it('should allow setting null loadout', () => {
      const { result } = renderHook(() => useUserProgress());

      act(() => {
        result.current.actions.setLastLoadout([TowerType.LASER]);
      });
      act(() => {
        result.current.actions.setLastLoadout(null);
      });

      expect(result.current.progress.lastSelectedLoadout).toBeNull();
    });
  });

  describe('resetProgress', () => {
    it('should reset all progress to defaults', () => {
      const { result } = renderHook(() => useUserProgress());

      // Add some progress
      act(() => {
        result.current.actions.addWaveCredits(100);
        result.current.actions.unlockTower(TowerType.SNIPER);
        result.current.actions.setHighestWave(20);
        result.current.actions.setLastLoadout([TowerType.LASER]);
      });

      // Reset
      act(() => {
        result.current.actions.resetProgress();
      });

      expect(result.current.progress.waveCredits).toBe(0);
      expect(result.current.progress.unlockedTowers).toEqual([]);
      expect(result.current.progress.highestWaveCompleted).toBe(0);
      expect(result.current.progress.lastSelectedLoadout).toBeNull();
    });
  });

  describe('persistence', () => {
    it('should persist progress across hook instances', async () => {
      // First hook instance - add progress
      const { result: result1, unmount } = renderHook(() => useUserProgress());

      act(() => {
        result1.current.actions.addWaveCredits(50);
        result1.current.actions.unlockTower(TowerType.SNIPER);
        result1.current.actions.setHighestWave(10);
      });

      unmount();

      // Second hook instance - should load persisted data
      const { result: result2 } = renderHook(() => useUserProgress());

      expect(result2.current.progress.waveCredits).toBe(50);
      expect(result2.current.progress.unlockedTowers).toContain(TowerType.SNIPER);
      expect(result2.current.progress.highestWaveCompleted).toBe(10);
    });
  });
});
