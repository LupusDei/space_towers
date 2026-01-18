// Storage module for persistent game data

export {
  StorageService,
  createStorageService,
  createMemoryStorage,
  type StorageBackend,
} from './StorageService';

export {
  ProgressService,
  getProgressService,
  createProgressService,
  getDefaultProgress,
  loadProgress,
  saveProgress,
  unlockTower,
} from './progressService';
