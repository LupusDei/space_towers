// ProgressService - User progress management with persistence
// Handles loading, saving, and modifying user progress (wave credits, unlocked towers, etc.)

import { TowerType, type UserProgress } from '../types';
import { TOWER_STATS } from '../config';
import { createStorageService, type StorageBackend } from './StorageService';

// ============================================================================
// Constants
// ============================================================================

const PROGRESS_KEY = 'user_progress';

// Default starter towers that are unlocked from the beginning
const DEFAULT_UNLOCKED_TOWERS: TowerType[] = [
  TowerType.LASER,
  TowerType.MISSILE,
  TowerType.TESLA,
  TowerType.CANNON,
];

// ============================================================================
// Default Progress
// ============================================================================

export function getDefaultProgress(): UserProgress {
  return {
    waveCredits: 0,
    unlockedTowers: [...DEFAULT_UNLOCKED_TOWERS],
    highestWaveCompleted: 0,
    lastSelectedLoadout: null,
  };
}

// ============================================================================
// Progress Service Class
// ============================================================================

export class ProgressService {
  private storage;

  constructor(backend?: StorageBackend) {
    this.storage = createStorageService(backend);
  }

  /**
   * Load user progress from storage.
   * Returns default progress if no saved data exists or data is corrupt.
   */
  loadProgress(): UserProgress {
    const saved = this.storage.get<UserProgress>(PROGRESS_KEY);

    if (!saved) {
      return getDefaultProgress();
    }

    // Validate and repair progress data
    return this.validateProgress(saved);
  }

  /**
   * Save user progress to storage.
   * @param progress - The progress data to save
   */
  saveProgress(progress: UserProgress): void {
    this.storage.set(PROGRESS_KEY, progress);
  }

  /**
   * Attempt to unlock a tower by spending wave credits.
   * @param towerType - The tower type to unlock
   * @returns Object with success status and optional error message
   */
  unlockTower(towerType: TowerType): { success: boolean; error?: string } {
    const progress = this.loadProgress();

    // Check if tower exists
    const towerStats = TOWER_STATS[towerType];
    if (!towerStats) {
      return { success: false, error: 'Invalid tower type' };
    }

    // Check if already unlocked
    if (progress.unlockedTowers.includes(towerType)) {
      return { success: false, error: 'Tower already unlocked' };
    }

    // Get unlock cost from tower stats
    const cost = towerStats.unlockCost;

    // Check if tower is free (starter tower)
    if (cost === 0) {
      // Free towers should already be unlocked, but allow unlocking anyway
      progress.unlockedTowers.push(towerType);
      this.saveProgress(progress);
      return { success: true };
    }

    // Check if user has enough credits
    if (progress.waveCredits < cost) {
      return {
        success: false,
        error: `Not enough wave credits. Need ${cost}, have ${progress.waveCredits}`,
      };
    }

    // Deduct credits and unlock tower
    progress.waveCredits -= cost;
    progress.unlockedTowers.push(towerType);

    // Save updated progress
    this.saveProgress(progress);

    return { success: true };
  }

  /**
   * Check if a tower is unlocked.
   * @param towerType - The tower type to check
   * @returns True if the tower is unlocked
   */
  isTowerUnlocked(towerType: TowerType): boolean {
    const progress = this.loadProgress();
    return progress.unlockedTowers.includes(towerType);
  }

  /**
   * Get the current wave credits.
   * @returns The number of wave credits
   */
  getWaveCredits(): number {
    return this.loadProgress().waveCredits;
  }

  /**
   * Add wave credits to the user's balance.
   * @param amount - The amount of credits to add
   */
  addWaveCredits(amount: number): void {
    if (amount <= 0) return;

    const progress = this.loadProgress();
    progress.waveCredits += amount;
    this.saveProgress(progress);
  }

  /**
   * Reset progress to defaults.
   */
  resetProgress(): void {
    this.saveProgress(getDefaultProgress());
  }

  /**
   * Validate and repair progress data.
   * Ensures all required fields exist with valid values.
   */
  private validateProgress(saved: Partial<UserProgress>): UserProgress {
    const defaults = getDefaultProgress();

    // Validate waveCredits
    const waveCredits =
      typeof saved.waveCredits === 'number' && saved.waveCredits >= 0
        ? saved.waveCredits
        : defaults.waveCredits;

    // Validate unlockedTowers - ensure it's an array of valid tower types
    let unlockedTowers: TowerType[];
    if (Array.isArray(saved.unlockedTowers)) {
      const validTowerTypes = Object.values(TowerType);
      unlockedTowers = saved.unlockedTowers.filter((t) =>
        validTowerTypes.includes(t as TowerType)
      ) as TowerType[];

      // Ensure default towers are always unlocked
      for (const defaultTower of DEFAULT_UNLOCKED_TOWERS) {
        if (!unlockedTowers.includes(defaultTower)) {
          unlockedTowers.push(defaultTower);
        }
      }
    } else {
      unlockedTowers = defaults.unlockedTowers;
    }

    // Validate highestWaveCompleted
    const highestWaveCompleted =
      typeof saved.highestWaveCompleted === 'number' && saved.highestWaveCompleted >= 0
        ? saved.highestWaveCompleted
        : defaults.highestWaveCompleted;

    // Validate lastSelectedLoadout
    let lastSelectedLoadout: TowerType[] | null = null;
    if (Array.isArray(saved.lastSelectedLoadout)) {
      const validTowerTypes = Object.values(TowerType);
      const validLoadout = saved.lastSelectedLoadout.filter((t) =>
        validTowerTypes.includes(t as TowerType)
      ) as TowerType[];
      if (validLoadout.length > 0) {
        lastSelectedLoadout = validLoadout;
      }
    }

    return {
      waveCredits,
      unlockedTowers,
      highestWaveCompleted,
      lastSelectedLoadout,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let defaultInstance: ProgressService | null = null;

/**
 * Get the default ProgressService instance.
 * Uses localStorage as the backend.
 */
export function getProgressService(): ProgressService {
  if (!defaultInstance) {
    defaultInstance = new ProgressService();
  }
  return defaultInstance;
}

/**
 * Create a new ProgressService with a custom backend.
 * Useful for testing with memory storage.
 */
export function createProgressService(backend?: StorageBackend): ProgressService {
  return new ProgressService(backend);
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Load user progress using the default service.
 */
export function loadProgress(): UserProgress {
  return getProgressService().loadProgress();
}

/**
 * Save user progress using the default service.
 */
export function saveProgress(progress: UserProgress): void {
  getProgressService().saveProgress(progress);
}

/**
 * Unlock a tower using the default service.
 */
export function unlockTower(towerType: TowerType): { success: boolean; error?: string } {
  return getProgressService().unlockTower(towerType);
}
