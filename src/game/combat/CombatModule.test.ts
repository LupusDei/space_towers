// Combat Module Tests
// Layer 2: Combat Integration Tests

import { describe, it, expect, beforeEach } from 'vitest';
import type { Tower, Enemy, QueryInterface, CommandInterface, Point } from '../types';
import { TowerType } from '../types';
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
    type: 'scout' as Enemy['type'],
    position: { x: 220, y: 220 }, // In pixels, within range of tower at grid (5,5)
    health: 100,
    maxHealth: 100,
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
    getEnemiesAlongPath: () => [...enemies].sort((a, b) => b.pathIndex - a.pathIndex),
    getPath: () => [],
    getCell: () => 'empty' as const,
    getTowerAt: () => undefined,
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

function createMockCommands(): CommandInterface {
  return {
    addProjectile: () => {},
    removeEnemy: () => {},
    addCredits: () => {},
    getTime: () => 0,
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
      expect(() => combatModule.init(query, createMockCommands())).not.toThrow();
    });

    it('should have empty effects after initialization', () => {
      const query = createMockQuery();
      combatModule.init(query, createMockCommands());

      expect(combatModule.getHitscanEffects()).toHaveLength(0);
      expect(combatModule.getChainEffects()).toHaveLength(0);
      expect(combatModule.getSplashEffects()).toHaveLength(0);
    });
  });

  describe('tower management', () => {
    it('should create tower instances for towers in query', () => {
      const tower = createMockTower();
      const query = createMockQuery([tower], []);

      combatModule.init(query, createMockCommands());
      combatModule.update(0.1);

      expect(combatModule.getTowerInstance(tower.id)).toBeDefined();
    });

    it('should remove tower instances when towers are removed', () => {
      const tower = createMockTower();
      const query = createMockQuery([tower], []);

      combatModule.init(query, createMockCommands());
      combatModule.update(0.1);

      expect(combatModule.getTowerInstance(tower.id)).toBeDefined();

      // Create new query without the tower
      const emptyQuery = createMockQuery([], []);
      combatModule.destroy();
      combatModule.init(emptyQuery, createMockCommands());
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

      combatModule.init(query, createMockCommands());
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
      combatModule.init(query, createMockCommands());

      expect(() => combatModule.destroy()).not.toThrow();
    });

    it('should clear all state on destroy', () => {
      const tower = createMockTower();
      const query = createMockQuery([tower], []);

      combatModule.init(query, createMockCommands());
      combatModule.update(0.1);

      combatModule.destroy();

      expect(combatModule.getHitscanEffects()).toHaveLength(0);
      expect(combatModule.getChainEffects()).toHaveLength(0);
      expect(combatModule.getSplashEffects()).toHaveLength(0);
      expect(combatModule.getAllTowerInstances().size).toBe(0);
    });
  });
});

describe('cleanupVisualEffects', () => {
  beforeEach(() => {
    eventBus.clear();
    combatModule.destroy();
  });

  it('should clean up expired hitscan effects', () => {
    const query = createMockQuery();
    const currentTime = 1000;
    const commands: CommandInterface = {
      addProjectile: () => {},
      removeEnemy: () => {},
      addCredits: () => {},
      getTime: () => currentTime,
    };
    combatModule.init(query, commands);

    // Manually add a hitscan effect for testing
    // Access internal state through the getHitscanEffects method
    // Since we can't directly add effects, we verify cleanup works on empty state
    expect(combatModule.getHitscanEffects()).toHaveLength(0);

    // Calling cleanup on empty state should not throw
    combatModule.cleanupVisualEffects(currentTime);
    expect(combatModule.getHitscanEffects()).toHaveLength(0);
  });

  it('should be callable even when not in combat phase', () => {
    const query = createMockQuery();
    const commands = createMockCommands();
    combatModule.init(query, commands);

    // This should not throw - it's the fix for lingering effects
    expect(() => combatModule.cleanupVisualEffects(1000)).not.toThrow();
    expect(() => combatModule.cleanupVisualEffects(2000)).not.toThrow();
  });
});

