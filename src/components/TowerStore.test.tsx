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
  const mockOnSelectTowerType = vi.fn();

  beforeEach(() => {
    mockOnSelectTowerType.mockClear();
  });

  describe('rendering', () => {
    it('should render all tower types', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={42}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
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
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
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
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      expect(screen.getByText('Tower Store')).toBeInTheDocument();
    });

    it('should display Wave Credits balance', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={42}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      expect(screen.getByText('Wave Credits: 42')).toBeInTheDocument();
    });

    it('should display zero Wave Credits', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={0}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      expect(screen.getByText('Wave Credits: 0')).toBeInTheDocument();
    });

    it('should update Wave Credits display reactively', () => {
      const { rerender } = render(
        <TowerStore
          credits={1000}
          waveCredits={50}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      expect(screen.getByText('Wave Credits: 50')).toBeInTheDocument();

      // Simulate spending credits by rerendering with new value
      rerender(
        <TowerStore
          credits={1000}
          waveCredits={40}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      expect(screen.getByText('Wave Credits: 40')).toBeInTheDocument();
      expect(screen.queryByText('Wave Credits: 50')).not.toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('should call onSelectTowerType when a tower is clicked', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={42}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      const laserButton = screen.getByRole('button', { name: /Laser Tower/i });
      fireEvent.click(laserButton);

      expect(mockOnSelectTowerType).toHaveBeenCalledWith(TowerType.LASER);
    });

    it('should deselect when clicking the same tower', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={42}
          selectedTowerType={TowerType.LASER}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      const laserButton = screen.getByRole('button', { name: /Laser Tower/i });
      fireEvent.click(laserButton);

      expect(mockOnSelectTowerType).toHaveBeenCalledWith(null);
    });

    it('should select a different tower when one is already selected', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={42}
          selectedTowerType={TowerType.LASER}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      const missileButton = screen.getByRole('button', { name: /Missile Tower/i });
      fireEvent.click(missileButton);

      expect(mockOnSelectTowerType).toHaveBeenCalledWith(TowerType.MISSILE);
    });
  });

  describe('affordability', () => {
    it('should disable towers the player cannot afford', () => {
      render(
        <TowerStore
          credits={30}
          waveCredits={0}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      // Laser costs 25, should be enabled
      const laserButton = screen.getByRole('button', { name: /Laser Tower/i });
      expect(laserButton).not.toBeDisabled();

      // Missile costs 50, should be disabled
      const missileButton = screen.getByRole('button', { name: /Missile Tower/i });
      expect(missileButton).toBeDisabled();
    });

    it('should not call onSelectTowerType when clicking a disabled tower', () => {
      render(
        <TowerStore
          credits={10}
          waveCredits={0}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      const laserButton = screen.getByRole('button', { name: /Laser Tower/i });
      fireEvent.click(laserButton);

      expect(mockOnSelectTowerType).not.toHaveBeenCalled();
    });

    it('should enable all towers when player has enough credits', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={0}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).not.toBeDisabled();
      });
    });
  });
});
