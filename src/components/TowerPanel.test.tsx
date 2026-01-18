import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TowerPanel from './TowerPanel';
import { TowerType } from '../game/types';
import { TOWER_STATS } from '../game/config';

// Mock TowerIcon to avoid canvas rendering issues in tests
vi.mock('./TowerIcon', () => ({
  default: ({ type }: { type: TowerType }) => (
    <div data-testid={`tower-icon-${type}`}>{type}</div>
  ),
}));

// Mock eventBus to avoid side effects
vi.mock('../game/events', () => ({
  eventBus: {
    on: vi.fn(() => vi.fn()),
  },
}));

describe('TowerPanel', () => {
  const mockOnSelectTowerType = vi.fn();
  const mockOnSellTower = vi.fn();

  beforeEach(() => {
    mockOnSelectTowerType.mockClear();
    mockOnSellTower.mockClear();
  });

  describe('rendering all towers', () => {
    it('should render all tower types when selectedTowers is not provided', () => {
      render(
        <TowerPanel
          credits={1000}
          selectedTowerType={null}
          selectedTower={null}
          onSelectTowerType={mockOnSelectTowerType}
          onSellTower={mockOnSellTower}
        />
      );

      const allTowerTypes = Object.values(TowerType) as TowerType[];
      allTowerTypes.forEach((type) => {
        const stats = TOWER_STATS[type];
        expect(screen.getByText(stats.name)).toBeInTheDocument();
      });
    });

    it('should render all tower types when selectedTowers is empty array', () => {
      render(
        <TowerPanel
          credits={1000}
          selectedTowerType={null}
          selectedTower={null}
          onSelectTowerType={mockOnSelectTowerType}
          onSellTower={mockOnSellTower}
          selectedTowers={[]}
        />
      );

      const allTowerTypes = Object.values(TowerType) as TowerType[];
      allTowerTypes.forEach((type) => {
        const stats = TOWER_STATS[type];
        expect(screen.getByText(stats.name)).toBeInTheDocument();
      });
    });
  });

  describe('filtering with selectedTowers', () => {
    it('should only render towers in the selectedTowers list', () => {
      const selectedTowers: TowerType[] = [TowerType.LASER, TowerType.MISSILE, TowerType.TESLA, TowerType.CANNON];

      render(
        <TowerPanel
          credits={1000}
          selectedTowerType={null}
          selectedTower={null}
          onSelectTowerType={mockOnSelectTowerType}
          onSellTower={mockOnSellTower}
          selectedTowers={selectedTowers}
        />
      );

      // Selected towers should be visible
      selectedTowers.forEach((type) => {
        const stats = TOWER_STATS[type];
        expect(screen.getByText(stats.name)).toBeInTheDocument();
      });

      // Non-selected towers should not be visible
      const allTowerTypes = Object.values(TowerType) as TowerType[];
      const nonSelectedTowers = allTowerTypes.filter((t) => !selectedTowers.includes(t));
      nonSelectedTowers.forEach((type) => {
        const stats = TOWER_STATS[type];
        expect(screen.queryByText(stats.name)).not.toBeInTheDocument();
      });
    });

    it('should render towers in the order specified by selectedTowers', () => {
      const selectedTowers = [TowerType.SNIPER, TowerType.LASER, TowerType.GRAVITY, TowerType.MISSILE];

      render(
        <TowerPanel
          credits={1000}
          selectedTowerType={null}
          selectedTower={null}
          onSelectTowerType={mockOnSelectTowerType}
          onSellTower={mockOnSellTower}
          selectedTowers={selectedTowers}
        />
      );

      // Get all tower buttons
      const buttons = screen.getAllByRole('button');

      // Verify order matches selectedTowers
      selectedTowers.forEach((type, index) => {
        const stats = TOWER_STATS[type];
        expect(buttons[index]).toHaveTextContent(stats.name);
      });
    });

    it('should work with a loadout of 4 towers', () => {
      const loadout = [TowerType.LASER, TowerType.MISSILE, TowerType.TESLA, TowerType.SNIPER];

      render(
        <TowerPanel
          credits={1000}
          selectedTowerType={null}
          selectedTower={null}
          onSelectTowerType={mockOnSelectTowerType}
          onSellTower={mockOnSellTower}
          selectedTowers={loadout}
        />
      );

      // Should have exactly 4 tower buttons
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(4);
    });
  });

  describe('tower selection', () => {
    it('should call onSelectTowerType when a tower is clicked', () => {
      render(
        <TowerPanel
          credits={1000}
          selectedTowerType={null}
          selectedTower={null}
          onSelectTowerType={mockOnSelectTowerType}
          onSellTower={mockOnSellTower}
          selectedTowers={[TowerType.LASER, TowerType.MISSILE]}
        />
      );

      const laserButton = screen.getByRole('button', { name: /Laser Tower/i });
      fireEvent.click(laserButton);

      expect(mockOnSelectTowerType).toHaveBeenCalledWith(TowerType.LASER);
    });

    it('should deselect when clicking the same tower', () => {
      render(
        <TowerPanel
          credits={1000}
          selectedTowerType={TowerType.LASER}
          selectedTower={null}
          onSelectTowerType={mockOnSelectTowerType}
          onSellTower={mockOnSellTower}
          selectedTowers={[TowerType.LASER, TowerType.MISSILE]}
        />
      );

      const laserButton = screen.getByRole('button', { name: /Laser Tower/i });
      fireEvent.click(laserButton);

      expect(mockOnSelectTowerType).toHaveBeenCalledWith(null);
    });
  });

  describe('affordability', () => {
    it('should disable towers the player cannot afford', () => {
      render(
        <TowerPanel
          credits={30}
          selectedTowerType={null}
          selectedTower={null}
          onSelectTowerType={mockOnSelectTowerType}
          onSellTower={mockOnSellTower}
          selectedTowers={[TowerType.LASER, TowerType.MISSILE]}
        />
      );

      // Laser costs 25, should be enabled
      const laserButton = screen.getByRole('button', { name: /Laser Tower/i });
      expect(laserButton).not.toBeDisabled();

      // Missile costs 50, should be disabled
      const missileButton = screen.getByRole('button', { name: /Missile Tower/i });
      expect(missileButton).toBeDisabled();
    });
  });

  describe('credits display', () => {
    it('should display credits', () => {
      render(
        <TowerPanel
          credits={500}
          selectedTowerType={null}
          selectedTower={null}
          onSelectTowerType={mockOnSelectTowerType}
          onSellTower={mockOnSellTower}
        />
      );

      expect(screen.getByText('$500')).toBeInTheDocument();
    });
  });
});
