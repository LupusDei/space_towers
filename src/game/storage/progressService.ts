// Progress Service - Load and save user progress with graceful defaults
// Handles missing/corrupt data by returning sensible defaults

import { TowerType, type UserProgress } from '../types';
import { type StorageService, createStorageService } from './StorageService';

// ============================================================================
// Constants
// ============================================================================

const PROGRESS_KEY = 'user_progress';

// Default unlocked towers (base game towers)
const DEFAULT_UNLOCKED_TOWERS: TowerType[] = [
  TowerType.LASER,
  TowerType.MISSILE,
  TowerType.TESLA,
  TowerType.CANNON,
];

// ============================================================================
// Default Progress
// ============================================================================

/**
 * Creates a default UserProgress object for new players.
 */
export function getDefaultProgress(): UserProgress {
  return {
    waveCredits: 0,
    unlockedTowers: [...DEFAULT_UNLOCKED_TOWERS],
    highestWaveCompleted: 0,
    lastSelectedLoadout: null,
  };
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validates that a value matches the UserProgress shape.
 * Returns true if the data is valid, false otherwise.
 */
function isValidProgress(data: unknown): data is UserProgress {
  if (data === null || typeof data !== 'object') {
    return false;
  }

  const progress = data as Record<string, unknown>;

  // Check required fields exist and have correct types
  if (typeof progress.waveCredits !== 'number' || progress.waveCredits < 0) {
    return false;
  }

  if (!Array.isArray(progress.unlockedTowers)) {
    return false;
  }

  // Validate each tower type is valid
  const validTowerTypes = Object.values(TowerType);
  for (const tower of progress.unlockedTowers) {
    if (!validTowerTypes.includes(tower as TowerType)) {
      return false;
    }
  }

  if (typeof progress.highestWaveCompleted !== 'number' || progress.highestWaveCompleted < 0) {
    return false;
  }

  // lastSelectedLoadout can be null or an array of valid tower types
  if (progress.lastSelectedLoadout !== null) {
    if (!Array.isArray(progress.lastSelectedLoadout)) {
      return false;
    }
    for (const tower of progress.lastSelectedLoadout) {
      if (!validTowerTypes.includes(tower as TowerType)) {
        return false;
      }
    }
  }

  return true;
}

// ============================================================================
// Load / Save Functions
// ============================================================================

/**
 * Loads user progress from storage.
 * Returns default progress if no data exists or data is corrupt.
 *
 * @param storage - The StorageService to use (defaults to localStorage-backed service)
 * @returns The loaded UserProgress, or defaults if unavailable
 */
export function loadProgress(storage: StorageService = createStorageService()): UserProgress {
  const data = storage.get<unknown>(PROGRESS_KEY);

  if (data === null) {
    // No saved data - return defaults
    return getDefaultProgress();
  }

  if (!isValidProgress(data)) {
    // Data is corrupt - log warning and return defaults
    console.warn('[ProgressService] Corrupt progress data detected, using defaults');
    return getDefaultProgress();
  }

  // Ensure all default towers are unlocked (migration safety)
  const mergedTowers = new Set([...DEFAULT_UNLOCKED_TOWERS, ...data.unlockedTowers]);

  return {
    waveCredits: data.waveCredits,
    unlockedTowers: Array.from(mergedTowers),
    highestWaveCompleted: data.highestWaveCompleted,
    lastSelectedLoadout: data.lastSelectedLoadout,
  };
}

/**
 * Saves user progress to storage.
 *
 * @param progress - The UserProgress to save
 * @param storage - The StorageService to use (defaults to localStorage-backed service)
 */
export function saveProgress(
  progress: UserProgress,
  storage: StorageService = createStorageService()
): void {
  storage.set(PROGRESS_KEY, progress);
}

/**
 * Clears all user progress from storage.
 * Useful for testing or "reset progress" feature.
 *
 * @param storage - The StorageService to use (defaults to localStorage-backed service)
 */
export function clearProgress(storage: StorageService = createStorageService()): void {
  storage.remove(PROGRESS_KEY);
}
