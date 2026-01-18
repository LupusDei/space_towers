// GameStateMachine - Phase state machine for game flow
// Handles phase transitions: MENU → TOWER_STORE → PLANNING → COMBAT → VICTORY/DEFEAT

import type { GamePhase } from '../types';
import { GamePhase as Phase } from '../types';

// ============================================================================
// Types
// ============================================================================

export type PhaseChangeCallback = (from: GamePhase, to: GamePhase) => void;

export interface GameStateMachineConfig {
  initialPhase?: GamePhase;
  onPhaseChange?: PhaseChangeCallback;
}

// ============================================================================
// Valid Transitions Map
// ============================================================================

const VALID_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  [Phase.MENU]: [Phase.TOWER_STORE],
  [Phase.TOWER_STORE]: [Phase.PLANNING, Phase.MENU],
  [Phase.PLANNING]: [Phase.COMBAT, Phase.PAUSED, Phase.VICTORY, Phase.DEFEAT],
  [Phase.COMBAT]: [Phase.PLANNING, Phase.PAUSED, Phase.VICTORY, Phase.DEFEAT],
  [Phase.PAUSED]: [Phase.PLANNING, Phase.COMBAT],
  [Phase.VICTORY]: [Phase.MENU, Phase.PLANNING, Phase.TOWER_STORE],
  [Phase.DEFEAT]: [Phase.MENU, Phase.PLANNING, Phase.TOWER_STORE],
};

// ============================================================================
// GameStateMachine Class
// ============================================================================

export class GameStateMachine {
  private phase: GamePhase;
  private previousPhase: GamePhase | null = null;
  private onPhaseChange: PhaseChangeCallback | null;

  constructor(config?: GameStateMachineConfig) {
    this.phase = config?.initialPhase ?? Phase.MENU;
    this.onPhaseChange = config?.onPhaseChange ?? null;
  }

  /**
   * Get the current phase.
   */
  getPhase(): GamePhase {
    return this.phase;
  }

  /**
   * Get the previous phase (before the last transition).
   */
  getPreviousPhase(): GamePhase | null {
    return this.previousPhase;
  }

  /**
   * Set the phase change callback.
   */
  setOnPhaseChange(callback: PhaseChangeCallback): void {
    this.onPhaseChange = callback;
  }

  /**
   * Check if a transition to the target phase is valid.
   */
  canTransitionTo(target: GamePhase): boolean {
    return VALID_TRANSITIONS[this.phase]?.includes(target) ?? false;
  }

  /**
   * Transition to a new phase.
   * @returns true if transition was successful, false if invalid
   */
  transitionTo(newPhase: GamePhase): boolean {
    if (this.phase === newPhase) return false;
    if (!this.canTransitionTo(newPhase)) return false;

    const oldPhase = this.phase;
    this.previousPhase = oldPhase;
    this.phase = newPhase;

    if (this.onPhaseChange) {
      this.onPhaseChange(oldPhase, newPhase);
    }

    return true;
  }

  /**
   * Force set the phase without validation.
   * Use sparingly - mainly for game restarts.
   */
  forcePhase(newPhase: GamePhase): void {
    const oldPhase = this.phase;
    if (oldPhase === newPhase) return;

    this.previousPhase = oldPhase;
    this.phase = newPhase;

    if (this.onPhaseChange) {
      this.onPhaseChange(oldPhase, newPhase);
    }
  }

  /**
   * Reset to initial state.
   */
  reset(initialPhase: GamePhase = Phase.MENU): void {
    this.phase = initialPhase;
    this.previousPhase = null;
  }

  // ==========================================================================
  // Phase Query Helpers
  // ==========================================================================

  isMenu(): boolean {
    return this.phase === Phase.MENU;
  }

  isTowerStore(): boolean {
    return this.phase === Phase.TOWER_STORE;
  }

  isPlanning(): boolean {
    return this.phase === Phase.PLANNING;
  }

  isCombat(): boolean {
    return this.phase === Phase.COMBAT;
  }

  isPaused(): boolean {
    return this.phase === Phase.PAUSED;
  }

  isVictory(): boolean {
    return this.phase === Phase.VICTORY;
  }

  isDefeat(): boolean {
    return this.phase === Phase.DEFEAT;
  }

  isGameOver(): boolean {
    return this.phase === Phase.VICTORY || this.phase === Phase.DEFEAT;
  }

  isActive(): boolean {
    return this.phase === Phase.PLANNING || this.phase === Phase.COMBAT;
  }

  /**
   * Check if game can be started (from MENU, TOWER_STORE, VICTORY, or DEFEAT).
   */
  canStartGame(): boolean {
    return (
      this.phase === Phase.MENU ||
      this.phase === Phase.TOWER_STORE ||
      this.phase === Phase.VICTORY ||
      this.phase === Phase.DEFEAT
    );
  }

  /**
   * Check if wave can be started (from PLANNING only).
   */
  canStartWave(): boolean {
    return this.phase === Phase.PLANNING;
  }

  /**
   * Check if game can be paused (from PLANNING or COMBAT).
   */
  canPause(): boolean {
    return this.phase === Phase.PLANNING || this.phase === Phase.COMBAT;
  }

  /**
   * Check if game can be resumed (from PAUSED only).
   */
  canResume(): boolean {
    return this.phase === Phase.PAUSED;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createGameStateMachine(config?: GameStateMachineConfig): GameStateMachine {
  return new GameStateMachine(config);
}
