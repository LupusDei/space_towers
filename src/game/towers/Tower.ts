// Tower Class for Space Towers

import type { Tower as TowerData, TowerType, Point } from '../types';
import { TOWER_STATS } from '../config';

/**
 * Tower class representing a defensive structure.
 * Handles targeting, cooldown management, and firing logic.
 */
export class Tower implements TowerData {
  readonly id: string;
  readonly type: TowerType;
  readonly position: Point;
  level: number;
  damage: number;
  range: number;
  fireRate: number;
  lastFired: number;
  target: string | null;
  targetPosition: Point | null;
  kills: number;
  totalDamage: number;

  /** Time remaining until tower can fire again (seconds) */
  private cooldownRemaining: number;

  constructor(id: string, type: TowerType, position: Point) {
    const stats = TOWER_STATS[type];

    this.id = id;
    this.type = type;
    this.position = { x: position.x, y: position.y };
    this.level = 1;
    this.damage = stats.damage;
    this.range = stats.range;
    this.fireRate = stats.fireRate;
    this.lastFired = 0;
    this.target = null;
    this.targetPosition = null;
    this.kills = 0;
    this.totalDamage = 0;
    this.cooldownRemaining = 0; // Ready to fire immediately
  }

  /**
   * Update tower state each frame.
   * Decrements cooldown timer.
   * @param dt - Delta time in seconds
   */
  update(dt: number): void {
    if (this.cooldownRemaining > 0) {
      this.cooldownRemaining -= dt;
      if (this.cooldownRemaining < 0) {
        this.cooldownRemaining = 0;
      }
    }
  }

  /**
   * Check if the tower is ready to fire.
   * @returns true if cooldown has elapsed
   */
  canFire(): boolean {
    return this.cooldownRemaining <= 0;
  }

  /**
   * Fire at the current target.
   * Resets cooldown and updates lastFired timestamp.
   * @param currentTime - Current game time in milliseconds
   * @returns Firing data for projectile creation, or null if cannot fire
   */
  fire(currentTime: number): { targetId: string; damage: number } | null {
    if (!this.canFire() || this.target === null) {
      return null;
    }

    this.cooldownRemaining = this.fireRate;
    this.lastFired = currentTime;

    return {
      targetId: this.target,
      damage: this.damage,
    };
  }

  /**
   * Set the tower's current target.
   * @param targetId - Enemy ID to target, or null to clear
   * @param targetPosition - Position of the target for turret rotation
   */
  setTarget(targetId: string | null, targetPosition?: Point | null): void {
    this.target = targetId;
    this.targetPosition = targetPosition ?? null;
  }

  /**
   * Get the cooldown remaining in seconds.
   */
  getCooldownRemaining(): number {
    return this.cooldownRemaining;
  }

  /**
   * Check if a point is within this tower's range.
   * @param point - Position to check
   * @returns true if within range
   */
  isInRange(point: Point): boolean {
    const dx = point.x - this.position.x;
    const dy = point.y - this.position.y;
    const distanceSquared = dx * dx + dy * dy;
    return distanceSquared <= this.range * this.range;
  }

  /**
   * Upgrade the tower to the next level.
   * Recalculates stats based on the new level.
   * @returns true if upgrade was successful
   */
  upgrade(): boolean {
    const stats = TOWER_STATS[this.type];
    if (this.level >= stats.maxLevel) {
      return false;
    }

    this.level++;
    this.damage = stats.damage + (this.level - 1) * stats.damagePerLevel;
    this.range = stats.range + (this.level - 1) * stats.rangePerLevel;
    this.fireRate = stats.fireRate + (this.level - 1) * stats.fireRatePerLevel;

    return true;
  }

  /**
   * Convert to plain data object matching TowerData interface.
   */
  toData(): TowerData {
    return {
      id: this.id,
      type: this.type,
      position: { ...this.position },
      level: this.level,
      damage: this.damage,
      range: this.range,
      fireRate: this.fireRate,
      lastFired: this.lastFired,
      target: this.target,
      targetPosition: this.targetPosition ? { ...this.targetPosition } : null,
      kills: this.kills,
      totalDamage: this.totalDamage,
    };
  }
}
