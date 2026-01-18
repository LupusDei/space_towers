import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TowerStoreScreen from './TowerStoreScreen';
import { TowerType } from '../game/types';
import { TOWER_STATS } from '../game/config';

// Mock useUserProgress hook
const mockSetLastLoadout = vi.fn();
const mockSpendWaveCredits = vi.fn().mockReturnValue(true);
const mockUnlockTower = vi.fn().mockReturnValue(true);

let mockProgress = {
  waveCredits: 100,
  unlockedTowers: [] as TowerType[],
  highestWaveCompleted: 5,
  lastSelectedLoadout: null as TowerType[] | null,
};

vi.mock('../hooks/useUserProgress', () => ({
  useUserProgress: () => ({
    progress: mockProgress,
    actions: {
      setLastLoadout: mockSetLastLoadout,
      spendWaveCredits: mockSpendWaveCredits,
      unlockTower: mockUnlockTower,
      addWaveCredits: vi.fn(),
      setHighestWave: vi.fn(),
      resetProgress: vi.fn(),
    },
    isLoaded: true,
  }),
}));

// Mock TowerCard to simplify testing
vi.mock('./TowerCard', () => ({
  default: ({
    type,
    locked,
    selected,
    disabled,
    onClick,
    onUnlock,
  }: {
    type: TowerType;
    locked?: boolean;
    selected?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    onUnlock?: () => void;
  }) => (
    <div
      data-testid={`tower-card-${type}`}
      data-locked={locked}
      data-selected={selected}
      data-disabled={disabled}
      onClick={onClick}
    >
      {TOWER_STATS[type].name}
      {locked && onUnlock && (
        <button data-testid={`unlock-${type}`} onClick={onUnlock}>
          Unlock
        </button>
      )}
    </div>
  ),
}));

