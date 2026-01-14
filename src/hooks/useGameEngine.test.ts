// useGameEngine Hook Tests
// Tests for the refactored hook using Query/Command interfaces

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameEngine } from './useGameEngine';
import type {
  QueryInterface,
  CommandInterface,
  SubscribableInterface,
  GameState,
  Tower,
} from '../game/types';
import { TowerType, GamePhase } from '../game/types';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: GamePhase.PLANNING,
    wave: 1,
    lives: 20,
    credits: 200,
    score: 0,
    towers: new Map(),
    enemies: new Map(),
    projectiles: new Map(),
    grid: [],
    path: [],
    selectedTower: null,
    selectedTowerType: null,
    isPaused: false,
    ...overrides,
  };
}

function createMockQuery(overrides: Partial<QueryInterface> = {}): QueryInterface {
  return {
    getTowers: () => [],
    getEnemies: () => [],
    getProjectiles: () => [],
    getTowerById: () => undefined,
    getEnemyById: () => undefined,
    getEnemiesInRange: () => [],
    getEnemiesAlongPath: () => [],
    getPath: () => [],
    getCell: () => 'empty' as const,
    getTowerAt: () => undefined,
    getGameState: () => createMockGameState(),
    canPlaceTower: () => true,
    getCredits: () => 200,
    ...overrides,
  };
}

function createMockCommands(overrides: Partial<CommandInterface> = {}): CommandInterface {
  return {
    addProjectile: vi.fn(),
    removeEnemy: vi.fn(),
    addCredits: vi.fn(),
    getTime: () => 0,
    spendCredits: vi.fn(() => true),
    addTower: vi.fn(),
    removeTower: vi.fn(() => undefined),
    startWave: vi.fn(),
    setSelectedTower: vi.fn(),
    setSelectedTowerType: vi.fn(),
    startGame: vi.fn(),
    ...overrides,
  };
}

