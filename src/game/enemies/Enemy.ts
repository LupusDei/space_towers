// Enemy Class for Space Towers

import type { EnemyType, Point } from '../types';
import type { Poolable } from '../pools';
import { ENEMY_STATS } from '../config';

export class Enemy implements Poolable {
  id: string = '';
  type: EnemyType = 'scout';
  health: number = 0;
  maxHealth: number = 0;
  speed: number = 0;
  position: Point = { x: 0, y: 0 };
  pathIndex: number = 0;
  armor: number = 0;
  reward: number = 0;

  update(dt: number, path: Point[]): boolean {
    if (path.length === 0 || this.pathIndex >= path.length) {
      return true; // Reached end of path
    }

    const target = path[this.pathIndex];
    const dx = target.x - this.position.x;
    const dy = target.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 1) {
      this.pathIndex++;
      if (this.pathIndex >= path.length) {
        return true; // Reached end of path
      }
      return false;
    }

    const moveDistance = this.speed * dt;
    if (moveDistance >= distance) {
      this.position.x = target.x;
      this.position.y = target.y;
      this.pathIndex++;
    } else {
      const ratio = moveDistance / distance;
      this.position.x += dx * ratio;
      this.position.y += dy * ratio;
    }

    return false;
  }

  takeDamage(amount: number): boolean {
    const effectiveDamage = Math.max(0, amount - this.armor);
    this.health -= effectiveDamage;
    return this.health <= 0;
  }

  reset(): void {
    this.id = '';
    this.type = 'scout';
    this.health = 0;
    this.maxHealth = 0;
    this.speed = 0;
    this.position.x = 0;
    this.position.y = 0;
    this.pathIndex = 0;
    this.armor = 0;
    this.reward = 0;
  }

  init(id: string, type: EnemyType, startPosition: Point): void {
    const stats = ENEMY_STATS[type];
    this.id = id;
    this.type = type;
    this.health = stats.health;
    this.maxHealth = stats.health;
    this.speed = stats.speed;
    this.armor = stats.armor;
    this.reward = stats.reward;
    this.position.x = startPosition.x;
    this.position.y = startPosition.y;
    this.pathIndex = 0;
  }

  get isDead(): boolean {
    return this.health <= 0;
  }

  get healthPercent(): number {
    return this.maxHealth > 0 ? this.health / this.maxHealth : 0;
  }
}
