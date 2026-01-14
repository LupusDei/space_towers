// Object Pool Implementation for Space Towers

import type { Enemy, EnemyType, Projectile, Point } from './types';

// ============================================================================
// Generic Object Pool
// ============================================================================

export interface Poolable {
  id: string;
}

export interface PoolConfig<T> {
  create: () => T;
  reset: (item: T) => void;
  initialSize?: number;
}

export class ObjectPool<T extends Poolable> {
  private available: T[] = [];
  private active: Map<string, T> = new Map();
  private readonly create: () => T;
  private readonly resetItem: (item: T) => void;

  constructor(config: PoolConfig<T>) {
    this.create = config.create;
    this.resetItem = config.reset;

    if (config.initialSize) {
      for (let i = 0; i < config.initialSize; i++) {
        this.available.push(this.create());
      }
    }
  }

  acquire(): T {
    let item: T;
    if (this.available.length > 0) {
      item = this.available.pop()!;
    } else {
      item = this.create();
    }
    this.active.set(item.id, item);
    return item;
  }

  release(item: T): void {
    if (this.active.has(item.id)) {
      this.active.delete(item.id);
      this.resetItem(item);
      this.available.push(item);
    }
  }

  releaseById(id: string): void {
    const item = this.active.get(id);
    if (item) {
      this.release(item);
    }
  }

  reset(): void {
    this.active.forEach((item) => {
      this.resetItem(item);
      this.available.push(item);
    });
    this.active.clear();
  }

  getActive(): T[] {
    return Array.from(this.active.values());
  }

  getActiveById(id: string): T | undefined {
    return this.active.get(id);
  }

  get activeCount(): number {
    return this.active.size;
  }

  get availableCount(): number {
    return this.available.length;
  }

  get totalCount(): number {
    return this.active.size + this.available.length;
  }
}

// ============================================================================
// ID Generation
// ============================================================================

let enemyIdCounter = 0;
let projectileIdCounter = 0;

function generateEnemyId(): string {
  return `enemy_${++enemyIdCounter}`;
}

function generateProjectileId(): string {
  return `proj_${++projectileIdCounter}`;
}

// ============================================================================
// Default Point
// ============================================================================

const ZERO_POINT: Point = { x: 0, y: 0 };

// ============================================================================
// Enemy Pool
// ============================================================================

function createEnemy(): Enemy {
  return {
    id: generateEnemyId(),
    type: 'scout' as EnemyType,
    position: { ...ZERO_POINT },
    health: 0,
    maxHealth: 0,
    speed: 0,
    armor: 0,
    reward: 0,
    pathIndex: 0,
    path: [],
  };
}

function resetEnemy(enemy: Enemy): void {
  enemy.id = generateEnemyId();
  enemy.type = 'scout' as EnemyType;
  enemy.position.x = 0;
  enemy.position.y = 0;
  enemy.health = 0;
  enemy.maxHealth = 0;
  enemy.speed = 0;
  enemy.armor = 0;
  enemy.reward = 0;
  enemy.pathIndex = 0;
  enemy.path = [];
}

export const enemyPool = new ObjectPool<Enemy>({
  create: createEnemy,
  reset: resetEnemy,
  initialSize: 50,
});

// ============================================================================
// Projectile Pool
// ============================================================================

function createProjectile(): Projectile {
  return {
    id: generateProjectileId(),
    sourceId: '',
    targetId: '',
    position: { ...ZERO_POINT },
    velocity: { ...ZERO_POINT },
    damage: 0,
    speed: 0,
    piercing: false,
    aoe: 0,
  };
}

function resetProjectile(projectile: Projectile): void {
  projectile.id = generateProjectileId();
  projectile.sourceId = '';
  projectile.targetId = '';
  projectile.position.x = 0;
  projectile.position.y = 0;
  projectile.velocity.x = 0;
  projectile.velocity.y = 0;
  projectile.damage = 0;
  projectile.speed = 0;
  projectile.piercing = false;
  projectile.aoe = 0;
}

export const projectilePool = new ObjectPool<Projectile>({
  create: createProjectile,
  reset: resetProjectile,
  initialSize: 100,
});

// ============================================================================
// Factory Functions (for testing with isolated instances)
// ============================================================================

export function createEnemyPool(initialSize = 50): ObjectPool<Enemy> {
  return new ObjectPool<Enemy>({
    create: createEnemy,
    reset: resetEnemy,
    initialSize,
  });
}

export function createProjectilePool(initialSize = 100): ObjectPool<Projectile> {
  return new ObjectPool<Projectile>({
    create: createProjectile,
    reset: resetProjectile,
    initialSize,
  });
}
