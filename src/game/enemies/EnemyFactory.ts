// Enemy Factory for Space Towers

import type { EnemyType, Point } from '../types';
import { Enemy } from './Enemy';
import { ObjectPool } from '../pools';
import { GAME_CONFIG } from '../config';

/**
 * Factory for creating Enemy instances using object pooling.
 * Generates unique IDs and supports all enemy types (scout, fighter, tank, swarm, boss).
 */
export class EnemyFactory {
  private nextId: number = 1;
  private pool: ObjectPool<Enemy>;

  constructor() {
    this.pool = new ObjectPool<Enemy>({
      create: () => new Enemy(),
      reset: (enemy) => enemy.reset(),
      initialSize: GAME_CONFIG.MAX_ENEMIES,
    });
  }

  /**
   * Create a new enemy of the specified type at the given position.
   * Acquires from pool and initializes with stats from ENEMY_STATS.
   * @param type - The type of enemy to create (scout, fighter, tank, swarm, boss)
   * @param startPosition - Starting position for the enemy
   * @returns An initialized Enemy instance from the pool
   */
  create(type: EnemyType, startPosition: Point): Enemy {
    const enemy = this.pool.acquire();
    const id = this.generateId();
    enemy.init(id, type, startPosition);
    return enemy;
  }

  /**
   * Release an enemy back to the pool for reuse.
   * @param enemy - The enemy to release
   */
  release(enemy: Enemy): void {
    this.pool.release(enemy);
  }

  /**
   * Release an enemy by its ID.
   * @param id - The ID of the enemy to release
   */
  releaseById(id: string): void {
    this.pool.releaseById(id);
  }

  /**
   * Get all currently active enemies.
   * @returns Array of active Enemy instances
   */
  getActive(): Enemy[] {
    return this.pool.getActive();
  }

  /**
   * Get an active enemy by ID.
   * @param id - The enemy ID to look up
   * @returns The Enemy if found, undefined otherwise
   */
  getActiveById(id: string): Enemy | undefined {
    return this.pool.getActiveById(id);
  }

  /**
   * Generate a unique enemy ID.
   * Format: enemy_<incrementing number>
   */
  private generateId(): string {
    return `enemy_${this.nextId++}`;
  }

  /**
   * Reset the factory and pool.
   * Returns all active enemies to the pool and resets the ID counter.
   */
  reset(): void {
    this.pool.reset();
    this.nextId = 1;
  }

  /**
   * Get the number of currently active enemies.
   */
  get activeCount(): number {
    return this.pool.activeCount;
  }

  /**
   * Get the number of enemies available in the pool.
   */
  get availableCount(): number {
    return this.pool.availableCount;
  }

  /**
   * Get the current ID counter value.
   * Useful for serialization/debugging.
   */
  getNextId(): number {
    return this.nextId;
  }

  /**
   * Set the ID counter to a specific value.
   * Useful for deserialization.
   */
  setNextId(id: number): void {
    this.nextId = id;
  }
}
