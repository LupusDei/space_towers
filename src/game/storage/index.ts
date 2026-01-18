// Storage module for persistent game data

export {
  StorageService,
  createStorageService,
  createMemoryStorage,
  type StorageBackend,
} from './StorageService';

export {
  loadProgress,
  saveProgress,
  clearProgress,
  getDefaultProgress,
  unlockTower,
  type UnlockResult,
} from './progressService';
