import { describe, it, expect } from 'vitest';
import { findTarget, findChainTargets, getEnemiesInSplash } from './Targeting';
import { GAME_CONFIG } from '../config';
import type { Tower, Enemy, Point, QueryInterface, GameState, CellState } from '../types';
import { TowerType, EnemyType } from '../types';

// Helper to create mock enemy
function createEnemy(overrides: Partial<Enemy> = {}): Enemy {
  return {
    id: 'enemy-1',
    type: EnemyType.SCOUT,
    position: { x: 100, y: 100 },
    health: 30,
    maxHealth: 30,
    speed: 80,
    armor: 0,
    reward: 10,
    pathIndex: 0,
    path: [],
    ...overrides,
  };
}

// Helper to create mock tower
function createTower(overrides: Partial<Tower> = {}): Tower {
  return {
    id: 'tower-1',
    type: TowerType.LASER,
    position: { x: 0, y: 0 },
    level: 1,
    damage: 10,
    range: 150,
    fireRate: 0.5,
    lastFired: 0,
    target: null,
    ...overrides,
  };
}

// Helper to create mock QueryInterface
function createMockQuery(enemies: Enemy[] = []): QueryInterface {
  return {
    getTowers: () => [],
    getEnemies: () => enemies,
    getProjectiles: () => [],
    getTowerById: () => undefined,
    getEnemyById: (id: string) => enemies.find((e) => e.id === id),
    getEnemiesInRange: (position: Point, range: number) => {
      return enemies.filter((enemy) => {
        const dx = enemy.position.x - position.x;
        const dy = enemy.position.y - position.y;
        return Math.sqrt(dx * dx + dy * dy) <= range;
      });
    },
    getPath: () => [],
    getCell: () => 'empty' as CellState,
    getGameState: () => ({}) as GameState,
  };
}

describe('findTarget', () => {
  it('returns null when no enemies in range', () => {
    const tower = createTower({ position: { x: 0, y: 0 }, range: 100 });
    const enemies = [createEnemy({ position: { x: 500, y: 500 } })];
    const query = createMockQuery(enemies);

    const result = findTarget(tower, query);
    expect(result).toBeNull();
  });

  it('returns the only enemy when one is in range', () => {
    const tower = createTower({ position: { x: 0, y: 0 }, range: 150 });
    const enemy = createEnemy({ id: 'enemy-1', position: { x: 100, y: 0 } });
    const query = createMockQuery([enemy]);

    const result = findTarget(tower, query);
    expect(result).toEqual(enemy);
  });

  it('returns enemy furthest along path when multiple in range', () => {
    const tower = createTower({ position: { x: 0, y: 0 }, range: 200 });
    const enemy1 = createEnemy({ id: 'enemy-1', position: { x: 50, y: 0 }, pathIndex: 3 });
    const enemy2 = createEnemy({ id: 'enemy-2', position: { x: 100, y: 0 }, pathIndex: 7 });
    const enemy3 = createEnemy({ id: 'enemy-3', position: { x: 150, y: 0 }, pathIndex: 5 });
    const query = createMockQuery([enemy1, enemy2, enemy3]);

    const result = findTarget(tower, query);
    expect(result?.id).toBe('enemy-2');
  });

  it('returns null when enemies array is empty', () => {
    const tower = createTower();
    const query = createMockQuery([]);

    const result = findTarget(tower, query);
    expect(result).toBeNull();
  });
});

