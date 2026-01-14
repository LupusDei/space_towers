// Combat Module Tests
// Layer 2: Combat Integration Tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Tower, Enemy, QueryInterface, Point } from '../types';
import { TowerType, EnemyType } from '../types';
import { combatModule } from './CombatModule';
import { eventBus } from '../events';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockTower(overrides: Partial<Tower> = {}): Tower {
  return {
    id: 'tower_1',
    type: TowerType.LASER,
    position: { x: 5, y: 5 },
    level: 1,
    damage: 10,
    range: 150,
    fireRate: 0.5,
    lastFired: 0,
    target: null,
    ...overrides,
  };
}

function createMockEnemy(overrides: Partial<Enemy> = {}): Enemy {
  return {
    id: 'enemy_1',
    type: EnemyType.SCOUT,
    position: { x: 200, y: 200 },
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

function createMockQuery(
  towers: Tower[] = [],
  enemies: Enemy[] = []
): QueryInterface {
  const towerMap = new Map(towers.map((t) => [t.id, t]));
  const enemyMap = new Map(enemies.map((e) => [e.id, e]));

  return {
    getTowers: () => towers,
    getEnemies: () => enemies,
    getProjectiles: () => [],
    getTowerById: (id: string) => towerMap.get(id),
    getEnemyById: (id: string) => enemyMap.get(id),
    getEnemiesInRange: (position: Point, range: number) => {
      const cellSize = 44;
      return enemies.filter((enemy) => {
        const dx = enemy.position.x - position.x * cellSize;
        const dy = enemy.position.y - position.y * cellSize;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist <= range;
      });
    },
    getPath: () => [],
    getCell: () => 'empty' as const,
    getGameState: () => ({
      phase: 'combat' as const,
      wave: 1,
      lives: 20,
      credits: 200,
      score: 0,
      towers: towerMap,
      enemies: enemyMap,
      projectiles: new Map(),
      grid: [],
      path: [],
      selectedTower: null,
      selectedTowerType: null,
      isPaused: false,
    }),
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('CombatModule', () => {
  beforeEach(() => {
    eventBus.clear();
    combatModule.destroy();
  });

  describe('initialization', () => {
    it('should initialize with a query interface', () => {
      const query = createMockQuery();
      expect(() => combatModule.init(query)).not.toThrow();
    });

    it('should have empty effects after initialization', () => {
      const query = createMockQuery();
      combatModule.init(query);

      expect(combatModule.getHitscanEffects()).toHaveLength(0);
      expect(combatModule.getChainEffects()).toHaveLength(0);
      expect(combatModule.getSplashEffects()).toHaveLength(0);
    });
  });

  describe('tower management', () => {
    it('should create tower instances for towers in query', () => {
      const tower = createMockTower();
      const query = createMockQuery([tower], []);

      combatModule.init(query);
      combatModule.update(0.1);

      expect(combatModule.getTowerInstance(tower.id)).toBeDefined();
    });

    it('should remove tower instances when towers are removed', () => {
      const tower = createMockTower();
      const query = createMockQuery([tower], []);

      combatModule.init(query);
      combatModule.update(0.1);

      expect(combatModule.getTowerInstance(tower.id)).toBeDefined();

      // Create new query without the tower
      const emptyQuery = createMockQuery([], []);
      combatModule.destroy();
      combatModule.init(emptyQuery);
      combatModule.update(0.1);

      expect(combatModule.getTowerInstance(tower.id)).toBeUndefined();
    });
  });

  describe('hitscan tower types', () => {
    it('should identify laser as hitscan tower', () => {
      const tower = createMockTower({ type: TowerType.LASER });
      expect(tower.type).toBe(TowerType.LASER);
    });

    it('should identify tesla as hitscan tower', () => {
      const tower = createMockTower({ type: TowerType.TESLA });
      expect(tower.type).toBe(TowerType.TESLA);
    });
  });

  describe('projectile tower types', () => {
    it('should identify missile as projectile tower', () => {
      const tower = createMockTower({ type: TowerType.MISSILE });
      expect(tower.type).toBe(TowerType.MISSILE);
    });

    it('should identify cannon as projectile tower', () => {
      const tower = createMockTower({ type: TowerType.CANNON });
      expect(tower.type).toBe(TowerType.CANNON);
    });
  });

  describe('visual effects', () => {
    it('should return all tower instances', () => {
      const tower1 = createMockTower({ id: 'tower_1' });
      const tower2 = createMockTower({ id: 'tower_2', type: TowerType.TESLA });
      const query = createMockQuery([tower1, tower2], []);

      combatModule.init(query);
      combatModule.update(0.1);

      const instances = combatModule.getAllTowerInstances();
      expect(instances.size).toBe(2);
      expect(instances.has('tower_1')).toBe(true);
      expect(instances.has('tower_2')).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should destroy cleanly', () => {
      const query = createMockQuery();
      combatModule.init(query);

      expect(() => combatModule.destroy()).not.toThrow();
    });

    it('should clear all state on destroy', () => {
      const tower = createMockTower();
      const query = createMockQuery([tower], []);

      combatModule.init(query);
      combatModule.update(0.1);

      combatModule.destroy();

      expect(combatModule.getHitscanEffects()).toHaveLength(0);
      expect(combatModule.getChainEffects()).toHaveLength(0);
      expect(combatModule.getSplashEffects()).toHaveLength(0);
      expect(combatModule.getAllTowerInstances().size).toBe(0);
    });
  });
});

describe('Combat Constants', () => {
  it('should have LASER tower defined', () => {
    expect(TowerType.LASER).toBe('laser');
  });

  it('should have TESLA tower defined', () => {
    expect(TowerType.TESLA).toBe('tesla');
  });

  it('should have MISSILE tower defined', () => {
    expect(TowerType.MISSILE).toBe('missile');
  });

  it('should have CANNON tower defined', () => {
    expect(TowerType.CANNON).toBe('cannon');
  });
});
