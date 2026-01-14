// useGameEngine - React hook for game engine integration
// Provides throttled state subscription and action dispatchers

import { useCallback, useEffect, useRef, useState } from 'react';
import engine from '../game/Engine';
import { TOWER_STATS, GAME_CONFIG } from '../game/config';
import type { GameState, Point, TowerType, Tower } from '../game/types';

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

export function useGameEngine(): UseGameEngineResult {
  const [state, setState] = useState<GameState>(() => engine.getSnapshot());
  const lastUpdateRef = useRef<number>(0);
  const pendingUpdateRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);

  // Throttled state update
  useEffect(() => {
    const handleUpdate = () => {
      const now = performance.now();
      const elapsed = now - lastUpdateRef.current;

      if (elapsed >= THROTTLE_MS) {
        setState(engine.getSnapshot());
        lastUpdateRef.current = now;
        pendingUpdateRef.current = false;
      } else if (!pendingUpdateRef.current) {
        pendingUpdateRef.current = true;
        const delay = THROTTLE_MS - elapsed;
        rafIdRef.current = window.setTimeout(() => {
          setState(engine.getSnapshot());
          lastUpdateRef.current = performance.now();
          pendingUpdateRef.current = false;
        }, delay);
      }
    };

    const unsubscribe = engine.subscribe(handleUpdate);

    return () => {
      unsubscribe();
      if (rafIdRef.current !== null) {
        window.clearTimeout(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  // Action: Place a tower
  const placeTower = useCallback((position: Point, type: TowerType): boolean => {
    // Check if position is valid
    if (!engine.canPlaceTower(position)) {
      return false;
    }

    // Get tower stats
    const stats = TOWER_STATS[type];
    if (!stats) {
      return false;
    }

    // Check if player has enough credits
    if (engine.getCredits() < stats.cost) {
      return false;
    }

    // Spend credits
    if (!engine.spendCredits(stats.cost)) {
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

    engine.addTower(tower);
    return true;
  }, []);

  // Action: Sell a tower
  const sellTower = useCallback((towerId: string): boolean => {
    const tower = engine.getTowerById(towerId);
    if (!tower) {
      return false;
    }

    // Calculate refund
    const stats = TOWER_STATS[tower.type];
    const refund = Math.floor(stats.cost * GAME_CONFIG.SELL_REFUND_PERCENT);

    // Remove tower and add refund
    engine.removeTower(towerId);
    engine.addCredits(refund);

    return true;
  }, []);

  // Action: Start wave (engage)
  const engage = useCallback(() => {
    engine.startWave();
  }, []);

  // Action: Select a tower
  const selectTower = useCallback((towerId: string | null) => {
    engine.setSelectedTower(towerId);
  }, []);

  // Action: Select a tower type for placement
  const selectTowerType = useCallback((type: TowerType | null) => {
    engine.setSelectedTowerType(type);
  }, []);

  // Action: Start the game
  const startGame = useCallback(() => {
    engine.startGame();
  }, []);

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