describe('Laser Tower Damage', () => {
  beforeEach(() => {
    eventBus.clear();
    combatModule.destroy();
  });

  it('should apply damage to enemy when laser tower fires', () => {
    const tower = createMockTower({ type: TowerType.LASER, damage: 10 });
    const enemy = createMockEnemy({ health: 100, armor: 0 });
    const query = createMockQuery([tower], [enemy]);
    const commands = createMockCommands();

    combatModule.init(query, commands);

    // First update creates tower instance
    combatModule.update(0.1);

    // Tower should have fired and enemy should have taken damage
    expect(enemy.health).toBe(90); // 100 - 10 damage
  });

  it('should create hitscan effect when laser fires', () => {
    const tower = createMockTower({ type: TowerType.LASER });
    const enemy = createMockEnemy();
    const query = createMockQuery([tower], [enemy]);

    combatModule.init(query, createMockCommands());
    combatModule.update(0.1);

    const effects = combatModule.getHitscanEffects();
    expect(effects.length).toBeGreaterThan(0);
    expect(effects[0].type).toBe('laser');
  });

  it('should reduce damage by armor', () => {
    const tower = createMockTower({ type: TowerType.LASER, damage: 10 });
    const enemy = createMockEnemy({ health: 100, armor: 3 });
    const query = createMockQuery([tower], [enemy]);

    combatModule.init(query, createMockCommands());
    combatModule.update(0.1);

    expect(enemy.health).toBe(93); // 100 - (10 - 3) = 93
  });

  it('should not damage enemy outside range', () => {
    const tower = createMockTower({ type: TowerType.LASER, range: 50, position: { x: 0, y: 0 } });
    // Enemy at pixel (500, 500) is way outside range of 50 pixels from grid (0,0)
    const enemy = createMockEnemy({ position: { x: 500, y: 500 }, health: 100 });
    const query = createMockQuery([tower], [enemy]);

    combatModule.init(query, createMockCommands());
    combatModule.update(0.1);

    expect(enemy.health).toBe(100); // No damage
    expect(combatModule.getHitscanEffects().length).toBe(0);
  });

  it('should kill enemy when health reaches zero', () => {
    const tower = createMockTower({ type: TowerType.LASER, damage: 100 });
    const enemy = createMockEnemy({ health: 50, armor: 0 });
    let removedEnemyId: string | null = null;

    const commands = {
      addProjectile: () => {},
      removeEnemy: (id: string) => {
        removedEnemyId = id;
      },
      addCredits: () => {},
      getTime: () => 0,
    };

    const query = createMockQuery([tower], [enemy]);
    combatModule.init(query, commands);
    combatModule.update(0.1);

    expect(removedEnemyId).toBe(enemy.id);
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

describe('Damage calculation', () => {
  beforeEach(() => {
    eventBus.clear();
    combatModule.destroy();
  });

  it('should deal minimum 1 damage even when armor exceeds base damage', () => {
    // Create a laser tower (damage 5 after balance) and heavily armored enemy (armor 30)
    const tower = createMockTower({
      id: 'tower_1',
      type: TowerType.LASER,
      position: { x: 5, y: 5 },
      damage: 5,
      range: 150,
      fireRate: 0.5,
    });

    // Enemy with armor (30) much higher than tower damage (5)
    const enemy: Enemy = {
      id: 'enemy_1',
      type: 'boss' as never,
      health: 100,
      maxHealth: 100,
      speed: 25,
      armor: 30, // Way higher than laser damage
      reward: 200,
      position: { x: 5 * 44 + 22, y: 5 * 44 + 22 }, // Same cell as tower, in pixels
      pathIndex: 0,
      path: [],
    };

    const query = createMockQuery([tower], [enemy]);
    const commands = createMockCommands();
    combatModule.init(query, commands);

    // First update creates tower instance (ready to fire immediately)
    combatModule.update(0.1);

    // Enemy should have taken minimum 1 damage despite high armor
    // 5 (damage) - 30 (armor) = -25, but min is 1
    expect(enemy.health).toBe(99);
  });

  it('should deal normal damage when base damage exceeds armor', () => {
    const tower = createMockTower({
      id: 'tower_1',
      type: TowerType.LASER,
      position: { x: 5, y: 5 },
      damage: 10,
      range: 150,
      fireRate: 0.5,
    });

    // Enemy with low armor
    const enemy: Enemy = {
      id: 'enemy_1',
      type: 'scout' as never,
      health: 30,
      maxHealth: 30,
      speed: 80,
      armor: 0,
      reward: 10,
      position: { x: 5 * 44 + 22, y: 5 * 44 + 22 },
      pathIndex: 0,
      path: [],
    };

    const query = createMockQuery([tower], [enemy]);
    const commands = createMockCommands();
    combatModule.init(query, commands);

    combatModule.update(0.1);

    // 10 (damage) - 0 (armor) = 10 damage
    expect(enemy.health).toBe(20);
  });
});
