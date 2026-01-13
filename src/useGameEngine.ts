import { useState, useEffect, useRef, useSyncExternalStore } from 'react';

const UI_UPDATE_INTERVAL = 1000 / 20; // 20fps for UI updates

export interface GameState {
  version: number; // Incremented on each state change
}

const initialState: GameState = {
  version: 0,
};

// Game engine singleton (will be populated by Game.tsx)
let gameState: GameState = initialState;
const subscribers = new Set<() => void>();

export function getGameState(): GameState {
  return gameState;
}

export function setGameState(newState: GameState) {
  gameState = newState;
  subscribers.forEach((cb) => cb());
}

export function subscribeToGameState(callback: () => void): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

export function useGameEngine() {
  const lastUpdateRef = useRef<number>(0);
  const cachedStateRef = useRef<GameState>(gameState);

  // Use useSyncExternalStore for proper subscription
  const currentState = useSyncExternalStore(subscribeToGameState, getGameState);

  // Throttle updates to 20fps
  const [throttledState, setThrottledState] = useState<GameState>(currentState);

  useEffect(() => {
    let rafId: number;

    const checkForUpdates = () => {
      const now = performance.now();
      if (
        now - lastUpdateRef.current >= UI_UPDATE_INTERVAL &&
        cachedStateRef.current !== gameState
      ) {
        cachedStateRef.current = gameState;
        setThrottledState(gameState);
        lastUpdateRef.current = now;
      }
      rafId = requestAnimationFrame(checkForUpdates);
    };

    rafId = requestAnimationFrame(checkForUpdates);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  return throttledState;
}
