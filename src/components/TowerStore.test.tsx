import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TowerStore from './TowerStore';
import { TowerType } from '../game/types';
import { TOWER_STATS } from '../game/config';

// Mock TowerIcon to avoid canvas rendering issues in tests
vi.mock('./TowerIcon', () => ({
  default: ({ type }: { type: TowerType }) => (
    <div data-testid={`tower-icon-${type}`}>{type}</div>
  ),
}));

describe('TowerStore', () => {
  const mockOnToggleTowerType = vi.fn();

  beforeEach(() => {
    mockOnToggleTowerType.mockClear();
  });

  describe('rendering', () => {
    it('should render all tower types', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={42}
          selectedTowerTypes={[]}
          onToggleTowerType={mockOnToggleTowerType}
        />
      );

      const towerTypes = Object.values(TowerType);
      towerTypes.forEach((type) => {
        const stats = TOWER_STATS[type];
        expect(screen.getByText(stats.name)).toBeInTheDocument();
        // Use queryAllByText since multiple towers may have the same cost
        const costElements = screen.queryAllByText(`$${stats.cost}`);
        expect(costElements.length).toBeGreaterThan(0);
      });
    });

    it('should render empty cells for future towers', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={42}
          selectedTowerTypes={[]}
          onToggleTowerType={mockOnToggleTowerType}
        />
      );

      const comingSoonElements = screen.queryAllByText('Coming Soon');
      const towerTypes = Object.values(TowerType);
      expect(comingSoonElements.length).toBe(Math.max(0, 12 - towerTypes.length));
    });

    it('should render the header', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={42}
          selectedTowerTypes={[]}
          onToggleTowerType={mockOnToggleTowerType}
        />
      );

      expect(screen.getByText('Tower Store')).toBeInTheDocument();
    });

    it('should display Wave Credits balance', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={42}
          selectedTowerTypes={[]}
          onToggleTowerType={mockOnToggleTowerType}
        />
      );

      expect(screen.getByText('Wave Credits: 42')).toBeInTheDocument();
    });

    it('should display selection counter', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={42}
          selectedTowerTypes={[TowerType.LASER, TowerType.MISSILE]}
          onToggleTowerType={mockOnToggleTowerType}
        />
      );

      expect(screen.getByText('Selected: 2/4')).toBeInTheDocument();
    });

    it('should display zero selections', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={42}
          selectedTowerTypes={[]}
          onToggleTowerType={mockOnToggleTowerType}
        />
      );

      expect(screen.getByText('Selected: 0/4')).toBeInTheDocument();
    });

    it('should display max selections', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={42}
          selectedTowerTypes={[TowerType.LASER, TowerType.MISSILE, TowerType.TESLA, TowerType.CANNON]}
          onToggleTowerType={mockOnToggleTowerType}
        />
      );

      expect(screen.getByText('Selected: 4/4')).toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('should call onToggleTowerType when a tower is clicked', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={42}
          selectedTowerTypes={[]}
          onToggleTowerType={mockOnToggleTowerType}
        />
      );

      const laserButton = screen.getByRole('button', { name: /Laser Tower/i });
      fireEvent.click(laserButton);

      expect(mockOnToggleTowerType).toHaveBeenCalledWith(TowerType.LASER);
    });

    it('should call onToggleTowerType to deselect when clicking a selected tower', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={42}
          selectedTowerTypes={[TowerType.LASER]}
          onToggleTowerType={mockOnToggleTowerType}
        />
      );

      const laserButton = screen.getByRole('button', { name: /Laser Tower.*selected/i });
      fireEvent.click(laserButton);

      expect(mockOnToggleTowerType).toHaveBeenCalledWith(TowerType.LASER);
    });

    it('should allow selecting multiple towers', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={42}
          selectedTowerTypes={[TowerType.LASER]}
          onToggleTowerType={mockOnToggleTowerType}
        />
      );

      const missileButton = screen.getByRole('button', { name: /Missile Tower/i });
      fireEvent.click(missileButton);

      expect(mockOnToggleTowerType).toHaveBeenCalledWith(TowerType.MISSILE);
    });

    it('should disable unselected towers when max 4 are selected', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={42}
          selectedTowerTypes={[TowerType.LASER, TowerType.MISSILE, TowerType.TESLA, TowerType.CANNON]}
          onToggleTowerType={mockOnToggleTowerType}
        />
      );

      // Sniper is not selected, should be disabled
      const sniperButton = screen.getByRole('button', { name: /Sniper Tower/i });
      expect(sniperButton).toBeDisabled();
    });

    it('should keep selected towers enabled when max 4 are selected', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={42}
          selectedTowerTypes={[TowerType.LASER, TowerType.MISSILE, TowerType.TESLA, TowerType.CANNON]}
          onToggleTowerType={mockOnToggleTowerType}
        />
      );

      // Laser is selected, should still be enabled for deselection
      const laserButton = screen.getByRole('button', { name: /Laser Tower.*selected/i });
      expect(laserButton).not.toBeDisabled();
    });

    it('should not call onToggleTowerType when clicking a disabled unselected tower at max', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={42}
          selectedTowerTypes={[TowerType.LASER, TowerType.MISSILE, TowerType.TESLA, TowerType.CANNON]}
          onToggleTowerType={mockOnToggleTowerType}
        />
      );

      const sniperButton = screen.getByRole('button', { name: /Sniper Tower/i });
      fireEvent.click(sniperButton);

      expect(mockOnToggleTowerType).not.toHaveBeenCalled();
    });

    it('should allow deselecting a tower when at max selections', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={42}
          selectedTowerTypes={[TowerType.LASER, TowerType.MISSILE, TowerType.TESLA, TowerType.CANNON]}
          onToggleTowerType={mockOnToggleTowerType}
        />
      );

      const laserButton = screen.getByRole('button', { name: /Laser Tower.*selected/i });
      fireEvent.click(laserButton);

      expect(mockOnToggleTowerType).toHaveBeenCalledWith(TowerType.LASER);
    });
  });

  describe('affordability', () => {
    it('should disable towers the player cannot afford', () => {
      render(
        <TowerStore
          credits={30}
          waveCredits={0}
          selectedTowerTypes={[]}
          onToggleTowerType={mockOnToggleTowerType}
        />
      );

      // Laser costs 25, should be enabled
      const laserButton = screen.getByRole('button', { name: /Laser Tower/i });
      expect(laserButton).not.toBeDisabled();

      // Missile costs 50, should be disabled
      const missileButton = screen.getByRole('button', { name: /Missile Tower/i });
      expect(missileButton).toBeDisabled();
    });

    it('should not call onToggleTowerType when clicking a disabled tower', () => {
      render(
        <TowerStore
          credits={10}
          waveCredits={0}
          selectedTowerTypes={[]}
          onToggleTowerType={mockOnToggleTowerType}
        />
      );

      const laserButton = screen.getByRole('button', { name: /Laser Tower/i });
      fireEvent.click(laserButton);

      expect(mockOnToggleTowerType).not.toHaveBeenCalled();
    });

    it('should enable all towers when player has enough credits and not at max selection', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={0}
          selectedTowerTypes={[]}
          onToggleTowerType={mockOnToggleTowerType}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('visual feedback', () => {
    it('should show visual selection state for selected towers', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={42}
          selectedTowerTypes={[TowerType.LASER]}
          onToggleTowerType={mockOnToggleTowerType}
        />
      );

      const laserButton = screen.getByRole('button', { name: /Laser Tower.*selected/i });
      expect(laserButton).toBeInTheDocument();
    });

    it('should not show selection state for unselected towers', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={42}
          selectedTowerTypes={[TowerType.LASER]}
          onToggleTowerType={mockOnToggleTowerType}
        />
      );

      // Missile is not selected, so its aria-label should not include "selected"
      const missileButton = screen.getByRole('button', { name: /Missile Tower - \d+ credits$/i });
      expect(missileButton).toBeInTheDocument();
    });
  });
});
