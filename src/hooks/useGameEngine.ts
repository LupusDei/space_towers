// useGameEngine - React hook for game engine integration
// Provides throttled state subscription and action dispatchers

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import engine from '../game/Engine';
import { TOWER_STATS, GAME_CONFIG } from '../game/config';
import type {
  GameState,
  Point,
  TowerType,
  Tower,
  QueryInterface,
  CommandInterface,
  SubscribableInterface,
} from '../game/types';

const THROTTLE_MS = 50; // 50ms throttle for UI updates

let nextTowerId = 1;

function generateTowerId(): string {
  return `tower-${nextTowerId++}`;
}

export interface GameActions {
  placeTower: (position: Point, type: TowerType) => boolean;
  sellTower: (towerId: string) => boolean;
  engage: () => void;
  selectTower: (towerId: string | null) => void;
  selectTowerType: (type: TowerType | null) => void;
  startGame: () => void;
}

export interface UseGameEngineResult {
  state: GameState;
  actions: GameActions;
}

export interface UseGameEngineOptions {
  query?: QueryInterface;
  commands?: CommandInterface;
  subscribable?: SubscribableInterface;
}

export function useGameEngine(options?: UseGameEngineOptions): UseGameEngineResult {
  // Get interfaces from options or use engine defaults
  const query = useMemo(
    () => options?.query ?? engine.getQueryInterface(),
    [options?.query]
  );
  const commands = useMemo(
    () => options?.commands ?? engine.getCommandInterface(),
    [options?.commands]
  );
  const subscribable = useMemo(
    () => options?.subscribable ?? engine.getSubscribableInterface(),
    [options?.subscribable]
  );

  const [state, setState] = useState<GameState>(() => subscribable.getSnapshot());
  const lastUpdateRef = useRef<number>(0);
  const pendingUpdateRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);

  // Throttled state update
  useEffect(() => {
    const handleUpdate = () => {
      const now = performance.now();
      const elapsed = now - lastUpdateRef.current;

      if (elapsed >= THROTTLE_MS) {
        setState(subscribable.getSnapshot());
        lastUpdateRef.current = now;
        pendingUpdateRef.current = false;
      } else if (!pendingUpdateRef.current) {
        pendingUpdateRef.current = true;
        const delay = THROTTLE_MS - elapsed;
        rafIdRef.current = window.setTimeout(() => {
          setState(subscribable.getSnapshot());
          lastUpdateRef.current = performance.now();
          pendingUpdateRef.current = false;
        }, delay);
      }
    };

    const unsubscribe = subscribable.subscribe(handleUpdate);

    return () => {
      unsubscribe();
      if (rafIdRef.current !== null) {
        window.clearTimeout(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [subscribable]);

  // Action: Place a tower
  const placeTower = useCallback((position: Point, type: TowerType): boolean => {
    // Check if position is valid
    if (!query.canPlaceTower(position)) {
      return false;
    }

    // Get tower stats
    const stats = TOWER_STATS[type];
    if (!stats) {
      return false;
    }

    // Check if player has enough credits
    if (query.getCredits() < stats.cost) {
      return false;
    }

    // Spend credits
    if (!commands.spendCredits(stats.cost)) {
      return false;
    }

    // Create tower
    const tower: Tower = {
      id: generateTowerId(),
      type,
      position,
      level: 1,
      damage: stats.damage,
      range: stats.range,
      fireRate: stats.fireRate,
      lastFired: 0,
      target: null,
    };

    commands.addTower(tower);
    return true;
  }, [query, commands]);

  // Action: Sell a tower
  const sellTower = useCallback((towerId: string): boolean => {
    const tower = query.getTowerById(towerId);
    if (!tower) {
      return false;
    }

    // Calculate refund
    const stats = TOWER_STATS[tower.type];
    const refund = Math.floor(stats.cost * GAME_CONFIG.SELL_REFUND_PERCENT);

    // Remove tower and add refund
    commands.removeTower(towerId);
    commands.addCredits(refund);

    return true;
  }, [query, commands]);

  // Action: Start wave (engage)
  const engage = useCallback(() => {
    commands.startWave();
  }, [commands]);

  // Action: Select a tower
  const selectTower = useCallback((towerId: string | null) => {
    commands.setSelectedTower(towerId);
  }, [commands]);

  // Action: Select a tower type for placement
  const selectTowerType = useCallback((type: TowerType | null) => {
    commands.setSelectedTowerType(type);
  }, [commands]);

  // Action: Start the game
  const startGame = useCallback(() => {
    commands.startGame();
  }, [commands]);

  const actions: GameActions = {
    placeTower,
    sellTower,
    engage,
    selectTower,
    selectTowerType,
    startGame,
  };

  return { state, actions };
}

export default useGameEngine;
