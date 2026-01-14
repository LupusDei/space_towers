import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StateNotifier, createStateNotifier } from './StateNotifier';

describe('StateNotifier', () => {
  let notifier: StateNotifier;

  beforeEach(() => {
    notifier = new StateNotifier();
  });

  describe('subscribe', () => {
    it('should add subscriber and call on notify', () => {
      const callback = vi.fn();
      notifier.subscribe(callback);

      notifier.notify();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should support multiple subscribers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      notifier.subscribe(callback1);
      notifier.subscribe(callback2);

      notifier.notify();

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = notifier.subscribe(callback);

      unsubscribe();
      notifier.notify();

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('notify', () => {
    it('should increment version on each notify', () => {
      expect(notifier.getVersion()).toBe(0);

      notifier.notify();
      expect(notifier.getVersion()).toBe(1);

      notifier.notify();
      expect(notifier.getVersion()).toBe(2);
    });

    it('should call all subscribers', () => {
      const callbacks = [vi.fn(), vi.fn(), vi.fn()];
      callbacks.forEach(cb => notifier.subscribe(cb));

      notifier.notify();

      callbacks.forEach(cb => expect(cb).toHaveBeenCalledTimes(1));
    });
  });

  describe('getVersion', () => {
    it('should start at 0', () => {
      expect(notifier.getVersion()).toBe(0);
    });
  });

  describe('clear', () => {
    it('should remove all subscribers', () => {
      const callback = vi.fn();
      notifier.subscribe(callback);

      notifier.clear();
      notifier.notify();

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should clear subscribers and reset version', () => {
      const callback = vi.fn();
      notifier.subscribe(callback);
      notifier.notify();
      notifier.notify();

      expect(callback).toHaveBeenCalledTimes(2);

      notifier.reset();

      expect(notifier.getVersion()).toBe(0);
      notifier.notify();
      // After reset, callback should not be called again (still 2 total calls)
      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe('subscriberCount', () => {
    it('should track number of subscribers', () => {
      expect(notifier.subscriberCount).toBe(0);

      const unsub1 = notifier.subscribe(vi.fn());
      expect(notifier.subscriberCount).toBe(1);

      notifier.subscribe(vi.fn());
      expect(notifier.subscriberCount).toBe(2);

      unsub1();
      expect(notifier.subscriberCount).toBe(1);
    });
  });

  describe('createStateNotifier', () => {
    it('should create a new StateNotifier instance', () => {
      const notifier = createStateNotifier();
      expect(notifier).toBeInstanceOf(StateNotifier);
    });
  });
});
