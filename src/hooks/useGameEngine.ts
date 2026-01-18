// useGameEngine - React hook for game engine integration
// Provides throttled state subscription and action dispatchers

import { useCallback, useEffect, useRef, useState } from 'react';
import engine from '../game/Engine';
import type { GameState, Point, TowerType } from '../game/types';

const THROTTLE_MS = 50; // 50ms throttle for UI updates

export interface GameActions {
  placeTower: (position: Point, type: TowerType) => boolean;
  sellTower: (towerId: string) => boolean;
  upgradeTower: (towerId: string) => boolean;
  engage: () => void;
  selectTower: (towerId: string | null) => void;
  selectTowerType: (type: TowerType | null) => void;
  startGame: () => void;
  pause: () => void;
  resume: () => void;
  returnToStore: () => void;
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

  // Action: Place a tower (delegates to Engine.placeTower)
  const placeTower = useCallback((position: Point, type: TowerType): boolean => {
    return engine.placeTower(type, position) !== null;
  }, []);

  // Action: Sell a tower (delegates to Engine.sellTower)
  const sellTower = useCallback((towerId: string): boolean => {
    return engine.sellTower(towerId) > 0;
  }, []);

  // Action: Upgrade a tower (delegates to Engine.upgradeTower)
  const upgradeTower = useCallback((towerId: string): boolean => {
    // Check if engine has upgradeTower method (may not be implemented yet)
    const engineWithUpgrade = engine as unknown as { upgradeTower?: (id: string) => boolean };
    if (typeof engineWithUpgrade.upgradeTower === 'function') {
      return engineWithUpgrade.upgradeTower(towerId);
    }
    return false;
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

  // Action: Pause the game
  const pause = useCallback(() => {
    engine.pause();
  }, []);

  // Action: Resume the game
  const resume = useCallback(() => {
    engine.resume();
  }, []);

  // Action: Return to tower store from pause
  const returnToStore = useCallback(() => {
    engine.returnToStore();
  }, []);

  const actions: GameActions = {
    placeTower,
    sellTower,
    upgradeTower,
    engage,
    selectTower,
    selectTowerType,
    startGame,
    pause,
    resume,
    returnToStore,
  };

  return { state, actions };
}

export default useGameEngine;
