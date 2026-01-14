// GameLoopManager - Game loop with fixed timestep
// Handles start/stop, animation frames, and update callbacks

import { GAME_CONFIG } from '../config';

// ============================================================================
// Constants
// ============================================================================

const FIXED_TIMESTEP = 1000 / GAME_CONFIG.TICK_RATE; // ~16.67ms at 60fps
const MAX_FRAME_TIME = 250; // Prevent spiral of death

// ============================================================================
// Types
// ============================================================================

export type UpdateCallback = (dt: number) => void;

export interface GameLoopManagerConfig {
  tickRate?: number;
  maxFrameTime?: number;
}

// ============================================================================
// GameLoopManager Class
// ============================================================================

export class GameLoopManager {
  private running = false;
  private lastTime = 0;
  private accumulator = 0;
  private animationFrameId: number | null = null;
  private updateCallback: UpdateCallback | null = null;
  private isPausedFn: (() => boolean) | null = null;

  private readonly fixedTimestep: number;
  private readonly maxFrameTime: number;

  constructor(config?: GameLoopManagerConfig) {
    this.fixedTimestep = config?.tickRate
      ? 1000 / config.tickRate
      : FIXED_TIMESTEP;
    this.maxFrameTime = config?.maxFrameTime ?? MAX_FRAME_TIME;
  }

  /**
   * Set the update callback that will be called each fixed timestep.
   * @param callback - Function to call with delta time in seconds
   */
  setUpdateCallback(callback: UpdateCallback): void {
    this.updateCallback = callback;
  }

  /**
   * Set a function to check if the game is paused.
   * When paused, the loop continues but update is not called.
   */
  setPausedCheck(fn: () => boolean): void {
    this.isPausedFn = fn;
  }

  /**
   * Start the game loop.
   */
  start(): void {
    if (this.running) return;

    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;

    this.loop(this.lastTime);
  }

  /**
   * Stop the game loop.
   */
  stop(): void {
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Check if the game loop is currently running.
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Reset the loop state without stopping.
   * Useful when restarting a game.
   */
  reset(): void {
    this.lastTime = 0;
    this.accumulator = 0;
  }

  /**
   * The main game loop using requestAnimationFrame.
   * Uses fixed timestep for deterministic updates.
   */
  private loop = (currentTime: number): void => {
    if (!this.running) return;

    let frameTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Clamp frame time to prevent spiral of death
    if (frameTime > this.maxFrameTime) {
      frameTime = this.maxFrameTime;
    }

    this.accumulator += frameTime;

    // Fixed timestep updates
    while (this.accumulator >= this.fixedTimestep) {
      const isPaused = this.isPausedFn ? this.isPausedFn() : false;
      if (!isPaused && this.updateCallback) {
        this.updateCallback(this.fixedTimestep / 1000); // Convert to seconds
      }
      this.accumulator -= this.fixedTimestep;
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  /**
   * Get the fixed timestep in milliseconds.
   */
  getFixedTimestep(): number {
    return this.fixedTimestep;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createGameLoopManager(config?: GameLoopManagerConfig): GameLoopManager {
  return new GameLoopManager(config);
}
