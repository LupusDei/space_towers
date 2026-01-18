import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TowerCard from './TowerCard';
import { TowerType } from '../game/types';
import { TOWER_STATS, COMBAT_CONFIG } from '../game/config';

// Mock TowerIcon to avoid canvas rendering issues in tests
vi.mock('./TowerIcon', () => ({
  default: ({ type, size }: { type: string; size: number }) => (
    <div data-testid="tower-icon" data-type={type} data-size={size}>
      Tower Icon
    </div>
  ),
}));

describe('TowerCard', () => {
  describe('rendering', () => {
    it('should render tower name', () => {
      render(<TowerCard type={TowerType.LASER} />);
      expect(screen.getByText('Laser Tower')).toBeInTheDocument();
    });

    it('should render tower icon', () => {
      render(<TowerCard type={TowerType.LASER} />);
      const icon = screen.getByTestId('tower-icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('data-type', TowerType.LASER);
    });

    it('should render damage stat', () => {
      render(<TowerCard type={TowerType.LASER} />);
      const stats = TOWER_STATS[TowerType.LASER];
      expect(screen.getByText(`${stats.damage} dmg`)).toBeInTheDocument();
    });

    it('should render range stat', () => {
      render(<TowerCard type={TowerType.LASER} />);
      const stats = TOWER_STATS[TowerType.LASER];
      expect(screen.getByText(`${stats.range} rng`)).toBeInTheDocument();
    });

    it('should render fire rate stat', () => {
      render(<TowerCard type={TowerType.LASER} />);
      const stats = TOWER_STATS[TowerType.LASER];
      expect(screen.getByText(`${stats.fireRate}s`)).toBeInTheDocument();
    });

    it('should render DPS', () => {
      render(<TowerCard type={TowerType.LASER} />);
      const stats = TOWER_STATS[TowerType.LASER];
      const dps = (stats.damage / stats.fireRate).toFixed(0);
      expect(screen.getByText(`${dps} DPS`)).toBeInTheDocument();
    });

    it('should render cost', () => {
      render(<TowerCard type={TowerType.LASER} />);
      const stats = TOWER_STATS[TowerType.LASER];
      expect(screen.getByText(`$${stats.cost}`)).toBeInTheDocument();
    });
  });

  describe('special effects', () => {
    it('should show Hitscan for laser tower', () => {
      render(<TowerCard type={TowerType.LASER} />);
      expect(screen.getByText('Hitscan')).toBeInTheDocument();
    });

    it('should show Splash for missile tower', () => {
      render(<TowerCard type={TowerType.MISSILE} />);
      expect(screen.getByText(`Splash ${COMBAT_CONFIG.MISSILE_SPLASH_RADIUS}`)).toBeInTheDocument();
    });

    it('should show Chain for tesla tower', () => {
      render(<TowerCard type={TowerType.TESLA} />);
      expect(screen.getByText(`Chain ×${COMBAT_CONFIG.TESLA_MAX_CHAIN}`)).toBeInTheDocument();
    });

    it('should not show special effect for cannon tower', () => {
      render(<TowerCard type={TowerType.CANNON} />);
      expect(screen.queryByText('Hitscan')).not.toBeInTheDocument();
      expect(screen.queryByText(/Splash/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Chain/)).not.toBeInTheDocument();
    });
  });

  describe('all tower types', () => {
    const towerTypes = Object.values(TowerType) as TowerType[];

    towerTypes.forEach((type) => {
      it(`should render ${type} tower correctly`, () => {
        render(<TowerCard type={type} />);
        const stats = TOWER_STATS[type];
        expect(screen.getByText(stats.name)).toBeInTheDocument();
        expect(screen.getByText(`$${stats.cost}`)).toBeInTheDocument();
      });
    });
  });

  describe('locked state', () => {
    it('should show lock overlay when locked without onUnlock', () => {
      render(<TowerCard type={TowerType.LASER} locked />);
      expect(screen.getByText('🔒')).toBeInTheDocument();
    });

    it('should not show lock overlay when not locked', () => {
      render(<TowerCard type={TowerType.LASER} />);
      expect(screen.queryByText('🔒')).not.toBeInTheDocument();
    });

    it('should not be interactive when locked', () => {
      const onClick = vi.fn();
      render(<TowerCard type={TowerType.LASER} locked onClick={onClick} />);

      const card = screen.getByText('Laser Tower').closest('div');
      fireEvent.click(card!);

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('unlock button', () => {
    // Use SNIPER tower which has unlockCost of 10
    const lockedTowerType = TowerType.SNIPER;
    const unlockCost = TOWER_STATS[lockedTowerType].unlockCost;

    it('should show unlock button when locked and onUnlock provided', () => {
      const onUnlock = vi.fn();
      render(
        <TowerCard
          type={lockedTowerType}
          locked
          onUnlock={onUnlock}
          waveCredits={unlockCost}
        />
      );

      expect(screen.getByRole('button', { name: /unlock/i })).toBeInTheDocument();
      expect(screen.getByText('🔓')).toBeInTheDocument();
      expect(screen.getByText(unlockCost.toString())).toBeInTheDocument();
    });

    it('should not show unlock button when not locked', () => {
      const onUnlock = vi.fn();
      render(
        <TowerCard
          type={lockedTowerType}
          locked={false}
          onUnlock={onUnlock}
          waveCredits={unlockCost}
        />
      );

      expect(screen.queryByText('🔓')).not.toBeInTheDocument();
    });

    it('should not show unlock button when locked but no onUnlock callback', () => {
      render(<TowerCard type={lockedTowerType} locked waveCredits={unlockCost} />);

      expect(screen.queryByText('🔓')).not.toBeInTheDocument();
      // Should show lock icon instead
      expect(screen.getByText('🔒')).toBeInTheDocument();
    });

    it('should call onUnlock when clicked with enough credits', () => {
      const onUnlock = vi.fn();
      render(
        <TowerCard
          type={lockedTowerType}
          locked
          onUnlock={onUnlock}
          waveCredits={unlockCost}
        />
      );

      const unlockButton = screen.getByRole('button', { name: /unlock/i });
      fireEvent.click(unlockButton);

      expect(onUnlock).toHaveBeenCalledTimes(1);
    });

    it('should call onUnlock when credits exceed unlock cost', () => {
      const onUnlock = vi.fn();
      render(
        <TowerCard
          type={lockedTowerType}
          locked
          onUnlock={onUnlock}
          waveCredits={unlockCost + 100}
        />
      );

      const unlockButton = screen.getByRole('button', { name: /unlock/i });
      fireEvent.click(unlockButton);

      expect(onUnlock).toHaveBeenCalledTimes(1);
    });

    it('should not call onUnlock when clicked without enough credits', () => {
      const onUnlock = vi.fn();
      render(
        <TowerCard
          type={lockedTowerType}
          locked
          onUnlock={onUnlock}
          waveCredits={unlockCost - 1}
        />
      );

      const unlockButton = screen.getByRole('button', { name: /unlock/i });
      fireEvent.click(unlockButton);

      expect(onUnlock).not.toHaveBeenCalled();
    });

    it('should disable button when insufficient credits', () => {
      const onUnlock = vi.fn();
      render(
        <TowerCard
          type={lockedTowerType}
          locked
          onUnlock={onUnlock}
          waveCredits={0}
        />
      );

      const unlockButton = screen.getByRole('button', { name: /unlock/i });
      expect(unlockButton).toBeDisabled();
    });

    it('should enable button when sufficient credits', () => {
      const onUnlock = vi.fn();
      render(
        <TowerCard
          type={lockedTowerType}
          locked
          onUnlock={onUnlock}
          waveCredits={unlockCost}
        />
      );

      const unlockButton = screen.getByRole('button', { name: /unlock/i });
      expect(unlockButton).not.toBeDisabled();
    });

    it('should not propagate click to card onClick', () => {
      const onClick = vi.fn();
      const onUnlock = vi.fn();
      render(
        <TowerCard
          type={lockedTowerType}
          locked
          onClick={onClick}
          onUnlock={onUnlock}
          waveCredits={unlockCost}
        />
      );

      const unlockButton = screen.getByRole('button', { name: /unlock/i });
      fireEvent.click(unlockButton);

      expect(onUnlock).toHaveBeenCalledTimes(1);
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('selected state', () => {
    it('should be selectable when not locked', () => {
      const onClick = vi.fn();
      render(<TowerCard type={TowerType.LASER} onClick={onClick} />);

      const card = screen.getByText('Laser Tower').closest('div');
      fireEvent.click(card!);

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('disabled state', () => {
    it('should not be interactive when disabled', () => {
      const onClick = vi.fn();
      render(<TowerCard type={TowerType.LASER} disabled onClick={onClick} />);

      const card = screen.getByText('Laser Tower').closest('div');
      fireEvent.click(card!);

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('keyboard interaction', () => {
    it('should trigger onClick on Enter key', () => {
      const onClick = vi.fn();
      render(<TowerCard type={TowerType.LASER} onClick={onClick} />);

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Enter' });

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should trigger onClick on Space key', () => {
      const onClick = vi.fn();
      render(<TowerCard type={TowerType.LASER} onClick={onClick} />);

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: ' ' });

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not trigger onClick on other keys', () => {
      const onClick = vi.fn();
      render(<TowerCard type={TowerType.LASER} onClick={onClick} />);

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'a' });

      expect(onClick).not.toHaveBeenCalled();
    });
  });
});
