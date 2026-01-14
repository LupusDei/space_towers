// StateNotifier - React subscription pattern for game state updates
// Handles subscriber management and notification

// ============================================================================
// Types
// ============================================================================

export type StateSubscriber = () => void;

// ============================================================================
// StateNotifier Class
// ============================================================================

export class StateNotifier {
  private subscribers = new Set<StateSubscriber>();
  private version = 0;

  /**
   * Subscribe to state changes.
   * @param callback - Function to call when state changes
   * @returns Unsubscribe function
   */
  subscribe(callback: StateSubscriber): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers of a state change.
   * Increments the version number.
   */
  notify(): void {
    this.version++;
    this.subscribers.forEach((cb) => cb());
  }

  /**
   * Get the current state version.
   * Can be used by React to detect changes via useSyncExternalStore.
   */
  getVersion(): number {
    return this.version;
  }

  /**
   * Clear all subscribers.
   * Should be called when the engine is destroyed.
   */
  clear(): void {
    this.subscribers.clear();
  }

  /**
   * Reset the notifier to initial state.
   */
  reset(): void {
    this.subscribers.clear();
    this.version = 0;
  }

  /**
   * Get the number of active subscribers.
   * Useful for debugging.
   */
  get subscriberCount(): number {
    return this.subscribers.size;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createStateNotifier(): StateNotifier {
  return new StateNotifier();
}
