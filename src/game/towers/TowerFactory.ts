// Tower Factory for Space Towers

import type { TowerType, Point } from '../types';
import { Tower } from './Tower';

/**
 * Factory for creating Tower instances.
 * Generates unique IDs and supports all tower types.
 */
export class TowerFactory {
  private nextId: number = 1;

  /**
   * Create a new tower of the specified type at the given position.
   * @param type - The type of tower to create (laser, missile, tesla, cannon)
   * @param position - Grid position for the tower
   * @returns A new Tower instance
   */
  create(type: TowerType, position: Point): Tower {
    const id = this.generateId();
    return new Tower(id, type, position);
  }

  /**
   * Generate a unique tower ID.
   * Format: tower_<incrementing number>
   */
  private generateId(): string {
    return `tower_${this.nextId++}`;
  }

  /**
   * Reset the ID counter.
   * Useful for starting a new game.
   */
  reset(): void {
    this.nextId = 1;
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
