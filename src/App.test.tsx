import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import engine from './game/Engine';

// Mock canvas-related components that don't work well in JSDOM
vi.mock('./components/Game', () => ({
  default: () => <div data-testid="game-canvas">Game Canvas</div>,
}));

vi.mock('./components/TowerIcon', () => ({
  default: ({ type }: { type: string }) => (
    <div data-testid={`tower-icon-${type}`}>{type}</div>
  ),
}));

describe('App', () => {
  beforeEach(() => {
    // Reset engine state before each test
    engine.reset();
  });

  afterEach(() => {
    engine.reset();
  });

  describe('Game Flow: Menu to Tower Store', () => {
    it('should show MainMenu when game starts', () => {
      render(<App />);

      expect(screen.getByText('Space Towers')).toBeInTheDocument();
      expect(screen.getByText('Defend the station')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument();
    });

    it('should show Tower Store screen after clicking Start Game', async () => {
      render(<App />);

      // Verify we're on the main menu
      expect(screen.getByText('Space Towers')).toBeInTheDocument();

      // Click "Start Game"
      const startButton = screen.getByRole('button', { name: /start game/i });
      fireEvent.click(startButton);

      // Wait for Tower Store to appear
      await waitFor(() => {
        expect(screen.getByText('Select Your Towers')).toBeInTheDocument();
      });

      // Verify Tower Store elements are present
      expect(screen.getByText('Tower Store')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start battle/i })).toBeInTheDocument();
    });

    it('should transition to PLANNING phase after clicking Start Battle', async () => {
      render(<App />);

      // Click "Start Game" to go to Tower Store
      const startButton = screen.getByRole('button', { name: /start game/i });
      fireEvent.click(startButton);

      // Wait for Tower Store
      await waitFor(() => {
        expect(screen.getByText('Select Your Towers')).toBeInTheDocument();
      });

      // Click "Start Battle" to go to PLANNING
      const startBattleButton = screen.getByRole('button', { name: /start battle/i });
      fireEvent.click(startBattleButton);

      // Wait for game UI to appear (HUD should be visible in PLANNING phase)
      await waitFor(() => {
        expect(screen.getByTestId('game-canvas')).toBeInTheDocument();
      });

      // Main menu and Tower Store should no longer be visible
      expect(screen.queryByText('Space Towers')).not.toBeInTheDocument();
      expect(screen.queryByText('Select Your Towers')).not.toBeInTheDocument();
    });
  });
});
