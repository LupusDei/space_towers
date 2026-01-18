import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LoadoutScreen from './LoadoutScreen';
import { TowerType } from '../game/types';

// Mock TowerStore to simplify testing
vi.mock('./TowerStore', () => ({
  default: ({
    credits,
    selectedTowerType,
    onSelectTowerType,
  }: {
    credits: number;
    selectedTowerType: TowerType | null;
    onSelectTowerType: (type: TowerType | null) => void;
  }) => (
    <div data-testid="tower-store">
      <span data-testid="tower-store-credits">{credits}</span>
      <span data-testid="tower-store-selected">{selectedTowerType ?? 'none'}</span>
      <button onClick={() => onSelectTowerType(TowerType.LASER)}>Select Laser</button>
    </div>
  ),
}));

describe('LoadoutScreen', () => {
  const mockOnSelectTowerType = vi.fn();
  const mockOnStartGame = vi.fn();

  beforeEach(() => {
    mockOnSelectTowerType.mockClear();
    mockOnStartGame.mockClear();
  });

  describe('rendering', () => {
    it('should render the title', () => {
      render(
        <LoadoutScreen
          credits={500}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
          onStartGame={mockOnStartGame}
        />
      );

      expect(screen.getByText('Tower Loadout')).toBeInTheDocument();
    });

    it('should render the subtitle', () => {
      render(
        <LoadoutScreen
          credits={500}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
          onStartGame={mockOnStartGame}
        />
      );

      expect(screen.getByText('Select towers for battle')).toBeInTheDocument();
    });

    it('should render the TowerStore', () => {
      render(
        <LoadoutScreen
          credits={500}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
          onStartGame={mockOnStartGame}
        />
      );

      expect(screen.getByTestId('tower-store')).toBeInTheDocument();
    });

    it('should render the Start Game button', () => {
      render(
        <LoadoutScreen
          credits={500}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
          onStartGame={mockOnStartGame}
        />
      );

      expect(screen.getByRole('button', { name: /Start Game/i })).toBeInTheDocument();
    });
  });

  describe('TowerStore integration', () => {
    it('should pass credits to TowerStore', () => {
      render(
        <LoadoutScreen
          credits={750}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
          onStartGame={mockOnStartGame}
        />
      );

      expect(screen.getByTestId('tower-store-credits')).toHaveTextContent('750');
    });

    it('should pass selectedTowerType to TowerStore', () => {
      render(
        <LoadoutScreen
          credits={500}
          selectedTowerType={TowerType.MISSILE}
          onSelectTowerType={mockOnSelectTowerType}
          onStartGame={mockOnStartGame}
        />
      );

      expect(screen.getByTestId('tower-store-selected')).toHaveTextContent('missile');
    });

    it('should call onSelectTowerType when tower is selected in TowerStore', () => {
      render(
        <LoadoutScreen
          credits={500}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
          onStartGame={mockOnStartGame}
        />
      );

      fireEvent.click(screen.getByText('Select Laser'));

      expect(mockOnSelectTowerType).toHaveBeenCalledWith(TowerType.LASER);
    });
  });

  describe('Start Game button', () => {
    it('should call onStartGame when clicked', () => {
      render(
        <LoadoutScreen
          credits={500}
          selectedTowerType={null}
          onSelectTowerType={mockOnSelectTowerType}
          onStartGame={mockOnStartGame}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Start Game/i }));

      expect(mockOnStartGame).toHaveBeenCalledTimes(1);
    });
  });
});
