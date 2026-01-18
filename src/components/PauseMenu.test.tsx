import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PauseMenu from './PauseMenu';
import { eventBus } from '../game/events';
import { GamePhase } from '../game/types';

describe('PauseMenu', () => {
  const mockOnResume = vi.fn();
  const mockOnBackToStore = vi.fn();

  beforeEach(() => {
    mockOnResume.mockClear();
    mockOnBackToStore.mockClear();
  });

  afterEach(() => {
    // Clean up any event listeners
    eventBus.clear();
  });

  describe('visibility', () => {
    it('should not be visible initially', () => {
      render(<PauseMenu onResume={mockOnResume} onBackToStore={mockOnBackToStore} />);

      expect(screen.queryByText('PAUSED')).not.toBeInTheDocument();
    });

    it('should become visible when phase changes to PAUSED', () => {
      render(<PauseMenu onResume={mockOnResume} onBackToStore={mockOnBackToStore} />);

      // Simulate phase change to PAUSED
      act(() => {
        eventBus.emit({
          type: 'PHASE_CHANGE',
          payload: { from: GamePhase.COMBAT, to: GamePhase.PAUSED },
          timestamp: Date.now(),
        });
      });

      expect(screen.getByText('PAUSED')).toBeInTheDocument();
    });

    it('should hide when phase changes from PAUSED to another phase', () => {
      render(<PauseMenu onResume={mockOnResume} onBackToStore={mockOnBackToStore} />);

      // First show the menu
      act(() => {
        eventBus.emit({
          type: 'PHASE_CHANGE',
          payload: { from: GamePhase.COMBAT, to: GamePhase.PAUSED },
          timestamp: Date.now(),
        });
      });

      expect(screen.getByText('PAUSED')).toBeInTheDocument();

      // Then hide it by changing phase
      act(() => {
        eventBus.emit({
          type: 'PHASE_CHANGE',
          payload: { from: GamePhase.PAUSED, to: GamePhase.COMBAT },
          timestamp: Date.now(),
        });
      });

      expect(screen.queryByText('PAUSED')).not.toBeInTheDocument();
    });
  });

  describe('rendering', () => {
    beforeEach(() => {
      render(<PauseMenu onResume={mockOnResume} onBackToStore={mockOnBackToStore} />);
      // Show the menu
      act(() => {
        eventBus.emit({
          type: 'PHASE_CHANGE',
          payload: { from: GamePhase.COMBAT, to: GamePhase.PAUSED },
          timestamp: Date.now(),
        });
      });
    });

    it('should render the title', () => {
      expect(screen.getByText('PAUSED')).toBeInTheDocument();
    });

    it('should render Resume button', () => {
      expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
    });

    it('should render Back to Store button', () => {
      expect(screen.getByRole('button', { name: /back to store/i })).toBeInTheDocument();
    });

    it('should render hint text', () => {
      expect(screen.getByText(/press esc to resume/i)).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    beforeEach(() => {
      render(<PauseMenu onResume={mockOnResume} onBackToStore={mockOnBackToStore} />);
      // Show the menu
      act(() => {
        eventBus.emit({
          type: 'PHASE_CHANGE',
          payload: { from: GamePhase.COMBAT, to: GamePhase.PAUSED },
          timestamp: Date.now(),
        });
      });
    });

    it('should call onResume when Resume button is clicked', () => {
      const resumeButton = screen.getByRole('button', { name: /resume/i });
      fireEvent.click(resumeButton);

      expect(mockOnResume).toHaveBeenCalledTimes(1);
    });

    it('should call onBackToStore when Back to Store button is clicked', () => {
      const backToStoreButton = screen.getByRole('button', { name: /back to store/i });
      fireEvent.click(backToStoreButton);

      expect(mockOnBackToStore).toHaveBeenCalledTimes(1);
    });
  });
});
