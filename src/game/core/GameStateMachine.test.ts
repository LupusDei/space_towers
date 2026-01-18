import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameStateMachine, createGameStateMachine } from './GameStateMachine';
import { GamePhase } from '../types';

describe('GameStateMachine', () => {
  let stateMachine: GameStateMachine;

  beforeEach(() => {
    stateMachine = new GameStateMachine();
  });

  describe('getPhase', () => {
    it('should start in MENU phase by default', () => {
      expect(stateMachine.getPhase()).toBe(GamePhase.MENU);
    });

    it('should respect initialPhase config', () => {
      const sm = new GameStateMachine({ initialPhase: GamePhase.PLANNING });
      expect(sm.getPhase()).toBe(GamePhase.PLANNING);
    });
  });

  describe('transitionTo', () => {
    it('should transition to valid phase', () => {
      const result = stateMachine.transitionTo(GamePhase.TOWER_STORE);

      expect(result).toBe(true);
      expect(stateMachine.getPhase()).toBe(GamePhase.TOWER_STORE);
    });

    it('should reject invalid transitions', () => {
      // MENU cannot go directly to COMBAT or PLANNING (must go through TOWER_STORE)
      expect(stateMachine.transitionTo(GamePhase.COMBAT)).toBe(false);
      expect(stateMachine.transitionTo(GamePhase.PLANNING)).toBe(false);
      expect(stateMachine.getPhase()).toBe(GamePhase.MENU);
    });

    it('should reject same-phase transition', () => {
      const result = stateMachine.transitionTo(GamePhase.MENU);

      expect(result).toBe(false);
    });

    it('should call onPhaseChange callback', () => {
      const callback = vi.fn();
      stateMachine.setOnPhaseChange(callback);

      stateMachine.transitionTo(GamePhase.TOWER_STORE);

      expect(callback).toHaveBeenCalledWith(GamePhase.MENU, GamePhase.TOWER_STORE);
    });

    it('should update previousPhase', () => {
      stateMachine.transitionTo(GamePhase.TOWER_STORE);

      expect(stateMachine.getPreviousPhase()).toBe(GamePhase.MENU);
    });
  });

  describe('forcePhase', () => {
    it('should set phase without validation', () => {
      stateMachine.forcePhase(GamePhase.VICTORY);

      expect(stateMachine.getPhase()).toBe(GamePhase.VICTORY);
    });

    it('should call onPhaseChange callback', () => {
      const callback = vi.fn();
      stateMachine.setOnPhaseChange(callback);

      stateMachine.forcePhase(GamePhase.COMBAT);

      expect(callback).toHaveBeenCalledWith(GamePhase.MENU, GamePhase.COMBAT);
    });

    it('should not call callback for same phase', () => {
      const callback = vi.fn();
      stateMachine.setOnPhaseChange(callback);

      stateMachine.forcePhase(GamePhase.MENU);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('canTransitionTo', () => {
    it('should return true for valid transitions', () => {
      expect(stateMachine.canTransitionTo(GamePhase.TOWER_STORE)).toBe(true);
    });

    it('should return false for invalid transitions', () => {
      expect(stateMachine.canTransitionTo(GamePhase.COMBAT)).toBe(false);
      expect(stateMachine.canTransitionTo(GamePhase.PLANNING)).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset to MENU phase by default', () => {
      stateMachine.transitionTo(GamePhase.TOWER_STORE);
      stateMachine.reset();

      expect(stateMachine.getPhase()).toBe(GamePhase.MENU);
    });

    it('should accept custom initial phase', () => {
      stateMachine.reset(GamePhase.PLANNING);

      expect(stateMachine.getPhase()).toBe(GamePhase.PLANNING);
    });

    it('should clear previousPhase', () => {
      stateMachine.transitionTo(GamePhase.TOWER_STORE);
      stateMachine.reset();

      expect(stateMachine.getPreviousPhase()).toBeNull();
    });
  });

  describe('phase helpers', () => {
    it('isMenu should return true in MENU phase', () => {
      expect(stateMachine.isMenu()).toBe(true);
      stateMachine.transitionTo(GamePhase.TOWER_STORE);
      expect(stateMachine.isMenu()).toBe(false);
    });

    it('isTowerStore should return true in TOWER_STORE phase', () => {
      stateMachine.transitionTo(GamePhase.TOWER_STORE);
      expect(stateMachine.isTowerStore()).toBe(true);
      stateMachine.transitionTo(GamePhase.PLANNING);
      expect(stateMachine.isTowerStore()).toBe(false);
    });

    it('isPlanning should return true in PLANNING phase', () => {
      stateMachine.transitionTo(GamePhase.TOWER_STORE);
      stateMachine.transitionTo(GamePhase.PLANNING);
      expect(stateMachine.isPlanning()).toBe(true);
    });

    it('isCombat should return true in COMBAT phase', () => {
      stateMachine.transitionTo(GamePhase.TOWER_STORE);
      stateMachine.transitionTo(GamePhase.PLANNING);
      stateMachine.transitionTo(GamePhase.COMBAT);
      expect(stateMachine.isCombat()).toBe(true);
    });

    it('isPaused should return true in PAUSED phase', () => {
      stateMachine.transitionTo(GamePhase.TOWER_STORE);
      stateMachine.transitionTo(GamePhase.PLANNING);
      stateMachine.transitionTo(GamePhase.PAUSED);
      expect(stateMachine.isPaused()).toBe(true);
    });

    it('isVictory should return true in VICTORY phase', () => {
      stateMachine.forcePhase(GamePhase.VICTORY);
      expect(stateMachine.isVictory()).toBe(true);
    });

    it('isDefeat should return true in DEFEAT phase', () => {
      stateMachine.forcePhase(GamePhase.DEFEAT);
      expect(stateMachine.isDefeat()).toBe(true);
    });

    it('isGameOver should return true for VICTORY or DEFEAT', () => {
      stateMachine.forcePhase(GamePhase.VICTORY);
      expect(stateMachine.isGameOver()).toBe(true);

      stateMachine.forcePhase(GamePhase.DEFEAT);
      expect(stateMachine.isGameOver()).toBe(true);

      stateMachine.forcePhase(GamePhase.COMBAT);
      expect(stateMachine.isGameOver()).toBe(false);
    });

    it('isActive should return true for PLANNING or COMBAT', () => {
      stateMachine.transitionTo(GamePhase.TOWER_STORE);
      stateMachine.transitionTo(GamePhase.PLANNING);
      expect(stateMachine.isActive()).toBe(true);

      stateMachine.transitionTo(GamePhase.COMBAT);
      expect(stateMachine.isActive()).toBe(true);

      stateMachine.transitionTo(GamePhase.PAUSED);
      expect(stateMachine.isActive()).toBe(false);
    });
  });

  describe('canStartGame', () => {
    it('should return true from MENU', () => {
      expect(stateMachine.canStartGame()).toBe(true);
    });

    it('should return true from TOWER_STORE', () => {
      stateMachine.transitionTo(GamePhase.TOWER_STORE);
      expect(stateMachine.canStartGame()).toBe(true);
    });

    it('should return true from VICTORY', () => {
      stateMachine.forcePhase(GamePhase.VICTORY);
      expect(stateMachine.canStartGame()).toBe(true);
    });

    it('should return true from DEFEAT', () => {
      stateMachine.forcePhase(GamePhase.DEFEAT);
      expect(stateMachine.canStartGame()).toBe(true);
    });

    it('should return false from PLANNING', () => {
      stateMachine.transitionTo(GamePhase.TOWER_STORE);
      stateMachine.transitionTo(GamePhase.PLANNING);
      expect(stateMachine.canStartGame()).toBe(false);
    });
  });

  describe('canStartWave', () => {
    it('should return true from PLANNING', () => {
      stateMachine.transitionTo(GamePhase.TOWER_STORE);
      stateMachine.transitionTo(GamePhase.PLANNING);
      expect(stateMachine.canStartWave()).toBe(true);
    });

    it('should return false from COMBAT', () => {
      stateMachine.forcePhase(GamePhase.COMBAT);
      expect(stateMachine.canStartWave()).toBe(false);
    });
  });

  describe('canPause', () => {
    it('should return true from PLANNING', () => {
      stateMachine.transitionTo(GamePhase.TOWER_STORE);
      stateMachine.transitionTo(GamePhase.PLANNING);
      expect(stateMachine.canPause()).toBe(true);
    });

    it('should return true from COMBAT', () => {
      stateMachine.forcePhase(GamePhase.COMBAT);
      expect(stateMachine.canPause()).toBe(true);
    });

    it('should return false from MENU', () => {
      expect(stateMachine.canPause()).toBe(false);
    });
  });

  describe('canResume', () => {
    it('should return true from PAUSED', () => {
      stateMachine.transitionTo(GamePhase.TOWER_STORE);
      stateMachine.transitionTo(GamePhase.PLANNING);
      stateMachine.transitionTo(GamePhase.PAUSED);
      expect(stateMachine.canResume()).toBe(true);
    });

    it('should return false from other phases', () => {
      expect(stateMachine.canResume()).toBe(false);
    });
  });

  describe('valid state transitions', () => {
    it('MENU -> TOWER_STORE', () => {
      expect(stateMachine.transitionTo(GamePhase.TOWER_STORE)).toBe(true);
    });

    it('TOWER_STORE -> PLANNING', () => {
      stateMachine.transitionTo(GamePhase.TOWER_STORE);
      expect(stateMachine.transitionTo(GamePhase.PLANNING)).toBe(true);
    });

    it('TOWER_STORE -> MENU', () => {
      stateMachine.transitionTo(GamePhase.TOWER_STORE);
      expect(stateMachine.transitionTo(GamePhase.MENU)).toBe(true);
    });

    it('PLANNING -> COMBAT', () => {
      stateMachine.transitionTo(GamePhase.TOWER_STORE);
      stateMachine.transitionTo(GamePhase.PLANNING);
      expect(stateMachine.transitionTo(GamePhase.COMBAT)).toBe(true);
    });

    it('PLANNING -> PAUSED', () => {
      stateMachine.transitionTo(GamePhase.TOWER_STORE);
      stateMachine.transitionTo(GamePhase.PLANNING);
      expect(stateMachine.transitionTo(GamePhase.PAUSED)).toBe(true);
    });

    it('COMBAT -> PLANNING (wave complete)', () => {
      stateMachine.forcePhase(GamePhase.COMBAT);
      expect(stateMachine.transitionTo(GamePhase.PLANNING)).toBe(true);
    });

    it('COMBAT -> PAUSED', () => {
      stateMachine.forcePhase(GamePhase.COMBAT);
      expect(stateMachine.transitionTo(GamePhase.PAUSED)).toBe(true);
    });

    it('COMBAT -> VICTORY', () => {
      stateMachine.forcePhase(GamePhase.COMBAT);
      expect(stateMachine.transitionTo(GamePhase.VICTORY)).toBe(true);
    });

    it('COMBAT -> DEFEAT', () => {
      stateMachine.forcePhase(GamePhase.COMBAT);
      expect(stateMachine.transitionTo(GamePhase.DEFEAT)).toBe(true);
    });

    it('PAUSED -> PLANNING', () => {
      stateMachine.transitionTo(GamePhase.TOWER_STORE);
      stateMachine.transitionTo(GamePhase.PLANNING);
      stateMachine.transitionTo(GamePhase.PAUSED);
      expect(stateMachine.transitionTo(GamePhase.PLANNING)).toBe(true);
    });

    it('PAUSED -> COMBAT', () => {
      stateMachine.transitionTo(GamePhase.TOWER_STORE);
      stateMachine.transitionTo(GamePhase.PLANNING);
      stateMachine.transitionTo(GamePhase.PAUSED);
      expect(stateMachine.transitionTo(GamePhase.COMBAT)).toBe(true);
    });

    it('PAUSED -> TOWER_STORE (back to store)', () => {
      stateMachine.transitionTo(GamePhase.TOWER_STORE);
      stateMachine.transitionTo(GamePhase.PLANNING);
      stateMachine.transitionTo(GamePhase.PAUSED);
      expect(stateMachine.transitionTo(GamePhase.TOWER_STORE)).toBe(true);
    });

    it('VICTORY -> MENU', () => {
      stateMachine.forcePhase(GamePhase.VICTORY);
      expect(stateMachine.transitionTo(GamePhase.MENU)).toBe(true);
    });

    it('VICTORY -> PLANNING (restart)', () => {
      stateMachine.forcePhase(GamePhase.VICTORY);
      expect(stateMachine.transitionTo(GamePhase.PLANNING)).toBe(true);
    });

    it('VICTORY -> TOWER_STORE (change loadout)', () => {
      stateMachine.forcePhase(GamePhase.VICTORY);
      expect(stateMachine.transitionTo(GamePhase.TOWER_STORE)).toBe(true);
    });

    it('DEFEAT -> MENU', () => {
      stateMachine.forcePhase(GamePhase.DEFEAT);
      expect(stateMachine.transitionTo(GamePhase.MENU)).toBe(true);
    });

    it('DEFEAT -> PLANNING (restart)', () => {
      stateMachine.forcePhase(GamePhase.DEFEAT);
      expect(stateMachine.transitionTo(GamePhase.PLANNING)).toBe(true);
    });

    it('DEFEAT -> TOWER_STORE (change loadout)', () => {
      stateMachine.forcePhase(GamePhase.DEFEAT);
      expect(stateMachine.transitionTo(GamePhase.TOWER_STORE)).toBe(true);
    });
  });

  describe('createGameStateMachine', () => {
    it('should create a new GameStateMachine instance', () => {
      const sm = createGameStateMachine();
      expect(sm).toBeInstanceOf(GameStateMachine);
    });

    it('should accept config options', () => {
      const callback = vi.fn();
      const sm = createGameStateMachine({
        initialPhase: GamePhase.PLANNING,
        onPhaseChange: callback,
      });

      expect(sm.getPhase()).toBe(GamePhase.PLANNING);
      sm.transitionTo(GamePhase.COMBAT);
      expect(callback).toHaveBeenCalled();
    });
  });
});
