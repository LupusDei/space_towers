// SpriteRegistry Tests
// Tests that all tower and enemy sprites are properly registered

import { describe, it, expect } from 'vitest';
import { getTowerSprite, getEnemySprite } from './SpriteRegistry';
import { TowerType, EnemyType } from '../game/types';

// Import actual sprites to verify correct registration
import { LaserTurretSprite } from './towers/LaserTurretSprite';
import { MissileBatterySprite } from './towers/MissileBatterySprite';
import { TeslaCoilSprite } from './towers/TeslaCoilSprite';
import { PlasmaCannonSprite } from './towers/PlasmaCannonSprite';
import { GravityTowerSprite } from './towers/GravityTowerSprite';
import { SniperTowerSprite } from './towers/SniperTowerSprite';
import { NeedleTowerSprite } from './towers/NeedleTowerSprite';
import { StormTowerSprite } from './towers/StormTowerSprite';

describe('SpriteRegistry', () => {
  describe('getTowerSprite', () => {
    it('returns a sprite for every TowerType', () => {
      const towerTypes = Object.values(TowerType);

      for (const type of towerTypes) {
        const sprite = getTowerSprite(type);
        expect(sprite).toBeDefined();
        expect(sprite.draw).toBeDefined();
      }
    });

    it('returns LaserTurretSprite for LASER type', () => {
      expect(getTowerSprite(TowerType.LASER)).toBe(LaserTurretSprite);
    });

    it('returns MissileBatterySprite for MISSILE type', () => {
      expect(getTowerSprite(TowerType.MISSILE)).toBe(MissileBatterySprite);
    });

    it('returns TeslaCoilSprite for TESLA type', () => {
      expect(getTowerSprite(TowerType.TESLA)).toBe(TeslaCoilSprite);
    });

    it('returns PlasmaCannonSprite for CANNON type', () => {
      expect(getTowerSprite(TowerType.CANNON)).toBe(PlasmaCannonSprite);
    });

    it('returns GravityTowerSprite for GRAVITY type', () => {
      expect(getTowerSprite(TowerType.GRAVITY)).toBe(GravityTowerSprite);
    });

    it('returns SniperTowerSprite for SNIPER type', () => {
      expect(getTowerSprite(TowerType.SNIPER)).toBe(SniperTowerSprite);
    });

    it('returns NeedleTowerSprite for NEEDLE type', () => {
      expect(getTowerSprite(TowerType.NEEDLE)).toBe(NeedleTowerSprite);
    });

    it('returns StormTowerSprite for STORM type', () => {
      const sprite = getTowerSprite(TowerType.STORM);
      expect(sprite).toBe(StormTowerSprite);
      expect(sprite.draw).toBeDefined();
      expect(sprite.drawFiring).toBeDefined();
      expect(sprite.drawRange).toBeDefined();
    });
  });

  describe('getEnemySprite', () => {
    it('returns a sprite for every EnemyType', () => {
      const enemyTypes = Object.values(EnemyType);

      for (const type of enemyTypes) {
        const sprite = getEnemySprite(type);
        expect(sprite).toBeDefined();
        expect(sprite.draw).toBeDefined();
      }
    });
  });

  describe('sprite interface compliance', () => {
    it('all tower sprites have required draw method', () => {
      const towerTypes = Object.values(TowerType);

      for (const type of towerTypes) {
        const sprite = getTowerSprite(type);
        expect(typeof sprite.draw).toBe('function');
      }
    });

    it('all tower sprites have optional drawRange method', () => {
      const towerTypes = Object.values(TowerType);

      for (const type of towerTypes) {
        const sprite = getTowerSprite(type);
        // drawRange is optional but if present should be a function
        if (sprite.drawRange !== undefined) {
          expect(typeof sprite.drawRange).toBe('function');
        }
      }
    });

    it('all enemy sprites have required draw method', () => {
      const enemyTypes = Object.values(EnemyType);

      for (const type of enemyTypes) {
        const sprite = getEnemySprite(type);
        expect(typeof sprite.draw).toBe('function');
      }
    });
  });
});
