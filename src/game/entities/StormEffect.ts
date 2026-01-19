// StormEffect Entity for Space Towers
// Area-of-effect damage zone that persists for a duration

import type { Point } from '../types';
import type { Poolable } from '../pools';

// Default configuration values
export const STORM_DEFAULTS = {
  RADIUS: 50,
  DURATION: 3, // seconds
  DAMAGE_PER_SECOND: 10,
} as const;

export class StormEffect implements Poolable {
  id: string = '';
  position: Point = { x: 0, y: 0 };
  radius: number = STORM_DEFAULTS.RADIUS;
  duration: number = STORM_DEFAULTS.DURATION;
  damagePerSecond: number = STORM_DEFAULTS.DAMAGE_PER_SECOND;
  startTime: number = 0;
  active: boolean = false;
  sourceId: string = ''; // Tower ID that created this storm (for kill attribution)

  /**
   * Update the storm effect
   * @param currentTime - Current game time in seconds
   * @returns true if the storm has expired and should be removed
   */
  update(currentTime: number): boolean {
    if (!this.active) {
      return true;
    }

    const elapsed = currentTime - this.startTime;
    if (elapsed >= this.duration) {
      this.active = false;
      return true;
    }

    return false;
  }

  /**
   * Get the remaining duration of the storm
   * @param currentTime - Current game time in seconds
   * @returns Remaining duration in seconds
   */
  getRemainingDuration(currentTime: number): number {
    if (!this.active) {
      return 0;
    }
    const elapsed = currentTime - this.startTime;
    return Math.max(0, this.duration - elapsed);
  }

  /**
   * Check if a point is within the storm's area of effect
   * @param point - The point to check
   * @returns true if the point is within the storm radius
   */
  containsPoint(point: Point): boolean {
    const dx = point.x - this.position.x;
    const dy = point.y - this.position.y;
    const distanceSquared = dx * dx + dy * dy;
    return distanceSquared <= this.radius * this.radius;
  }

  /**
   * Calculate damage for a given time delta
   * @param deltaTime - Time elapsed in seconds
   * @returns Damage to apply
   */
  calculateDamage(deltaTime: number): number {
    return this.damagePerSecond * deltaTime;
  }

  /**
   * Reset the storm effect to default values (for object pooling)
   */
  reset(): void {
    this.id = '';
    this.position.x = 0;
    this.position.y = 0;
    this.radius = STORM_DEFAULTS.RADIUS;
    this.duration = STORM_DEFAULTS.DURATION;
    this.damagePerSecond = STORM_DEFAULTS.DAMAGE_PER_SECOND;
    this.startTime = 0;
    this.active = false;
    this.sourceId = '';
  }

  /**
   * Initialize the storm effect with specific values
   * @param id - Unique identifier
   * @param position - Center position of the storm
   * @param startTime - Game time when the storm was created
   * @param radius - Radius of the storm effect (default: 50)
   * @param duration - Duration in seconds (default: 3)
   * @param damagePerSecond - Damage per second to enemies (default: 10)
   * @param sourceId - Tower ID that created this storm (for kill attribution)
   */
  init(
    id: string,
    position: Point,
    startTime: number,
    radius: number = STORM_DEFAULTS.RADIUS,
    duration: number = STORM_DEFAULTS.DURATION,
    damagePerSecond: number = STORM_DEFAULTS.DAMAGE_PER_SECOND,
    sourceId: string = ''
  ): void {
    this.id = id;
    this.position.x = position.x;
    this.position.y = position.y;
    this.radius = radius;
    this.duration = duration;
    this.damagePerSecond = damagePerSecond;
    this.startTime = startTime;
    this.active = true;
    this.sourceId = sourceId;
  }

  /**
   * Check if the storm is still active
   */
  get isActive(): boolean {
    return this.active;
  }

  /**
   * Check if the storm has expired
   * @param currentTime - Current game time in seconds
   */
  isExpired(currentTime: number): boolean {
    return !this.active || currentTime - this.startTime >= this.duration;
  }
}
