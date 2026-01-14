// Event Bus for Space Towers
// Simple typed pub/sub pattern for game events

import type { GameEventType, GameEvents } from './types';

type EventCallback<T extends GameEvents = GameEvents> = (event: T) => void;

type EventMap = {
  [K in GameEventType]: EventCallback<Extract<GameEvents, { type: K }>>[];
};

export interface EventBus {
  on<K extends GameEventType>(
    type: K,
    callback: EventCallback<Extract<GameEvents, { type: K }>>
  ): () => void;
  off<K extends GameEventType>(
    type: K,
    callback: EventCallback<Extract<GameEvents, { type: K }>>
  ): void;
  emit<T extends GameEvents>(event: T): void;
  clear(): void;
}

function createEventBus(): EventBus {
  const listeners: Partial<EventMap> = {};

  function on<K extends GameEventType>(
    type: K,
    callback: EventCallback<Extract<GameEvents, { type: K }>>
  ): () => void {
    if (!listeners[type]) {
      listeners[type] = [];
    }
    (listeners[type] as EventCallback<Extract<GameEvents, { type: K }>>[]).push(callback);

    return () => off(type, callback);
  }

  function off<K extends GameEventType>(
    type: K,
    callback: EventCallback<Extract<GameEvents, { type: K }>>
  ): void {
    const typeListeners = listeners[type];
    if (!typeListeners) return;

    const index = typeListeners.indexOf(
      callback as EventCallback<Extract<GameEvents, { type: K }>>
    );
    if (index !== -1) {
      typeListeners.splice(index, 1);
    }
  }

  function emit<T extends GameEvents>(event: T): void {
    const typeListeners = listeners[event.type];
    if (!typeListeners) return;

    for (const callback of typeListeners) {
      (callback as EventCallback<T>)(event);
    }
  }

  function clear(): void {
    for (const type of Object.keys(listeners) as GameEventType[]) {
      delete listeners[type];
    }
  }

  return { on, off, emit, clear };
}

// Singleton event bus instance
export const eventBus = createEventBus();

// Factory for creating isolated event buses (useful for testing)
export { createEventBus };

// Helper to create events with timestamp
export function createEvent<K extends GameEventType>(
  type: K,
  payload: Extract<GameEvents, { type: K }>['payload']
): Extract<GameEvents, { type: K }> {
  return {
    type,
    payload,
    timestamp: Date.now(),
  } as Extract<GameEvents, { type: K }>;
}
