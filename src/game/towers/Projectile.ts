// Projectile Class for Space Towers
// Poolable projectile for Plasma Cannon and Missile Battery

import type { TowerType, Point } from '../types';
import type { Poolable } from '../pools';

export class Projectile implements Poolable {
  id: string = '';
  type: TowerType = 'cannon';
  sourceId: string = '';
  targetId: string = '';
  position: Point = { x: 0, y: 0 };
  targetPosition: Point = { x: 0, y: 0 };
  speed: number = 0;
  damage: number = 0;
  piercing: boolean = false;
  aoe: number = 0;

  update(dt: number): boolean {
    const dx = this.targetPosition.x - this.position.x;
    const dy = this.targetPosition.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 0.1) {
      // Arrived at target
      this.position.x = this.targetPosition.x;
      this.position.y = this.targetPosition.y;
      return true;
    }

    const moveDistance = this.speed * dt;
    if (moveDistance >= distance) {
      // Would overshoot, snap to target
      this.position.x = this.targetPosition.x;
      this.position.y = this.targetPosition.y;
      return true;
    }

    // Move toward target
    const ratio = moveDistance / distance;
    this.position.x += dx * ratio;
    this.position.y += dy * ratio;

    return false;
  }

  reset(): void {
    this.id = '';
    this.type = 'cannon';
    this.sourceId = '';
    this.targetId = '';
    this.position.x = 0;
    this.position.y = 0;
    this.targetPosition.x = 0;
    this.targetPosition.y = 0;
    this.speed = 0;
    this.damage = 0;
    this.piercing = false;
    this.aoe = 0;
  }

  init(
    id: string,
    type: TowerType,
    sourceId: string,
    targetId: string,
    startPosition: Point,
    targetPosition: Point,
    speed: number,
    damage: number,
    piercing: boolean = false,
    aoe: number = 0
  ): void {
    this.id = id;
    this.type = type;
    this.sourceId = sourceId;
    this.targetId = targetId;
    this.position.x = startPosition.x;
    this.position.y = startPosition.y;
    this.targetPosition.x = targetPosition.x;
    this.targetPosition.y = targetPosition.y;
    this.speed = speed;
    this.damage = damage;
    this.piercing = piercing;
    this.aoe = aoe;
  }

  get velocity(): Point {
    const dx = this.targetPosition.x - this.position.x;
    const dy = this.targetPosition.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance === 0) {
      return { x: 0, y: 0 };
    }
    return {
      x: (dx / distance) * this.speed,
      y: (dy / distance) * this.speed,
    };
  }

  get distanceToTarget(): number {
    const dx = this.targetPosition.x - this.position.x;
    const dy = this.targetPosition.y - this.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  get hasArrived(): boolean {
    return this.distanceToTarget < 0.1;
  }
}
