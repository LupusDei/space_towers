import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EngageButton from './EngageButton';
import { GamePhase } from '../game/types';

describe('EngageButton', () => {
  beforeEach(() => {
    // Clean up any injected styles between tests
    const existingStyle = document.getElementById('engage-button-animations');
    if (existingStyle) {
      existingStyle.remove();
    }
  });

  describe('rendering', () => {
    it('should render "Start Wave" text during planning phase', () => {
      render(<EngageButton phase={GamePhase.PLANNING} onEngage={() => {}} />);
      expect(screen.getByText('▶ Start Wave')).toBeInTheDocument();
    });

    it('should render "Battle Commencing" text during combat phase', () => {
      render(<EngageButton phase={GamePhase.COMBAT} onEngage={() => {}} />);
      expect(screen.getByText('⚔ Battle Commencing ⚔')).toBeInTheDocument();
    });

    it('should not render during menu phase', () => {
      const { container } = render(<EngageButton phase={GamePhase.MENU} onEngage={() => {}} />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render during defeat phase', () => {
      const { container } = render(<EngageButton phase={GamePhase.DEFEAT} onEngage={() => {}} />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render during victory phase', () => {
      const { container } = render(<EngageButton phase={GamePhase.VICTORY} onEngage={() => {}} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('button text centering', () => {
    it('should have centered text during planning phase', () => {
      render(<EngageButton phase={GamePhase.PLANNING} onEngage={() => {}} />);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ textAlign: 'center' });
    });

    it('should have centered text during combat phase', () => {
      render(<EngageButton phase={GamePhase.COMBAT} onEngage={() => {}} />);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ textAlign: 'center' });
    });
  });

  describe('button state', () => {
    it('should be enabled during planning phase', () => {
      render(<EngageButton phase={GamePhase.PLANNING} onEngage={() => {}} />);
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('should be disabled during combat phase', () => {
      render(<EngageButton phase={GamePhase.COMBAT} onEngage={() => {}} />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('click behavior', () => {
    it('should call onEngage when clicked during planning phase', () => {
      const onEngage = vi.fn();
      render(<EngageButton phase={GamePhase.PLANNING} onEngage={onEngage} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(onEngage).toHaveBeenCalledTimes(1);
    });

    it('should not call onEngage when clicked during combat phase', () => {
      const onEngage = vi.fn();
      render(<EngageButton phase={GamePhase.COMBAT} onEngage={onEngage} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(onEngage).not.toHaveBeenCalled();
    });
  });
});