describe('findChainTargets', () => {
  const CELL_SIZE = GAME_CONFIG.CELL_SIZE;

  it('returns empty array when no other enemies exist', () => {
    const primary = createEnemy({ position: { x: 100, y: 100 } });
    const query = createMockQuery([primary]);

    const result = findChainTargets(primary, query, 2, 2);
    expect(result).toEqual([]);
  });

  it('returns empty array when other enemies are out of chain range', () => {
    const primary = createEnemy({ id: 'primary', position: { x: 0, y: 0 } });
    const farEnemy = createEnemy({ id: 'far', position: { x: 500, y: 500 } });
    const query = createMockQuery([primary, farEnemy]);

    const result = findChainTargets(primary, query, 2, 2);
    expect(result).toEqual([]);
  });

  it('returns enemies within chain range', () => {
    const primary = createEnemy({ id: 'primary', position: { x: 0, y: 0 } });
    const nearby = createEnemy({ id: 'nearby', position: { x: CELL_SIZE, y: 0 } }); // 1 cell away
    const query = createMockQuery([primary, nearby]);

    const result = findChainTargets(primary, query, 2, 2);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('nearby');
  });

  it('excludes primary target from results', () => {
    const primary = createEnemy({ id: 'primary', position: { x: 0, y: 0 } });
    const query = createMockQuery([primary]);

    const result = findChainTargets(primary, query, 2, 2);
    expect(result.find((e) => e.id === 'primary')).toBeUndefined();
  });

  it('limits results to maxChain parameter', () => {
    const primary = createEnemy({ id: 'primary', position: { x: 0, y: 0 } });
    const enemy1 = createEnemy({ id: 'e1', position: { x: CELL_SIZE * 0.5, y: 0 } });
    const enemy2 = createEnemy({ id: 'e2', position: { x: CELL_SIZE, y: 0 } });
    const enemy3 = createEnemy({ id: 'e3', position: { x: CELL_SIZE * 1.5, y: 0 } });
    const query = createMockQuery([primary, enemy1, enemy2, enemy3]);

    const result = findChainTargets(primary, query, 2, 2);
    expect(result.length).toBe(2);
  });

  it('sorts results by distance from primary (closest first)', () => {
    const primary = createEnemy({ id: 'primary', position: { x: 0, y: 0 } });
    const far = createEnemy({ id: 'far', position: { x: CELL_SIZE * 1.5, y: 0 } });
    const near = createEnemy({ id: 'near', position: { x: CELL_SIZE * 0.5, y: 0 } });
    const query = createMockQuery([primary, far, near]);

    const result = findChainTargets(primary, query, 2, 2);
    expect(result[0].id).toBe('near');
    expect(result[1].id).toBe('far');
  });
});

describe('getEnemiesInSplash', () => {
  const CELL_SIZE = GAME_CONFIG.CELL_SIZE;

  it('returns empty array when no enemies exist', () => {
    const query = createMockQuery([]);
    const result = getEnemiesInSplash({ x: 100, y: 100 }, query, 1.5);
    expect(result).toEqual([]);
  });

  it('returns empty array when all enemies out of splash radius', () => {
    const farEnemy = createEnemy({ position: { x: 500, y: 500 } });
    const query = createMockQuery([farEnemy]);

    const result = getEnemiesInSplash({ x: 0, y: 0 }, query, 1.5);
    expect(result).toEqual([]);
  });

  it('returns enemies within splash radius', () => {
    const nearEnemy = createEnemy({ id: 'near', position: { x: CELL_SIZE, y: 0 } }); // 1 cell away
    const query = createMockQuery([nearEnemy]);

    const result = getEnemiesInSplash({ x: 0, y: 0 }, query, 1.5);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('near');
  });

  it('returns all enemies within radius, not limited', () => {
    const enemy1 = createEnemy({ id: 'e1', position: { x: 10, y: 0 } });
    const enemy2 = createEnemy({ id: 'e2', position: { x: 0, y: 10 } });
    const enemy3 = createEnemy({ id: 'e3', position: { x: 10, y: 10 } });
    const query = createMockQuery([enemy1, enemy2, enemy3]);

    const result = getEnemiesInSplash({ x: 0, y: 0 }, query, 1.5);
    expect(result.length).toBe(3);
  });

  it('uses default splash radius of 1.5 cells', () => {
    const nearEnemy = createEnemy({ position: { x: CELL_SIZE, y: 0 } }); // 1 cell = within 1.5 cell radius
    const farEnemy = createEnemy({ id: 'far', position: { x: CELL_SIZE * 2, y: 0 } }); // 2 cells = outside 1.5 cell radius
    const query = createMockQuery([nearEnemy, farEnemy]);

    const result = getEnemiesInSplash({ x: 0, y: 0 }, query);
    expect(result.length).toBe(1);
  });

  it('correctly handles enemies at exact boundary', () => {
    const splashRadius = 1.5;
    const exactBoundary = CELL_SIZE * splashRadius;
    const atBoundary = createEnemy({ id: 'boundary', position: { x: exactBoundary, y: 0 } });
    const query = createMockQuery([atBoundary]);

    const result = getEnemiesInSplash({ x: 0, y: 0 }, query, splashRadius);
    expect(result.length).toBe(1);
  });
});
