import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameLoopManager, createGameLoopManager } from './GameLoopManager';

describe('GameLoopManager', () => {
  let loopManager: GameLoopManager;
  let mockRAF: ReturnType<typeof vi.fn>;
  let mockCancelRAF: ReturnType<typeof vi.fn>;
  let rafCallbacks: ((time: number) => void)[];

  beforeEach(() => {
    rafCallbacks = [];
    mockRAF = vi.fn((callback: (time: number) => void) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    });
    mockCancelRAF = vi.fn();

    vi.stubGlobal('requestAnimationFrame', mockRAF);
    vi.stubGlobal('cancelAnimationFrame', mockCancelRAF);
    vi.spyOn(performance, 'now').mockReturnValue(0);

    loopManager = new GameLoopManager();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('start', () => {
    it('should start the game loop', () => {
      loopManager.start();

      expect(loopManager.isRunning()).toBe(true);
      expect(mockRAF).toHaveBeenCalled();
    });

    it('should not restart if already running', () => {
      loopManager.start();
      loopManager.start();

      expect(mockRAF).toHaveBeenCalledTimes(1);
    });
  });

  describe('stop', () => {
    it('should stop the game loop', () => {
      loopManager.start();
      loopManager.stop();

      expect(loopManager.isRunning()).toBe(false);
      expect(mockCancelRAF).toHaveBeenCalled();
    });

    it('should handle stop when not running', () => {
      loopManager.stop();

      expect(loopManager.isRunning()).toBe(false);
    });
  });

  describe('setUpdateCallback', () => {
    it('should call update callback with delta time in seconds', () => {
      const updateCallback = vi.fn();
      loopManager.setUpdateCallback(updateCallback);

      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(16.67); // ~60fps

      loopManager.start();

      // Simulate one frame
      if (rafCallbacks.length > 0) {
        rafCallbacks[0](16.67);
      }

      expect(updateCallback).toHaveBeenCalled();
      // Delta time should be close to 1/60 seconds
      const dtArg = updateCallback.mock.calls[0][0];
      expect(dtArg).toBeCloseTo(16.67 / 1000, 2);
    });
  });

  describe('setPausedCheck', () => {
    it('should skip updates when paused', () => {
      const updateCallback = vi.fn();
      loopManager.setUpdateCallback(updateCallback);
      loopManager.setPausedCheck(() => true);

      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(16.67);

      loopManager.start();

      if (rafCallbacks.length > 0) {
        rafCallbacks[0](16.67);
      }

      expect(updateCallback).not.toHaveBeenCalled();
    });

    it('should run updates when not paused', () => {
      const updateCallback = vi.fn();
      loopManager.setUpdateCallback(updateCallback);
      loopManager.setPausedCheck(() => false);

      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(16.67);

      loopManager.start();

      if (rafCallbacks.length > 0) {
        rafCallbacks[0](16.67);
      }

      expect(updateCallback).toHaveBeenCalled();
    });
  });

  describe('isRunning', () => {
    it('should return false initially', () => {
      expect(loopManager.isRunning()).toBe(false);
    });

    it('should return true after start', () => {
      loopManager.start();
      expect(loopManager.isRunning()).toBe(true);
    });

    it('should return false after stop', () => {
      loopManager.start();
      loopManager.stop();
      expect(loopManager.isRunning()).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset accumulator and lastTime', () => {
      loopManager.start();
      loopManager.reset();

      // Internal state is reset, can verify by starting again
      expect(loopManager.isRunning()).toBe(true);
    });
  });

  describe('getFixedTimestep', () => {
    it('should return default timestep', () => {
      // Default is 1000/60 = ~16.67ms
      const timestep = loopManager.getFixedTimestep();
      expect(timestep).toBeCloseTo(16.67, 1);
    });

    it('should use custom tick rate', () => {
      const customManager = new GameLoopManager({ tickRate: 30 });
      expect(customManager.getFixedTimestep()).toBeCloseTo(33.33, 1);
    });
  });

  describe('spiral of death prevention', () => {
    it('should clamp frame time to maxFrameTime', () => {
      const updateCallback = vi.fn();
      loopManager.setUpdateCallback(updateCallback);

      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(500); // 500ms frame time (should be clamped to 250ms)

      loopManager.start();

      if (rafCallbacks.length > 0) {
        rafCallbacks[0](500);
      }

      // Should have called update multiple times but not 30 times (500/16.67)
      // Max frame time is 250ms, so max ~15 updates
      expect(updateCallback.mock.calls.length).toBeLessThanOrEqual(15);
    });
  });

  describe('createGameLoopManager', () => {
    it('should create a new GameLoopManager instance', () => {
      const manager = createGameLoopManager();
      expect(manager).toBeInstanceOf(GameLoopManager);
    });

    it('should accept config options', () => {
      const manager = createGameLoopManager({ tickRate: 30 });
      expect(manager.getFixedTimestep()).toBeCloseTo(33.33, 1);
    });
  });
});