describe('TowerStoreScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProgress = {
      waveCredits: 100,
      unlockedTowers: [],
      highestWaveCompleted: 5,
      lastSelectedLoadout: null,
    };
  });

  describe('rendering', () => {
    it('should render the title', () => {
      render(<TowerStoreScreen onConfirm={vi.fn()} />);
      expect(screen.getByText('Tower Selection')).toBeInTheDocument();
    });

    it('should show wave credits', () => {
      render(<TowerStoreScreen onConfirm={vi.fn()} />);
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should show selection status', () => {
      render(<TowerStoreScreen onConfirm={vi.fn()} />);
      expect(screen.getByText('0 / 4 towers selected')).toBeInTheDocument();
    });

    it('should render all tower cards', () => {
      render(<TowerStoreScreen onConfirm={vi.fn()} />);

      // Default unlocked towers should be shown
      expect(screen.getByTestId('tower-card-laser')).toBeInTheDocument();
      expect(screen.getByTestId('tower-card-missile')).toBeInTheDocument();
      expect(screen.getByTestId('tower-card-tesla')).toBeInTheDocument();
      expect(screen.getByTestId('tower-card-cannon')).toBeInTheDocument();
    });

    it('should show Start Game button', () => {
      render(<TowerStoreScreen onConfirm={vi.fn()} />);
      expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument();
    });

    it('should show Back button when onBack is provided', () => {
      render(<TowerStoreScreen onConfirm={vi.fn()} onBack={vi.fn()} />);
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('should not show Back button when onBack is not provided', () => {
      render(<TowerStoreScreen onConfirm={vi.fn()} />);
      expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
    });
  });

  describe('tower selection', () => {
    it('should allow selecting unlocked towers', () => {
      render(<TowerStoreScreen onConfirm={vi.fn()} />);

      const laserCard = screen.getByTestId('tower-card-laser');
      fireEvent.click(laserCard);

      expect(screen.getByText('1 / 4 towers selected')).toBeInTheDocument();
    });

    it('should allow selecting up to 4 towers', () => {
      render(<TowerStoreScreen onConfirm={vi.fn()} />);

      fireEvent.click(screen.getByTestId('tower-card-laser'));
      fireEvent.click(screen.getByTestId('tower-card-missile'));
      fireEvent.click(screen.getByTestId('tower-card-tesla'));
      fireEvent.click(screen.getByTestId('tower-card-cannon'));

      expect(screen.getByText('4 / 4 towers selected')).toBeInTheDocument();
    });

    it('should allow deselecting towers', () => {
      render(<TowerStoreScreen onConfirm={vi.fn()} />);

      const laserCard = screen.getByTestId('tower-card-laser');
      fireEvent.click(laserCard); // Select
      expect(screen.getByText('1 / 4 towers selected')).toBeInTheDocument();

      fireEvent.click(laserCard); // Deselect
      expect(screen.getByText('0 / 4 towers selected')).toBeInTheDocument();
    });
  });

  describe('confirm button', () => {
    it('should be disabled when less than 4 towers selected', () => {
      render(<TowerStoreScreen onConfirm={vi.fn()} />);

      const confirmButton = screen.getByRole('button', { name: /start game/i });
      expect(confirmButton).toBeDisabled();
    });

    it('should be enabled when exactly 4 towers selected', () => {
      render(<TowerStoreScreen onConfirm={vi.fn()} />);

      fireEvent.click(screen.getByTestId('tower-card-laser'));
      fireEvent.click(screen.getByTestId('tower-card-missile'));
      fireEvent.click(screen.getByTestId('tower-card-tesla'));
      fireEvent.click(screen.getByTestId('tower-card-cannon'));

      const confirmButton = screen.getByRole('button', { name: /start game/i });
      expect(confirmButton).not.toBeDisabled();
    });

    it('should call onConfirm with selected towers when clicked', () => {
      const onConfirm = vi.fn();
      render(<TowerStoreScreen onConfirm={onConfirm} />);

      fireEvent.click(screen.getByTestId('tower-card-laser'));
      fireEvent.click(screen.getByTestId('tower-card-missile'));
      fireEvent.click(screen.getByTestId('tower-card-tesla'));
      fireEvent.click(screen.getByTestId('tower-card-cannon'));

      fireEvent.click(screen.getByRole('button', { name: /start game/i }));

      expect(onConfirm).toHaveBeenCalledWith([
        TowerType.LASER,
        TowerType.MISSILE,
        TowerType.TESLA,
        TowerType.CANNON,
      ]);
    });

    it('should save loadout to progress when confirmed', () => {
      render(<TowerStoreScreen onConfirm={vi.fn()} />);

      fireEvent.click(screen.getByTestId('tower-card-laser'));
      fireEvent.click(screen.getByTestId('tower-card-missile'));
      fireEvent.click(screen.getByTestId('tower-card-tesla'));
      fireEvent.click(screen.getByTestId('tower-card-cannon'));

      fireEvent.click(screen.getByRole('button', { name: /start game/i }));

      expect(mockSetLastLoadout).toHaveBeenCalledWith([
        TowerType.LASER,
        TowerType.MISSILE,
        TowerType.TESLA,
        TowerType.CANNON,
      ]);
    });
  });

  describe('last loadout persistence', () => {
    it('should pre-select towers from lastSelectedLoadout', () => {
      mockProgress.lastSelectedLoadout = [TowerType.LASER, TowerType.MISSILE];

      render(<TowerStoreScreen onConfirm={vi.fn()} />);

      // Check that the selection count reflects pre-selected towers
      expect(screen.getByText('2 / 4 towers selected')).toBeInTheDocument();
    });

    it('should filter out invalid towers from lastSelectedLoadout', () => {
      // Include a tower that's not unlocked
      mockProgress.lastSelectedLoadout = [TowerType.LASER, TowerType.SNIPER];

      render(<TowerStoreScreen onConfirm={vi.fn()} />);

      // Only LASER should be pre-selected (SNIPER is not unlocked by default)
      expect(screen.getByText('1 / 4 towers selected')).toBeInTheDocument();
    });

    it('should include unlocked towers from lastSelectedLoadout', () => {
      mockProgress.unlockedTowers = [TowerType.SNIPER];
      mockProgress.lastSelectedLoadout = [TowerType.LASER, TowerType.SNIPER];

      render(<TowerStoreScreen onConfirm={vi.fn()} />);

      // Both should be pre-selected
      expect(screen.getByText('2 / 4 towers selected')).toBeInTheDocument();
    });
  });

  describe('back button', () => {
    it('should call onBack when clicked', () => {
      const onBack = vi.fn();
      render(<TowerStoreScreen onConfirm={vi.fn()} onBack={onBack} />);

      fireEvent.click(screen.getByRole('button', { name: /back/i }));

      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('tower unlocking', () => {
    it('should show unlock button for locked towers', () => {
      render(<TowerStoreScreen onConfirm={vi.fn()} />);

      // SNIPER is not in DEFAULT_UNLOCKED_TOWERS and not in mockProgress.unlockedTowers
      const unlockButton = screen.getByTestId('unlock-sniper');
      expect(unlockButton).toBeInTheDocument();
    });

    it('should call unlock actions when unlock button clicked', () => {
      mockProgress.waveCredits = 100;
      render(<TowerStoreScreen onConfirm={vi.fn()} />);

      const unlockButton = screen.getByTestId('unlock-sniper');
      fireEvent.click(unlockButton);

      expect(mockSpendWaveCredits).toHaveBeenCalledWith(TOWER_STATS[TowerType.SNIPER].unlockCost);
      expect(mockUnlockTower).toHaveBeenCalledWith(TowerType.SNIPER);
    });
  });
});
