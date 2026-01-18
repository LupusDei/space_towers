// useUserProgress - React hook for user progress management
// Provides progress state and update functions with automatic persistence

import { useCallback, useEffect, useState } from 'react';
import { createStorageService } from '../game/storage/StorageService';
import type { UserProgress, TowerType } from '../game/types';

const PROGRESS_STORAGE_KEY = 'user_progress';

// Default progress for new users
const DEFAULT_PROGRESS: UserProgress = {
  waveCredits: 0,
  unlockedTowers: [],
  highestWaveCompleted: 0,
  lastSelectedLoadout: null,
};

// Singleton storage service instance
const storage = createStorageService();

export interface UserProgressActions {
  addWaveCredits: (amount: number) => void;
  spendWaveCredits: (amount: number) => boolean;
  unlockTower: (type: TowerType) => boolean;
  setHighestWave: (wave: number) => void;
  setLastLoadout: (loadout: TowerType[] | null) => void;
  resetProgress: () => void;
}

export interface UseUserProgressResult {
  progress: UserProgress;
  actions: UserProgressActions;
  isLoaded: boolean;
}

/**
 * Load progress from storage, returning default progress if not found
 */
function loadProgress(): UserProgress {
  const saved = storage.get<UserProgress>(PROGRESS_STORAGE_KEY);
  if (saved === null) {
    return { ...DEFAULT_PROGRESS };
  }
  // Merge with defaults to handle schema migrations
  return {
    ...DEFAULT_PROGRESS,
    ...saved,
  };
}

/**
 * Save progress to storage
 */
function saveProgress(progress: UserProgress): void {
  storage.set(PROGRESS_STORAGE_KEY, progress);
}

/**
 * React hook for managing user progress with automatic persistence.
 *
 * @returns Progress state, update actions, and loading status
 */
export function useUserProgress(): UseUserProgressResult {
  // Use lazy initialization to load progress synchronously on first render
  const [progress, setProgress] = useState<UserProgress>(() => loadProgress());

  // Save progress whenever it changes
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  // Action: Add wave credits
  const addWaveCredits = useCallback((amount: number) => {
    if (amount <= 0) return;
    setProgress((prev) => ({
      ...prev,
      waveCredits: prev.waveCredits + amount,
    }));
  }, []);

  // Action: Spend wave credits (returns false if insufficient)
  const spendWaveCredits = useCallback(
    (amount: number): boolean => {
      // Check current state directly before updating
      if (progress.waveCredits < amount) {
        return false;
      }
      setProgress((prev) => ({
        ...prev,
        waveCredits: prev.waveCredits - amount,
      }));
      return true;
    },
    [progress.waveCredits]
  );

  // Action: Unlock a tower (returns false if already unlocked)
  const unlockTower = useCallback(
    (type: TowerType): boolean => {
      // Check current state directly before updating
      if (progress.unlockedTowers.includes(type)) {
        return false;
      }
      setProgress((prev) => ({
        ...prev,
        unlockedTowers: [...prev.unlockedTowers, type],
      }));
      return true;
    },
    [progress.unlockedTowers]
  );

  // Action: Update highest wave completed (only if higher)
  const setHighestWave = useCallback((wave: number) => {
    setProgress((prev) => {
      if (wave > prev.highestWaveCompleted) {
        return {
          ...prev,
          highestWaveCompleted: wave,
        };
      }
      return prev;
    });
  }, []);

  // Action: Set last selected loadout
  const setLastLoadout = useCallback((loadout: TowerType[] | null) => {
    setProgress((prev) => ({
      ...prev,
      lastSelectedLoadout: loadout,
    }));
  }, []);

  // Action: Reset all progress
  const resetProgress = useCallback(() => {
    setProgress({ ...DEFAULT_PROGRESS });
  }, []);

  const actions: UserProgressActions = {
    addWaveCredits,
    spendWaveCredits,
    unlockTower,
    setHighestWave,
    setLastLoadout,
    resetProgress,
  };

  // isLoaded is always true since we use lazy initialization (synchronous loading)
  return { progress, actions, isLoaded: true };
}

export default useUserProgress;
