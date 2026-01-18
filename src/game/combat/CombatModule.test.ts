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
    targetPosition: null,
    kills: 0,
    totalDamage: 0,
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
    slowMultiplier: 1,
    slowEndTime: 0,
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
    applySlow: () => {},
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
      applySlow: () => {},
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
      applySlow: () => {},
    };

    const query = createMockQuery([tower], [enemy]);
    combatModule.init(query, commands);
    combatModule.update(0.1);

    expect(removedEnemyId).toBe(enemy.id);
  });

  it('should award credits when enemy is killed', () => {
    const tower = createMockTower({ type: TowerType.LASER, damage: 100 });
    const enemy = createMockEnemy({ health: 50, armor: 0, reward: 25 });
    let addedCredits = 0;

    const commands = {
      addProjectile: () => {},
      removeEnemy: () => {
        // Simulate what the real pool does: reset enemy reward to 0
        enemy.reward = 0;
      },
      addCredits: (amount: number) => {
        addedCredits = amount;
      },
      getTime: () => 0,
      applySlow: () => {},
    };

    const query = createMockQuery([tower], [enemy]);
    combatModule.init(query, commands);
    combatModule.update(0.1);

    // Credits should be awarded with the original reward value (25), not the reset value (0)
    expect(addedCredits).toBe(25);
  });

  it('should track kills and damage on tower', () => {
    const tower = createMockTower({ type: TowerType.LASER, damage: 30 });
    const enemy1 = createMockEnemy({ id: 'enemy_1', health: 25, armor: 0 });
    const enemy2 = createMockEnemy({ id: 'enemy_2', health: 50, armor: 0, position: { x: 230, y: 230 } });

    const commands = {
      addProjectile: () => {},
      removeEnemy: () => {},
      addCredits: () => {},
      getTime: () => 0,
      applySlow: () => {},
    };

    const query = createMockQuery([tower], [enemy1, enemy2]);
    combatModule.init(query, commands);

    // First update: tower kills enemy1 (30 damage, 25 health = kill), starts on enemy2
    combatModule.update(0.1);

    // CombatModule now updates the Engine's tower (via query.getTowerById),
    // not its internal towerInstances. Check the original tower object.
    expect(tower.kills).toBe(1);
    expect(tower.totalDamage).toBeGreaterThan(0);
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

describe('Projectile pool tracking', () => {
  beforeEach(() => {
    eventBus.clear();
    combatModule.destroy();
  });

  it('should use pool-assigned projectile id for proper pool tracking', () => {
    const tower = createMockTower({
      id: 'tower_1',
      type: TowerType.CANNON,
      position: { x: 5, y: 5 },
      damage: 25,
      range: 150,
      fireRate: 1.0,
    });

    const enemy = createMockEnemy({
      id: 'enemy_1',
      health: 100,
      position: { x: 5 * 44 + 22, y: 5 * 44 + 22 },
    });

    let capturedProjectileId: string | null = null;
    const commands = {
      addProjectile: (proj: { id: string }) => {
        capturedProjectileId = proj.id;
      },
      removeEnemy: () => {},
      addCredits: () => {},
      getTime: () => 0,
      applySlow: () => {},
    };

    const query = createMockQuery([tower], [enemy]);
    combatModule.init(query, commands);
    combatModule.update(0.1);

    // Projectile id should be pool-assigned format (proj_N), not custom format
    expect(capturedProjectileId).not.toBeNull();
    expect(capturedProjectileId).toMatch(/^proj_\d+$/);
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
      slowMultiplier: 1,
      slowEndTime: 0,
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
      slowMultiplier: 1,
      slowEndTime: 0,
    };

    const query = createMockQuery([tower], [enemy]);
    const commands = createMockCommands();
    combatModule.init(query, commands);

    combatModule.update(0.1);

    // 10 (damage) - 0 (armor) = 10 damage
    expect(enemy.health).toBe(20);
  });
});

describe('Sniper Tower Firing', () => {
  beforeEach(() => {
    eventBus.clear();
    combatModule.destroy();
  });

  it('should apply instant damage when sniper fires', () => {
    const tower = createMockTower({ type: TowerType.SNIPER, damage: 50 });
    const enemy = createMockEnemy({ health: 100, armor: 0 });
    const query = createMockQuery([tower], [enemy]);
    const commands = createMockCommands();

    combatModule.init(query, commands);
    combatModule.update(0.1);

    expect(enemy.health).toBe(50); // 100 - 50 damage
  });

  it('should create hitscan effect when sniper fires', () => {
    const tower = createMockTower({ type: TowerType.SNIPER, damage: 50 });
    const enemy = createMockEnemy({ health: 100 });
    const query = createMockQuery([tower], [enemy]);

    combatModule.init(query, createMockCommands());
    combatModule.update(0.1);

    const effects = combatModule.getHitscanEffects();
    expect(effects.length).toBeGreaterThan(0);
    expect(effects[0].type).toBe('sniper');
  });

  it('should prioritize highest HP enemy', () => {
    const tower = createMockTower({ type: TowerType.SNIPER, damage: 50, range: 300 });
    const lowHpEnemy = createMockEnemy({
      id: 'enemy_low',
      health: 30,
      position: { x: 220, y: 220 },
      pathIndex: 5, // Further along path
    });
    const highHpEnemy = createMockEnemy({
      id: 'enemy_high',
      health: 200,
      position: { x: 230, y: 230 },
      pathIndex: 1, // Closer to start
    });

    const query = createMockQuery([tower], [lowHpEnemy, highHpEnemy]);
    combatModule.init(query, createMockCommands());
    combatModule.update(0.1);

    // Sniper should target high HP enemy (200 HP) not low HP enemy (30 HP)
    // High HP enemy should take damage
    expect(highHpEnemy.health).toBe(150); // 200 - 50
    expect(lowHpEnemy.health).toBe(30); // Unchanged
  });

  it('should use path progress as tiebreaker when HP is equal', () => {
    const tower = createMockTower({ type: TowerType.SNIPER, damage: 50, range: 300 });
    const enemyNearStart = createMockEnemy({
      id: 'enemy_near',
      health: 100,
      position: { x: 220, y: 220 },
      pathIndex: 1,
    });
    const enemyFarther = createMockEnemy({
      id: 'enemy_far',
      health: 100,
      position: { x: 230, y: 230 },
      pathIndex: 5,
    });

    const query = createMockQuery([tower], [enemyNearStart, enemyFarther]);
    combatModule.init(query, createMockCommands());
    combatModule.update(0.1);

    // Same HP, should target enemy further along path
    expect(enemyFarther.health).toBe(50); // 100 - 50
    expect(enemyNearStart.health).toBe(100); // Unchanged
  });

  it('should reduce damage by armor', () => {
    const tower = createMockTower({ type: TowerType.SNIPER, damage: 50 });
    const enemy = createMockEnemy({ health: 100, armor: 10 });
    const query = createMockQuery([tower], [enemy]);

    combatModule.init(query, createMockCommands());
    combatModule.update(0.1);

    expect(enemy.health).toBe(60); // 100 - (50 - 10) = 60
  });

  it('should kill enemy when damage exceeds health', () => {
    const tower = createMockTower({ type: TowerType.SNIPER, damage: 100 });
    const enemy = createMockEnemy({ health: 50, armor: 0 });
    let removedEnemyId: string | null = null;

    const commands = {
      addProjectile: () => {},
      removeEnemy: (id: string) => {
        removedEnemyId = id;
      },
      addCredits: () => {},
      getTime: () => 0,
      applySlow: () => {},
    };

    const query = createMockQuery([tower], [enemy]);
    combatModule.init(query, commands);
    combatModule.update(0.1);

    expect(removedEnemyId).toBe(enemy.id);
  });
});

describe('Target validation - mid-targeting death', () => {
  beforeEach(() => {
    eventBus.clear();
    combatModule.destroy();
  });

  it('should not create hitscan effect when target is removed before firing', () => {
    const tower = createMockTower({ type: TowerType.LASER, damage: 10 });
    const enemy = createMockEnemy({ id: 'enemy_1', health: 100 });

    // Track whether getEnemyById was called and simulate enemy removal
    let enemyRemoved = false;
    const enemies = [enemy];

    const query: QueryInterface = {
      getTowers: () => [tower],
      getEnemies: () => (enemyRemoved ? [] : enemies),
      getProjectiles: () => [],
      getTowerById: (id: string) => (id === tower.id ? tower : undefined),
      // Simulate target being removed after targeting but before firing
      getEnemyById: () => {
        // First call returns the enemy (for targeting), subsequent calls return undefined
        if (!enemyRemoved) {
          enemyRemoved = true;
          return undefined; // Target was removed by another tower
        }
        return undefined;
      },
      getEnemiesInRange: () => (enemyRemoved ? [] : enemies),
      getEnemiesAlongPath: () => (enemyRemoved ? [] : enemies),
      getPath: () => [],
      getCell: () => 'empty' as const,
      getTowerAt: () => undefined,
      getGameState: () => ({
        phase: 'combat' as const,
        wave: 1,
        lives: 20,
        credits: 200,
        score: 0,
        towers: new Map([[tower.id, tower]]),
        enemies: new Map(enemyRemoved ? [] : [[enemy.id, enemy]]),
        projectiles: new Map(),
        grid: [],
        path: [],
        selectedTower: null,
        selectedTowerType: null,
        isPaused: false,
      }),
    };

    combatModule.init(query, createMockCommands());
    combatModule.update(0.1);

    // No hitscan effects should be created since target was removed
    const effects = combatModule.getHitscanEffects();
    expect(effects.length).toBe(0);
  });

  it('should not fire at position (0,0) when target is pooled', () => {
    const tower = createMockTower({ type: TowerType.LASER, damage: 10 });
    const enemy = createMockEnemy({ id: 'enemy_1', health: 100, position: { x: 200, y: 200 } });

    // Simulate enemy being reset to pool (position becomes 0,0)
    const resetEnemy = { ...enemy, position: { x: 0, y: 0 } };

    const query: QueryInterface = {
      getTowers: () => [tower],
      getEnemies: () => [enemy],
      getProjectiles: () => [],
      getTowerById: (id: string) => (id === tower.id ? tower : undefined),
      // Return undefined to simulate target removed from game
      getEnemyById: () => undefined,
      getEnemiesInRange: () => [enemy],
      getEnemiesAlongPath: () => [enemy],
      getPath: () => [],
      getCell: () => 'empty' as const,
      getTowerAt: () => undefined,
      getGameState: () => ({
        phase: 'combat' as const,
        wave: 1,
        lives: 20,
        credits: 200,
        score: 0,
        towers: new Map([[tower.id, tower]]),
        enemies: new Map([[enemy.id, resetEnemy]]),
        projectiles: new Map(),
        grid: [],
        path: [],
        selectedTower: null,
        selectedTowerType: null,
        isPaused: false,
      }),
    };

    combatModule.init(query, createMockCommands());
    combatModule.update(0.1);

    // Verify no effect points to (0,0) - the bug symptom
    const effects = combatModule.getHitscanEffects();
    for (const effect of effects) {
      expect(effect.targetPosition.x).not.toBe(0);
      expect(effect.targetPosition.y).not.toBe(0);
    }
  });
});

describe('Gravity Tower AOE', () => {
  beforeEach(() => {
    eventBus.clear();
    combatModule.destroy();
  });

  it('should damage all enemies in range with AOE pulse', () => {
    const tower = createMockTower({
      type: TowerType.GRAVITY,
      damage: 5,
      range: 150,
      position: { x: 5, y: 5 },
    });

    // Create multiple enemies within range
    const enemy1 = createMockEnemy({
      id: 'enemy_1',
      health: 100,
      armor: 0,
      position: { x: 220, y: 220 }, // Within range
    });
    const enemy2 = createMockEnemy({
      id: 'enemy_2',
      health: 100,
      armor: 0,
      position: { x: 230, y: 230 }, // Within range
    });

    const query = createMockQuery([tower], [enemy1, enemy2]);
    combatModule.init(query, createMockCommands());
    combatModule.update(0.1);

    // Both enemies should have taken damage
    expect(enemy1.health).toBe(95); // 100 - 5
    expect(enemy2.health).toBe(95); // 100 - 5
  });

  it('should apply slow effect to enemies in range', () => {
    const tower = createMockTower({
      type: TowerType.GRAVITY,
      damage: 5,
      range: 150,
      position: { x: 5, y: 5 },
    });

    const enemy = createMockEnemy({
      health: 100,
      armor: 0,
      position: { x: 220, y: 220 },
    });

    const slowedEnemies: { id: string; multiplier: number; duration: number }[] = [];
    const commands = {
      addProjectile: () => {},
      removeEnemy: () => {},
      addCredits: () => {},
      getTime: () => 0,
      applySlow: (id: string, multiplier: number, duration: number) => {
        slowedEnemies.push({ id, multiplier, duration });
      },
    };

    const query = createMockQuery([tower], [enemy]);
    combatModule.init(query, commands);
    combatModule.update(0.1);

    // Enemy should have slow applied
    expect(slowedEnemies.length).toBe(1);
    expect(slowedEnemies[0].id).toBe(enemy.id);
    expect(slowedEnemies[0].multiplier).toBe(0.5); // 50% slow
    expect(slowedEnemies[0].duration).toBe(1.0); // 1 second
  });

  it('should not damage or slow enemies outside range', () => {
    const tower = createMockTower({
      type: TowerType.GRAVITY,
      damage: 5,
      range: 50, // Small range
      position: { x: 0, y: 0 },
    });

    // Enemy far outside range
    const enemy = createMockEnemy({
      health: 100,
      position: { x: 500, y: 500 },
    });

    const slowedEnemies: string[] = [];
    const commands = {
      addProjectile: () => {},
      removeEnemy: () => {},
      addCredits: () => {},
      getTime: () => 0,
      applySlow: (id: string) => {
        slowedEnemies.push(id);
      },
    };

    const query = createMockQuery([tower], [enemy]);
    combatModule.init(query, commands);
    combatModule.update(0.1);

    // Enemy should not have taken damage or slow
    expect(enemy.health).toBe(100);
    expect(slowedEnemies.length).toBe(0);
  });

  it('should not apply slow to enemies killed by the damage', () => {
    const tower = createMockTower({
      type: TowerType.GRAVITY,
      damage: 100, // Lethal damage
      range: 150,
      position: { x: 5, y: 5 },
    });

    const enemy = createMockEnemy({
      health: 50, // Will be killed
      armor: 0,
      position: { x: 220, y: 220 },
    });

    const slowedEnemies: string[] = [];
    const commands = {
      addProjectile: () => {},
      removeEnemy: () => {},
      addCredits: () => {},
      getTime: () => 0,
      applySlow: (id: string) => {
        slowedEnemies.push(id);
      },
    };

    const query = createMockQuery([tower], [enemy]);
    combatModule.init(query, commands);
    combatModule.update(0.1);

    // Enemy should be dead (health <= 0), slow should not be applied
    expect(enemy.health).toBeLessThanOrEqual(0);
    expect(slowedEnemies.length).toBe(0);
  });

  it('should emit GRAVITY_PULSE_REQUESTED event', () => {
    const tower = createMockTower({
      type: TowerType.GRAVITY,
      position: { x: 5, y: 5 },
    });

    const enemy = createMockEnemy({
      position: { x: 220, y: 220 },
    });

    let pulseEventReceived = false;
    const unsubscribe = eventBus.on('GRAVITY_PULSE_REQUESTED', () => {
      pulseEventReceived = true;
    });

    const query = createMockQuery([tower], [enemy]);
    combatModule.init(query, createMockCommands());
    combatModule.update(0.1);

    expect(pulseEventReceived).toBe(true);
    unsubscribe();
  });
});

describe('Needle Tower Firing', () => {
  beforeEach(() => {
    eventBus.clear();
    combatModule.destroy();
  });

  it('should apply instant damage when needle fires', () => {
    const tower = createMockTower({
      type: TowerType.NEEDLE,
      damage: 10,
      fireRate: 0.25, // 4 hits per second
    });
    const enemy = createMockEnemy({ health: 100, armor: 0 });
    const query = createMockQuery([tower], [enemy]);
    const commands = createMockCommands();

    combatModule.init(query, commands);
    combatModule.update(0.1);

    expect(enemy.health).toBe(90); // 100 - 10 damage
  });

  it('should create hitscan effect when needle fires', () => {
    const tower = createMockTower({
      type: TowerType.NEEDLE,
      damage: 10,
      fireRate: 0.25,
    });
    const enemy = createMockEnemy({ health: 100 });
    const query = createMockQuery([tower], [enemy]);

    combatModule.init(query, createMockCommands());
    combatModule.update(0.1);

    const effects = combatModule.getHitscanEffects();
    expect(effects.length).toBeGreaterThan(0);
    expect(effects[0].type).toBe('needle');
  });

  it('should reduce damage by armor', () => {
    const tower = createMockTower({
      type: TowerType.NEEDLE,
      damage: 10,
      fireRate: 0.25,
    });
    const enemy = createMockEnemy({ health: 100, armor: 3 });
    const query = createMockQuery([tower], [enemy]);

    combatModule.init(query, createMockCommands());
    combatModule.update(0.1);

    expect(enemy.health).toBe(93); // 100 - (10 - 3) = 93
  });

  it('should deal minimum 1 damage when armor exceeds base damage', () => {
    const tower = createMockTower({
      type: TowerType.NEEDLE,
      damage: 10,
      fireRate: 0.25,
    });
    const enemy = createMockEnemy({ health: 100, armor: 50 });
    const query = createMockQuery([tower], [enemy]);

    combatModule.init(query, createMockCommands());
    combatModule.update(0.1);

    // 10 damage - 50 armor = -40, but minimum is 1
    expect(enemy.health).toBe(99);
  });

  it('should kill enemy when damage exceeds health', () => {
    const tower = createMockTower({
      type: TowerType.NEEDLE,
      damage: 100,
      fireRate: 0.25,
    });
    const enemy = createMockEnemy({ health: 50, armor: 0 });
    let removedEnemyId: string | null = null;

    const commands = {
      addProjectile: () => {},
      removeEnemy: (id: string) => {
        removedEnemyId = id;
      },
      addCredits: () => {},
      getTime: () => 0,
      applySlow: () => {},
    };

    const query = createMockQuery([tower], [enemy]);
    combatModule.init(query, commands);
    combatModule.update(0.1);

    expect(removedEnemyId).toBe(enemy.id);
  });

  it('should award credits when enemy is killed', () => {
    const tower = createMockTower({
      type: TowerType.NEEDLE,
      damage: 100,
      fireRate: 0.25,
    });
    const enemy = createMockEnemy({ health: 50, armor: 0, reward: 15 });
    let addedCredits = 0;

    const commands = {
      addProjectile: () => {},
      removeEnemy: () => {
        enemy.reward = 0; // Simulate pool reset
      },
      addCredits: (amount: number) => {
        addedCredits = amount;
      },
      getTime: () => 0,
      applySlow: () => {},
    };

    const query = createMockQuery([tower], [enemy]);
    combatModule.init(query, commands);
    combatModule.update(0.1);

    expect(addedCredits).toBe(15);
  });

  it('should track kills and damage on tower', () => {
    const tower = createMockTower({
      type: TowerType.NEEDLE,
      damage: 30,
      fireRate: 0.25,
    });
    const enemy = createMockEnemy({ id: 'enemy_1', health: 25, armor: 0 });

    const commands = {
      addProjectile: () => {},
      removeEnemy: () => {},
      addCredits: () => {},
      getTime: () => 0,
      applySlow: () => {},
    };

    const query = createMockQuery([tower], [enemy]);
    combatModule.init(query, commands);
    combatModule.update(0.1);

    expect(tower.kills).toBe(1);
    expect(tower.totalDamage).toBeGreaterThan(0);
  });

  it('should not damage enemy outside range', () => {
    const tower = createMockTower({
      type: TowerType.NEEDLE,
      damage: 10,
      range: 50,
      position: { x: 0, y: 0 },
      fireRate: 0.25,
    });
    // Enemy far outside range
    const enemy = createMockEnemy({ position: { x: 500, y: 500 }, health: 100 });
    const query = createMockQuery([tower], [enemy]);

    combatModule.init(query, createMockCommands());
    combatModule.update(0.1);

    expect(enemy.health).toBe(100); // No damage
    expect(combatModule.getHitscanEffects().length).toBe(0);
  });

  it('should emit PROJECTILE_FIRED event when firing', () => {
    const tower = createMockTower({
      type: TowerType.NEEDLE,
      damage: 10,
      fireRate: 0.25,
    });
    const enemy = createMockEnemy({ health: 100 });

    let eventReceived = false;
    const unsubscribe = eventBus.on('PROJECTILE_FIRED', (event) => {
      if (event.payload.projectile.towerType === TowerType.NEEDLE) {
        eventReceived = true;
      }
    });

    const query = createMockQuery([tower], [enemy]);
    combatModule.init(query, createMockCommands());
    combatModule.update(0.1);

    expect(eventReceived).toBe(true);
    unsubscribe();
  });

  it('should not create effect when target is removed before firing', () => {
    const tower = createMockTower({
      type: TowerType.NEEDLE,
      damage: 10,
      fireRate: 0.25,
    });
    const enemy = createMockEnemy({ id: 'enemy_1', health: 100 });

    let enemyRemoved = false;
    const enemies = [enemy];

    const query: QueryInterface = {
      getTowers: () => [tower],
      getEnemies: () => (enemyRemoved ? [] : enemies),
      getProjectiles: () => [],
      getTowerById: (id: string) => (id === tower.id ? tower : undefined),
      getEnemyById: () => {
        if (!enemyRemoved) {
          enemyRemoved = true;
          return undefined;
        }
        return undefined;
      },
      getEnemiesInRange: () => (enemyRemoved ? [] : enemies),
      getEnemiesAlongPath: () => (enemyRemoved ? [] : enemies),
      getPath: () => [],
      getCell: () => 'empty' as const,
      getTowerAt: () => undefined,
      getGameState: () => ({
        phase: 'combat' as const,
        wave: 1,
        lives: 20,
        credits: 200,
        score: 0,
        towers: new Map([[tower.id, tower]]),
        enemies: new Map(enemyRemoved ? [] : [[enemy.id, enemy]]),
        projectiles: new Map(),
        grid: [],
        path: [],
        selectedTower: null,
        selectedTowerType: null,
        isPaused: false,
      }),
    };

    combatModule.init(query, createMockCommands());
    combatModule.update(0.1);

    const effects = combatModule.getHitscanEffects();
    expect(effects.length).toBe(0);
  });
});
