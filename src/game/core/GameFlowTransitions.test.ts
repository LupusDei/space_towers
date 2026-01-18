import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameStateMachine, type PhaseChangeCallback } from './GameStateMachine';
import { GamePhase } from '../types';

/**
 * Tests for game flow transitions:
 * - Menu -> Store transition
 * - Store -> Game transition
 * - Tower passing (selection state)
 * - Back to Store flow
 * - Selection persistence
 */
describe('Game Flow Transitions', () => {
  let stateMachine: GameStateMachine;
  let phaseChangeCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    phaseChangeCallback = vi.fn();
    stateMachine = new GameStateMachine({
      onPhaseChange: phaseChangeCallback as PhaseChangeCallback,
    });
  });

  describe('Menu -> Store transition', () => {
    it('should start in MENU phase', () => {
      expect(stateMachine.getPhase()).toBe(GamePhase.MENU);
      expect(stateMachine.isMenu()).toBe(true);
    });

    it('should transition from MENU to TOWER_STORE', () => {
      const result = stateMachine.transitionTo(GamePhase.TOWER_STORE);

      expect(result).toBe(true);
      expect(stateMachine.getPhase()).toBe(GamePhase.TOWER_STORE);
      expect(stateMachine.isTowerStore()).toBe(true);
    });

    it('should call onPhaseChange callback on Menu -> Store transition', () => {
      stateMachine.transitionTo(GamePhase.TOWER_STORE);

      expect(phaseChangeCallback).toHaveBeenCalledWith(
        GamePhase.MENU,
        GamePhase.TOWER_STORE
      );
    });

    it('should NOT allow direct transition from MENU to PLANNING', () => {
      const result = stateMachine.transitionTo(GamePhase.PLANNING);

      expect(result).toBe(false);
      expect(stateMachine.getPhase()).toBe(GamePhase.MENU);
    });

    it('should NOT allow direct transition from MENU to COMBAT', () => {
      const result = stateMachine.transitionTo(GamePhase.COMBAT);

      expect(result).toBe(false);
      expect(stateMachine.getPhase()).toBe(GamePhase.MENU);
    });

    it('should track previous phase after Menu -> Store', () => {
      stateMachine.transitionTo(GamePhase.TOWER_STORE);

      expect(stateMachine.getPreviousPhase()).toBe(GamePhase.MENU);
    });
  });

  describe('Store -> Game transition', () => {
    beforeEach(() => {
      // Start from TOWER_STORE
      stateMachine.transitionTo(GamePhase.TOWER_STORE);
      phaseChangeCallback.mockClear();
    });

    it('should transition from TOWER_STORE to PLANNING', () => {
      const result = stateMachine.transitionTo(GamePhase.PLANNING);

      expect(result).toBe(true);
      expect(stateMachine.getPhase()).toBe(GamePhase.PLANNING);
      expect(stateMachine.isPlanning()).toBe(true);
    });

    it('should call onPhaseChange callback on Store -> Planning transition', () => {
      stateMachine.transitionTo(GamePhase.PLANNING);

      expect(phaseChangeCallback).toHaveBeenCalledWith(
        GamePhase.TOWER_STORE,
        GamePhase.PLANNING
      );
    });

    it('should NOT allow direct transition from TOWER_STORE to COMBAT', () => {
      const result = stateMachine.transitionTo(GamePhase.COMBAT);

      expect(result).toBe(false);
      expect(stateMachine.getPhase()).toBe(GamePhase.TOWER_STORE);
    });

    it('should allow going back from TOWER_STORE to MENU', () => {
      const result = stateMachine.transitionTo(GamePhase.MENU);

      expect(result).toBe(true);
      expect(stateMachine.getPhase()).toBe(GamePhase.MENU);
    });

    it('should track previous phase after Store -> Planning', () => {
      stateMachine.transitionTo(GamePhase.PLANNING);

      expect(stateMachine.getPreviousPhase()).toBe(GamePhase.TOWER_STORE);
    });
  });

  describe('Back to Store flow', () => {
    describe('from VICTORY', () => {
      beforeEach(() => {
        stateMachine.forcePhase(GamePhase.VICTORY);
        phaseChangeCallback.mockClear();
      });

      it('should allow transition from VICTORY to TOWER_STORE', () => {
        const result = stateMachine.transitionTo(GamePhase.TOWER_STORE);

        expect(result).toBe(true);
        expect(stateMachine.getPhase()).toBe(GamePhase.TOWER_STORE);
      });

      it('should call onPhaseChange callback on Victory -> Store transition', () => {
        stateMachine.transitionTo(GamePhase.TOWER_STORE);

        expect(phaseChangeCallback).toHaveBeenCalledWith(
          GamePhase.VICTORY,
          GamePhase.TOWER_STORE
        );
      });

      it('should still allow direct VICTORY to PLANNING (quick restart)', () => {
        const result = stateMachine.transitionTo(GamePhase.PLANNING);

        expect(result).toBe(true);
        expect(stateMachine.getPhase()).toBe(GamePhase.PLANNING);
      });

      it('should still allow VICTORY to MENU', () => {
        const result = stateMachine.transitionTo(GamePhase.MENU);

        expect(result).toBe(true);
        expect(stateMachine.getPhase()).toBe(GamePhase.MENU);
      });
    });

    describe('from DEFEAT', () => {
      beforeEach(() => {
        stateMachine.forcePhase(GamePhase.DEFEAT);
        phaseChangeCallback.mockClear();
      });

      it('should allow transition from DEFEAT to TOWER_STORE', () => {
        const result = stateMachine.transitionTo(GamePhase.TOWER_STORE);

        expect(result).toBe(true);
        expect(stateMachine.getPhase()).toBe(GamePhase.TOWER_STORE);
      });

      it('should call onPhaseChange callback on Defeat -> Store transition', () => {
        stateMachine.transitionTo(GamePhase.TOWER_STORE);

        expect(phaseChangeCallback).toHaveBeenCalledWith(
          GamePhase.DEFEAT,
          GamePhase.TOWER_STORE
        );
      });

      it('should still allow direct DEFEAT to PLANNING (quick restart)', () => {
        const result = stateMachine.transitionTo(GamePhase.PLANNING);

        expect(result).toBe(true);
        expect(stateMachine.getPhase()).toBe(GamePhase.PLANNING);
      });

      it('should still allow DEFEAT to MENU', () => {
        const result = stateMachine.transitionTo(GamePhase.MENU);

        expect(result).toBe(true);
        expect(stateMachine.getPhase()).toBe(GamePhase.MENU);
      });
    });
  });

  describe('Selection persistence across phase changes', () => {
    it('should maintain state machine identity across multiple transitions', () => {
      // Simulate full game flow
      stateMachine.transitionTo(GamePhase.TOWER_STORE);
      stateMachine.transitionTo(GamePhase.PLANNING);
      stateMachine.transitionTo(GamePhase.COMBAT);
      stateMachine.transitionTo(GamePhase.PLANNING); // wave complete

      expect(stateMachine.getPhase()).toBe(GamePhase.PLANNING);
      // The state machine maintains its state throughout
    });

    it('should correctly report canStartGame from TOWER_STORE', () => {
      stateMachine.transitionTo(GamePhase.TOWER_STORE);

      expect(stateMachine.canStartGame()).toBe(true);
    });

    it('should correctly report canStartGame from MENU', () => {
      expect(stateMachine.canStartGame()).toBe(true);
    });

    it('should report canStartGame as false from PLANNING', () => {
      stateMachine.transitionTo(GamePhase.TOWER_STORE);
      stateMachine.transitionTo(GamePhase.PLANNING);

      expect(stateMachine.canStartGame()).toBe(false);
    });

    it('should report canStartGame as false from COMBAT', () => {
      stateMachine.forcePhase(GamePhase.COMBAT);

      expect(stateMachine.canStartGame()).toBe(false);
    });
  });

  describe('Complete game flow simulation', () => {
    it('should support full new game flow: MENU -> TOWER_STORE -> PLANNING -> COMBAT', () => {
      // Start new game
      expect(stateMachine.getPhase()).toBe(GamePhase.MENU);

      // Enter tower store
      expect(stateMachine.transitionTo(GamePhase.TOWER_STORE)).toBe(true);
      expect(stateMachine.getPhase()).toBe(GamePhase.TOWER_STORE);

      // Start planning phase
      expect(stateMachine.transitionTo(GamePhase.PLANNING)).toBe(true);
      expect(stateMachine.getPhase()).toBe(GamePhase.PLANNING);

      // Start combat
      expect(stateMachine.transitionTo(GamePhase.COMBAT)).toBe(true);
      expect(stateMachine.getPhase()).toBe(GamePhase.COMBAT);
    });

    it('should support wave completion flow: COMBAT -> PLANNING -> COMBAT', () => {
      stateMachine.forcePhase(GamePhase.COMBAT);

      // Wave complete, return to planning
      expect(stateMachine.transitionTo(GamePhase.PLANNING)).toBe(true);

      // Start next wave
      expect(stateMachine.transitionTo(GamePhase.COMBAT)).toBe(true);
    });

    it('should support retry with loadout change: DEFEAT -> TOWER_STORE -> PLANNING', () => {
      stateMachine.forcePhase(GamePhase.DEFEAT);

      // Go to store to change loadout
      expect(stateMachine.transitionTo(GamePhase.TOWER_STORE)).toBe(true);

      // Start new game with new loadout
      expect(stateMachine.transitionTo(GamePhase.PLANNING)).toBe(true);
    });

    it('should support quick restart: DEFEAT -> PLANNING', () => {
      stateMachine.forcePhase(GamePhase.DEFEAT);

      // Quick restart without visiting store
      expect(stateMachine.transitionTo(GamePhase.PLANNING)).toBe(true);
    });

    it('should support victory continue with loadout change: VICTORY -> TOWER_STORE -> PLANNING', () => {
      stateMachine.forcePhase(GamePhase.VICTORY);

      // Go to store to upgrade loadout
      expect(stateMachine.transitionTo(GamePhase.TOWER_STORE)).toBe(true);

      // Continue with new loadout
      expect(stateMachine.transitionTo(GamePhase.PLANNING)).toBe(true);
    });

    it('should support return to main menu from game over: DEFEAT -> MENU', () => {
      stateMachine.forcePhase(GamePhase.DEFEAT);

      expect(stateMachine.transitionTo(GamePhase.MENU)).toBe(true);
    });
  });

  describe('Invalid transition protection', () => {
    it('should not allow PLANNING to TOWER_STORE', () => {
      stateMachine.forcePhase(GamePhase.PLANNING);

      expect(stateMachine.transitionTo(GamePhase.TOWER_STORE)).toBe(false);
    });

    it('should not allow COMBAT to TOWER_STORE', () => {
      stateMachine.forcePhase(GamePhase.COMBAT);

      expect(stateMachine.transitionTo(GamePhase.TOWER_STORE)).toBe(false);
    });

    it('should not allow PAUSED to TOWER_STORE', () => {
      stateMachine.forcePhase(GamePhase.PAUSED);

      expect(stateMachine.transitionTo(GamePhase.TOWER_STORE)).toBe(false);
    });

    it('should not allow TOWER_STORE to COMBAT directly', () => {
      stateMachine.transitionTo(GamePhase.TOWER_STORE);

      expect(stateMachine.transitionTo(GamePhase.COMBAT)).toBe(false);
    });

    it('should not allow TOWER_STORE to VICTORY', () => {
      stateMachine.transitionTo(GamePhase.TOWER_STORE);

      expect(stateMachine.transitionTo(GamePhase.VICTORY)).toBe(false);
    });

    it('should not allow TOWER_STORE to DEFEAT', () => {
      stateMachine.transitionTo(GamePhase.TOWER_STORE);

      expect(stateMachine.transitionTo(GamePhase.DEFEAT)).toBe(false);
    });
  });
});
