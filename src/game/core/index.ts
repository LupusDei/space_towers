// Core modules for the game engine
// These handle single responsibilities extracted from Engine.ts

export { StateNotifier, createStateNotifier, type StateSubscriber } from './StateNotifier';
export {
  GameLoopManager,
  createGameLoopManager,
  type UpdateCallback,
  type GameLoopManagerConfig,
} from './GameLoopManager';
export {
  GameStateMachine,
  createGameStateMachine,
  type PhaseChangeCallback,
  type GameStateMachineConfig,
} from './GameStateMachine';
