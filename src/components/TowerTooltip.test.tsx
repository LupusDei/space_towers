import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TowerTooltip from './TowerTooltip';
import { TowerType } from '../game/types';
import { TOWER_STATS, COMBAT_CONFIG } from '../game/config';

describe('TowerTooltip', () => {
  const defaultPosition = { x: 100, y: 100 };

  describe('rendering basic info', () => {
    it('should render tower name', () => {
      render(<TowerTooltip type={TowerType.LASER} position={defaultPosition} />);
      expect(screen.getByText('Laser Tower')).toBeInTheDocument();
    });

    it('should render tower cost', () => {
      render(<TowerTooltip type={TowerType.LASER} position={defaultPosition} />);
      const stats = TOWER_STATS[TowerType.LASER];
      expect(screen.getByText(`$${stats.cost}`)).toBeInTheDocument();
    });

    it('should render tower description', () => {
      render(<TowerTooltip type={TowerType.LASER} position={defaultPosition} />);
      const stats = TOWER_STATS[TowerType.LASER];
      expect(screen.getByText(stats.description)).toBeInTheDocument();
    });
  });

  describe('rendering stats', () => {
    it('should render damage with per-level increase', () => {
      render(<TowerTooltip type={TowerType.LASER} position={defaultPosition} />);
      const stats = TOWER_STATS[TowerType.LASER];
      expect(screen.getByText('Damage')).toBeInTheDocument();
      // Check that damage per-level text exists
      expect(screen.getByText(`(+${stats.damagePerLevel}/lvl)`)).toBeInTheDocument();
    });

    it('should render DPS', () => {
      render(<TowerTooltip type={TowerType.LASER} position={defaultPosition} />);
      const stats = TOWER_STATS[TowerType.LASER];
      const dps = (stats.damage / stats.fireRate).toFixed(1);
      expect(screen.getByText('DPS')).toBeInTheDocument();
      expect(screen.getByText(dps)).toBeInTheDocument();
    });

    it('should render range with per-level increase', () => {
      render(<TowerTooltip type={TowerType.LASER} position={defaultPosition} />);
      const stats = TOWER_STATS[TowerType.LASER];
      expect(screen.getByText('Range')).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`${stats.range}`))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`\\+${stats.rangePerLevel}/lvl`))).toBeInTheDocument();
    });

    it('should render fire rate with per-level change', () => {
      render(<TowerTooltip type={TowerType.LASER} position={defaultPosition} />);
      const stats = TOWER_STATS[TowerType.LASER];
      expect(screen.getByText('Fire Rate')).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`${stats.fireRate}s`))).toBeInTheDocument();
    });
  });

  describe('rendering special abilities', () => {
    it('should show hitscan for laser tower', () => {
      render(<TowerTooltip type={TowerType.LASER} position={defaultPosition} />);
      expect(screen.getByText('Special')).toBeInTheDocument();
      expect(screen.getByText('Hitscan (instant hit)')).toBeInTheDocument();
    });

    it('should show splash info for missile tower', () => {
      render(<TowerTooltip type={TowerType.MISSILE} position={defaultPosition} />);
      const stats = TOWER_STATS[TowerType.MISSILE];
      expect(screen.getByText('Special')).toBeInTheDocument();
      expect(
        screen.getByText(`Splash: ${stats.splashRadius} cells (+${stats.splashRadiusPerLevel}/lvl)`)
      ).toBeInTheDocument();
    });

    it('should show chain info for tesla tower', () => {
      render(<TowerTooltip type={TowerType.TESLA} position={defaultPosition} />);
      const stats = TOWER_STATS[TowerType.TESLA];
      expect(screen.getByText('Special')).toBeInTheDocument();
      expect(
        screen.getByText(
          `Chain: ${stats.chainCount} targets (+${stats.chainCountPerLevel}/lvl), ${(COMBAT_CONFIG.CHAIN_DAMAGE_FALLOFF * 100).toFixed(0)}% falloff`
        )
      ).toBeInTheDocument();
    });

    it('should not show special section for cannon tower', () => {
      render(<TowerTooltip type={TowerType.CANNON} position={defaultPosition} />);
      expect(screen.queryByText('Special')).not.toBeInTheDocument();
    });

    it('should show slow info for gravity tower', () => {
      render(<TowerTooltip type={TowerType.GRAVITY} position={defaultPosition} />);
      expect(screen.getByText('Special')).toBeInTheDocument();
      expect(
        screen.getByText(
          `Slow: ${(COMBAT_CONFIG.GRAVITY_SLOW_MULTIPLIER * 100).toFixed(0)}% for ${COMBAT_CONFIG.GRAVITY_SLOW_DURATION}s`
        )
      ).toBeInTheDocument();
    });

    it('should show duration for storm tower', () => {
      render(<TowerTooltip type={TowerType.STORM} position={defaultPosition} />);
      const stats = TOWER_STATS[TowerType.STORM];
      expect(screen.getByText('Special')).toBeInTheDocument();
      expect(
        screen.getByText(`Duration: ${stats.stormDuration}s (+${stats.stormDurationPerLevel}s/lvl)`)
      ).toBeInTheDocument();
    });

    it('should show hitscan for sniper tower', () => {
      render(<TowerTooltip type={TowerType.SNIPER} position={defaultPosition} />);
      expect(screen.getByText('Special')).toBeInTheDocument();
      expect(screen.getByText('Hitscan (instant hit)')).toBeInTheDocument();
    });

    it('should show rapid-fire for needle tower', () => {
      render(<TowerTooltip type={TowerType.NEEDLE} position={defaultPosition} />);
      expect(screen.getByText('Special')).toBeInTheDocument();
      expect(screen.getByText('Rapid-fire')).toBeInTheDocument();
    });
  });

  describe('rendering upgrade info', () => {
    it('should render max level', () => {
      render(<TowerTooltip type={TowerType.LASER} position={defaultPosition} />);
      const stats = TOWER_STATS[TowerType.LASER];
      expect(screen.getByText(`Max Level: ${stats.maxLevel}`)).toBeInTheDocument();
    });

    it('should render upgrade costs', () => {
      render(<TowerTooltip type={TowerType.LASER} position={defaultPosition} />);
      const stats = TOWER_STATS[TowerType.LASER];
      const upgradeText = `Upgrades: ${stats.upgradeCosts.map((c) => `$${c}`).join(' → ')}`;
      expect(screen.getByText(upgradeText)).toBeInTheDocument();
    });
  });

  describe('all tower types', () => {
    const towerTypes = Object.values(TowerType) as TowerType[];

    towerTypes.forEach((type) => {
      it(`should render ${type} tower tooltip correctly`, () => {
        render(<TowerTooltip type={type} position={defaultPosition} />);
        const stats = TOWER_STATS[type];

        // Basic info
        expect(screen.getByText(stats.name)).toBeInTheDocument();
        expect(screen.getByText(`$${stats.cost}`)).toBeInTheDocument();
        expect(screen.getByText(stats.description)).toBeInTheDocument();

        // Stats
        expect(screen.getByText('Damage')).toBeInTheDocument();
        expect(screen.getByText('DPS')).toBeInTheDocument();
        expect(screen.getByText('Range')).toBeInTheDocument();
        expect(screen.getByText('Fire Rate')).toBeInTheDocument();

        // Upgrade info
        expect(screen.getByText(`Max Level: ${stats.maxLevel}`)).toBeInTheDocument();
      });
    });
  });

  describe('positioning', () => {
    it('should position tooltip at the specified coordinates', () => {
      const position = { x: 200, y: 300 };
      const { container } = render(<TowerTooltip type={TowerType.LASER} position={position} />);

      const tooltip = container.firstChild as HTMLElement;
      expect(tooltip.style.left).toBe('200px');
      expect(tooltip.style.top).toBe('300px');
    });
  });
});