function createMockSubscribable(
  state: GameState = createMockGameState()
): SubscribableInterface & { notifySubscribers: () => void } {
  const subscribers = new Set<() => void>();
  return {
    getSnapshot: () => state,
    subscribe: (callback: () => void) => {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },
    notifySubscribers: () => {
      subscribers.forEach((cb) => cb());
    },
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('useGameEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with state from subscribable interface', () => {
      const mockState = createMockGameState({ credits: 500, wave: 3 });
      const subscribable = createMockSubscribable(mockState);

      const { result } = renderHook(() =>
        useGameEngine({
          query: createMockQuery(),
          commands: createMockCommands(),
          subscribable,
        })
      );

      expect(result.current.state.credits).toBe(500);
      expect(result.current.state.wave).toBe(3);
    });

    it('should provide all game actions', () => {
      const { result } = renderHook(() =>
        useGameEngine({
          query: createMockQuery(),
          commands: createMockCommands(),
          subscribable: createMockSubscribable(),
        })
      );

      expect(result.current.actions.placeTower).toBeDefined();
      expect(result.current.actions.sellTower).toBeDefined();
      expect(result.current.actions.engage).toBeDefined();
      expect(result.current.actions.selectTower).toBeDefined();
      expect(result.current.actions.selectTowerType).toBeDefined();
      expect(result.current.actions.startGame).toBeDefined();
    });
  });

  describe('actions', () => {
    describe('placeTower', () => {
      it('should use query.canPlaceTower to validate position', () => {
        const canPlaceTower = vi.fn(() => false);
        const query = createMockQuery({ canPlaceTower });
        const commands = createMockCommands();

        const { result } = renderHook(() =>
          useGameEngine({
            query,
            commands,
            subscribable: createMockSubscribable(),
          })
        );

        const success = result.current.actions.placeTower({ x: 5, y: 5 }, TowerType.LASER);

        expect(canPlaceTower).toHaveBeenCalledWith({ x: 5, y: 5 });
        expect(success).toBe(false);
        expect(commands.addTower).not.toHaveBeenCalled();
      });

      it('should use query.getCredits to check affordability', () => {
        const getCredits = vi.fn(() => 10); // Not enough for any tower
        const query = createMockQuery({ getCredits, canPlaceTower: () => true });
        const commands = createMockCommands();

        const { result } = renderHook(() =>
          useGameEngine({
            query,
            commands,
            subscribable: createMockSubscribable(),
          })
        );

        const success = result.current.actions.placeTower({ x: 5, y: 5 }, TowerType.LASER);

        expect(getCredits).toHaveBeenCalled();
        expect(success).toBe(false);
        expect(commands.spendCredits).not.toHaveBeenCalled();
      });

      it('should use commands.spendCredits and commands.addTower on success', () => {
        const query = createMockQuery({
          canPlaceTower: () => true,
          getCredits: () => 500,
        });
        const commands = createMockCommands();

        const { result } = renderHook(() =>
          useGameEngine({
            query,
            commands,
            subscribable: createMockSubscribable(),
          })
        );

        const success = result.current.actions.placeTower({ x: 5, y: 5 }, TowerType.LASER);

        expect(success).toBe(true);
        expect(commands.spendCredits).toHaveBeenCalled();
        expect(commands.addTower).toHaveBeenCalled();
      });
    });

    describe('sellTower', () => {
      it('should use query.getTowerById to find the tower', () => {
        const getTowerById = vi.fn(() => undefined);
        const query = createMockQuery({ getTowerById });
        const commands = createMockCommands();

        const { result } = renderHook(() =>
          useGameEngine({
            query,
            commands,
            subscribable: createMockSubscribable(),
          })
        );

        const success = result.current.actions.sellTower('tower-1');

        expect(getTowerById).toHaveBeenCalledWith('tower-1');
        expect(success).toBe(false);
      });

      it('should use commands.removeTower and commands.addCredits on success', () => {
        const tower: Tower = {
          id: 'tower-1',
          type: TowerType.LASER,
          position: { x: 5, y: 5 },
          level: 1,
          damage: 10,
          range: 150,
          fireRate: 0.5,
          lastFired: 0,
          target: null,
        };
        const query = createMockQuery({ getTowerById: () => tower });
        const commands = createMockCommands();

        const { result } = renderHook(() =>
          useGameEngine({
            query,
            commands,
            subscribable: createMockSubscribable(),
          })
        );

        const success = result.current.actions.sellTower('tower-1');

        expect(success).toBe(true);
        expect(commands.removeTower).toHaveBeenCalledWith('tower-1');
        expect(commands.addCredits).toHaveBeenCalled();
      });
    });

    describe('engage', () => {
      it('should use commands.startWave', () => {
        const commands = createMockCommands();

        const { result } = renderHook(() =>
          useGameEngine({
            query: createMockQuery(),
            commands,
            subscribable: createMockSubscribable(),
          })
        );

        result.current.actions.engage();

        expect(commands.startWave).toHaveBeenCalled();
      });
    });

    describe('selectTower', () => {
      it('should use commands.setSelectedTower', () => {
        const commands = createMockCommands();

        const { result } = renderHook(() =>
          useGameEngine({
            query: createMockQuery(),
            commands,
            subscribable: createMockSubscribable(),
          })
        );

        result.current.actions.selectTower('tower-1');

        expect(commands.setSelectedTower).toHaveBeenCalledWith('tower-1');
      });
    });

    describe('selectTowerType', () => {
      it('should use commands.setSelectedTowerType', () => {
        const commands = createMockCommands();

        const { result } = renderHook(() =>
          useGameEngine({
            query: createMockQuery(),
            commands,
            subscribable: createMockSubscribable(),
          })
        );

        result.current.actions.selectTowerType(TowerType.MISSILE);

        expect(commands.setSelectedTowerType).toHaveBeenCalledWith(TowerType.MISSILE);
      });
    });

    describe('startGame', () => {
      it('should use commands.startGame', () => {
        const commands = createMockCommands();

        const { result } = renderHook(() =>
          useGameEngine({
            query: createMockQuery(),
            commands,
            subscribable: createMockSubscribable(),
          })
        );

        result.current.actions.startGame();

        expect(commands.startGame).toHaveBeenCalled();
      });
    });
  });

  describe('state subscription', () => {
    it('should update state when subscribable notifies', async () => {
      const initialState = createMockGameState({ credits: 100 });
      const updatedState = createMockGameState({ credits: 200 });
      let currentState = initialState;

      const subscribable = {
        getSnapshot: () => currentState,
        subscribe: (callback: () => void) => {
          // Simulate async notification
          setTimeout(() => {
            currentState = updatedState;
            callback();
          }, 10);
          return () => {};
        },
      };

      const { result } = renderHook(() =>
        useGameEngine({
          query: createMockQuery(),
          commands: createMockCommands(),
          subscribable,
        })
      );

      expect(result.current.state.credits).toBe(100);

      // Wait for subscription callback
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(result.current.state.credits).toBe(200);
    });
  });
});
