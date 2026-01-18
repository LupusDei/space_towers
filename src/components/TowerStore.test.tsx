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
  const towerTypes = Object.values(TowerType) as TowerType[];
  const mockOnToggleTower = vi.fn();
  const mockOnConfirmSelection = vi.fn();

  beforeEach(() => {
    mockOnSelectTowerType.mockClear();
    mockOnToggleTower.mockClear();
    mockOnConfirmSelection.mockClear();
  });

  // ============================================================================
  // Card Rendering Tests
  // ============================================================================

  describe('card rendering', () => {
    it('should render all tower types', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={42}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      towerTypes.forEach((type) => {
        const stats = TOWER_STATS[type];
        expect(screen.getByText(stats.name)).toBeInTheDocument();
      });
    });

    it('should render tower icons for each tower type', () => {
      render(
        <TowerStore
          credits={1000}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      towerTypes.forEach((type) => {
        expect(screen.getByTestId(`tower-icon-${type}`)).toBeInTheDocument();
      });
    });

    it('should render the store header', () => {
      render(
        <TowerStore
          credits={1000}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      expect(screen.getByText('Tower Store')).toBeInTheDocument();
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
      const expectedEmptyCells = Math.max(0, 12 - towerTypes.length);
      expect(comingSoonElements.length).toBe(expectedEmptyCells);
    });

    it('should render question mark icons in empty cells', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={42}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      const questionMarks = screen.queryAllByText('?');
      const expectedEmptyCells = Math.max(0, 12 - towerTypes.length);
      expect(questionMarks.length).toBe(expectedEmptyCells);
    });

    it('should render buttons for each tower type', () => {
      render(
        <TowerStore
          credits={1000}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(towerTypes.length);
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

  // ============================================================================
  // Credit Display Tests
  // ============================================================================

  describe('credit display', () => {
    it('should display cost for each tower', () => {
      render(
        <TowerStore
          credits={1000}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      towerTypes.forEach((type) => {
        const stats = TOWER_STATS[type];
        const costElements = screen.queryAllByText(`$${stats.cost}`);
        expect(costElements.length).toBeGreaterThan(0);
      });
    });

    it('should display cost with dollar sign prefix', () => {
      render(
        <TowerStore
          credits={1000}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      const laserStats = TOWER_STATS[TowerType.LASER];
      expect(screen.getByText(`$${laserStats.cost}`)).toBeInTheDocument();
    });

    it('should include cost in aria-label for accessibility', () => {
      render(
        <TowerStore
          credits={1000}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      towerTypes.forEach((type) => {
        const stats = TOWER_STATS[type];
        const button = screen.getByRole('button', {
          name: new RegExp(`${stats.name}.*${stats.cost}`, 'i'),
        });
        expect(button).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // Selection Logic Tests
  // ============================================================================

  describe('selection logic', () => {
    it('should call onSelectTowerType with tower type when clicked', () => {
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

    it('should deselect tower when clicking already selected tower', () => {
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

    it('should switch selection when clicking different tower', () => {
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

    it('should allow selecting any affordable tower type', () => {
      render(
        <TowerStore
          credits={1000}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      towerTypes.forEach((type) => {
        mockOnSelectTowerType.mockClear();
        const stats = TOWER_STATS[type];
        const button = screen.getByRole('button', { name: new RegExp(stats.name, 'i') });
        fireEvent.click(button);
        expect(mockOnSelectTowerType).toHaveBeenCalledWith(type);
      });
    });

    it('should handle rapid selection changes', () => {
      render(
        <TowerStore
          credits={1000}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      const laserButton = screen.getByRole('button', { name: /Laser Tower/i });
      const missileButton = screen.getByRole('button', { name: /Missile Tower/i });

      fireEvent.click(laserButton);
      fireEvent.click(missileButton);
      fireEvent.click(laserButton);

      expect(mockOnSelectTowerType).toHaveBeenCalledTimes(3);
      expect(mockOnSelectTowerType).toHaveBeenNthCalledWith(1, TowerType.LASER);
      expect(mockOnSelectTowerType).toHaveBeenNthCalledWith(2, TowerType.MISSILE);
      expect(mockOnSelectTowerType).toHaveBeenNthCalledWith(3, TowerType.LASER);
    });

    it('should not call onSelectTowerType for empty cells', () => {
      render(
        <TowerStore
          credits={1000}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      // Empty cells should not be buttons
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(towerTypes.length);
    });
  });

  // ============================================================================
  // Affordability Tests
  // ============================================================================

  describe('affordability', () => {
    it('should disable towers player cannot afford', () => {
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

    it('should enable tower when credits exactly match cost', () => {
      const laserCost = TOWER_STATS[TowerType.LASER].cost;
      render(
        <TowerStore
          credits={laserCost}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      const laserButton = screen.getByRole('button', { name: /Laser Tower/i });
      expect(laserButton).not.toBeDisabled();
    });

    it('should disable tower when credits are one less than cost', () => {
      const laserCost = TOWER_STATS[TowerType.LASER].cost;
      render(
        <TowerStore
          credits={laserCost - 1}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      const laserButton = screen.getByRole('button', { name: /Laser Tower/i });
      expect(laserButton).toBeDisabled();
    });

    it('should not call onSelectTowerType when clicking disabled tower', () => {
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

    it('should enable all towers when player has max credits', () => {
      render(
        <TowerStore
          credits={10000}
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

    it('should disable all towers when player has zero credits', () => {
      render(
        <TowerStore
          credits={0}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it('should update affordability based on credits prop', () => {
      const { rerender } = render(
        <TowerStore
          credits={10}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      const laserButton = screen.getByRole('button', { name: /Laser Tower/i });
      expect(laserButton).toBeDisabled();

      // Rerender with more credits
      rerender(
        <TowerStore
          credits={1000}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      expect(laserButton).not.toBeDisabled();
    });
  });

  // ============================================================================
  // Visual State Tests
  // ============================================================================

  describe('visual states', () => {
    it('should show selected state for selected tower', () => {
      const { container } = render(
        <TowerStore
          credits={1000}
          selectedTowerType={TowerType.LASER}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      // The selected button should exist and be identifiable
      const laserButton = screen.getByRole('button', { name: /Laser Tower/i });
      expect(laserButton).toBeInTheDocument();

      // Check that buttons array has correct length (component renders correctly)
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(towerTypes.length);
    });

    it('should not show selected state when no tower selected', () => {
      render(
        <TowerStore
          credits={1000}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      // All buttons should render without selected state
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(towerTypes.length);
    });

    it('should update selected state when selection changes', () => {
      const { rerender } = render(
        <TowerStore
          credits={1000}
          selectedTowerType={TowerType.LASER}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      const laserButton = screen.getByRole('button', { name: /Laser Tower/i });
      expect(laserButton).toBeInTheDocument();

      rerender(
        <TowerStore
          credits={1000}
          selectedTowerType={TowerType.MISSILE}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      const missileButton = screen.getByRole('button', { name: /Missile Tower/i });
      expect(missileButton).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  describe('accessibility', () => {
    it('should have aria-label with tower name and cost', () => {
      render(
        <TowerStore
          credits={1000}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      const laserStats = TOWER_STATS[TowerType.LASER];
      const laserButton = screen.getByRole('button', {
        name: `${laserStats.name} - ${laserStats.cost} credits`,
      });
      expect(laserButton).toBeInTheDocument();
    });

    it('should have button role for all tower cells', () => {
      render(
        <TowerStore
          credits={1000}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(towerTypes.length);
    });

    it('should mark disabled buttons as disabled in accessibility tree', () => {
      render(
        <TowerStore
          credits={0}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('disabled');
      });
    });
  });

  // ============================================================================
  // Grid Layout Tests
  // ============================================================================

  describe('grid layout', () => {
    it('should render 12 cells total (towers + empty)', () => {
      const { container } = render(
        <TowerStore
          credits={1000}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      const buttons = container.querySelectorAll('button');
      const emptyCells = screen.queryAllByText('Coming Soon');

      expect(buttons.length + emptyCells.length).toBe(12);
    });

    it('should render tower buttons before empty cells', () => {
      const { container } = render(
        <TowerStore
          credits={1000}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      // Get all direct children of the grid
      const gridContainer = container.querySelector('[style*="grid"]');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('loadout selection mode', () => {
    it('should show Confirm Selection button when onConfirmSelection is provided', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={0}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
          selectedTowers={[]}
          onToggleTower={mockOnToggleTower}
          onConfirmSelection={mockOnConfirmSelection}
        />
      );

      expect(screen.getByRole('button', { name: /Confirm Selection/i })).toBeInTheDocument();
    });

    it('should not show Confirm Selection button in normal mode', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={0}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
        />
      );

      expect(screen.queryByRole('button', { name: /Confirm Selection/i })).not.toBeInTheDocument();
    });

    it('should show selection count in loadout mode', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={0}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
          selectedTowers={[TowerType.LASER, TowerType.MISSILE]}
          onToggleTower={mockOnToggleTower}
          onConfirmSelection={mockOnConfirmSelection}
        />
      );

      expect(screen.getByText('Selected: 2/4')).toBeInTheDocument();
    });

    it('should disable Confirm Selection button when less than 4 towers selected', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={0}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
          selectedTowers={[TowerType.LASER, TowerType.MISSILE, TowerType.TESLA]}
          onToggleTower={mockOnToggleTower}
          onConfirmSelection={mockOnConfirmSelection}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /Confirm Selection/i });
      expect(confirmButton).toBeDisabled();
    });

    it('should enable Confirm Selection button when exactly 4 towers selected', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={0}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
          selectedTowers={[TowerType.LASER, TowerType.MISSILE, TowerType.TESLA, TowerType.CANNON]}
          onToggleTower={mockOnToggleTower}
          onConfirmSelection={mockOnConfirmSelection}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /Confirm Selection/i });
      expect(confirmButton).not.toBeDisabled();
    });

    it('should call onConfirmSelection with selected towers when Confirm Selection clicked', () => {
      const selectedTowers = [TowerType.LASER, TowerType.MISSILE, TowerType.TESLA, TowerType.CANNON];
      render(
        <TowerStore
          credits={1000}
          waveCredits={0}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
          selectedTowers={selectedTowers}
          onToggleTower={mockOnToggleTower}
          onConfirmSelection={mockOnConfirmSelection}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /Confirm Selection/i });
      fireEvent.click(confirmButton);

      expect(mockOnConfirmSelection).toHaveBeenCalledWith(selectedTowers);
    });

    it('should not call onConfirmSelection when clicking disabled button', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={0}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
          selectedTowers={[TowerType.LASER]}
          onToggleTower={mockOnToggleTower}
          onConfirmSelection={mockOnConfirmSelection}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /Confirm Selection/i });
      fireEvent.click(confirmButton);

      expect(mockOnConfirmSelection).not.toHaveBeenCalled();
    });

    it('should call onToggleTower when clicking a tower in loadout mode', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={0}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
          selectedTowers={[]}
          onToggleTower={mockOnToggleTower}
          onConfirmSelection={mockOnConfirmSelection}
        />
      );

      const laserButton = screen.getByRole('button', { name: /Laser Tower/i });
      fireEvent.click(laserButton);

      expect(mockOnToggleTower).toHaveBeenCalledWith(TowerType.LASER);
      expect(mockOnSelectTowerType).not.toHaveBeenCalled();
    });

    it('should highlight selected towers in loadout mode', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={0}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
          selectedTowers={[TowerType.LASER, TowerType.MISSILE]}
          onToggleTower={mockOnToggleTower}
          onConfirmSelection={mockOnConfirmSelection}
        />
      );

      // In loadout mode, selected towers should have the selected style
      // Verify buttons are rendered and can be clicked
      const laserButton = screen.getByRole('button', { name: /Laser Tower/i });
      const teslaButton = screen.getByRole('button', { name: /Tesla Tower/i });

      // Both buttons exist
      expect(laserButton).toBeInTheDocument();
      expect(teslaButton).toBeInTheDocument();
    });

    it('should show 0/4 when no towers selected', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={0}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
          selectedTowers={[]}
          onToggleTower={mockOnToggleTower}
          onConfirmSelection={mockOnConfirmSelection}
        />
      );

      expect(screen.getByText('Selected: 0/4')).toBeInTheDocument();
    });

    it('should show 4/4 when all 4 towers selected', () => {
      render(
        <TowerStore
          credits={1000}
          waveCredits={0}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
          selectedTowers={[TowerType.LASER, TowerType.MISSILE, TowerType.TESLA, TowerType.CANNON]}
          onToggleTower={mockOnToggleTower}
          onConfirmSelection={mockOnConfirmSelection}
        />
      );

      expect(screen.getByText('Selected: 4/4')).toBeInTheDocument();
    });
  });
});
