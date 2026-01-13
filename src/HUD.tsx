import { useState, useEffect } from 'react';
import { eventBus } from './events';
import { GamePhase } from './types';
import { GAME_CONFIG } from './config';
import { colors, spacing, typography } from './theme';

interface HUDState {
  credits: number;
  lives: number;
  wave: number;
  phase: GamePhase;
}

export default function HUD() {
  const [state, setState] = useState<HUDState>({
    credits: GAME_CONFIG.STARTING_CREDITS,
    lives: GAME_CONFIG.STARTING_LIVES,
    wave: 1,
    phase: GamePhase.PLANNING,
  });

  useEffect(() => {
    const unsubCredits = eventBus.on('CREDITS_CHANGED', (event) => {
      setState((prev) => ({ ...prev, credits: event.payload.newTotal }));
    });

    const unsubLives = eventBus.on('LIVES_CHANGED', (event) => {
      setState((prev) => ({ ...prev, lives: event.payload.newTotal }));
    });

    const unsubWave = eventBus.on('WAVE_START', (event) => {
      setState((prev) => ({ ...prev, wave: event.payload.wave }));
    });

    const unsubPhase = eventBus.on('PHASE_CHANGE', (event) => {
      setState((prev) => ({ ...prev, phase: event.payload.to }));
    });

    return () => {
      unsubCredits();
      unsubLives();
      unsubWave();
      unsubPhase();
    };
  }, []);

  const getPhaseDisplay = (): string => {
    switch (state.phase) {
      case GamePhase.PLANNING:
        return 'Building';
      case GamePhase.COMBAT:
        return `Wave ${state.wave}`;
      case GamePhase.PAUSED:
        return 'Paused';
      case GamePhase.VICTORY:
        return 'Victory!';
      case GamePhase.DEFEAT:
        return 'Defeat';
      case GamePhase.MENU:
        return 'Menu';
      default:
        return '';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.stat}>
        <span style={styles.creditsLabel}>Credits:</span>
        <span style={styles.creditsValue}>{state.credits}</span>
      </div>
      <div style={styles.stat}>
        <span style={styles.livesLabel}>Lives:</span>
        <span style={styles.livesValue}>{state.lives}</span>
      </div>
      <div style={styles.stat}>
        <span style={styles.waveLabel}>Wave:</span>
        <span style={styles.waveValue}>{state.wave}</span>
      </div>
      <div style={styles.phaseIndicator}>
        {getPhaseDisplay()}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.lg,
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: '4px',
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.md,
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
  },
  creditsLabel: {
    color: colors.text.secondary,
  },
  creditsValue: {
    color: colors.credits,
    fontWeight: typography.fontWeight.bold,
  },
  livesLabel: {
    color: colors.text.secondary,
  },
  livesValue: {
    color: colors.danger,
    fontWeight: typography.fontWeight.bold,
  },
  waveLabel: {
    color: colors.text.secondary,
  },
  waveValue: {
    color: colors.accent,
    fontWeight: typography.fontWeight.bold,
  },
  phaseIndicator: {
    marginLeft: 'auto',
    padding: `${spacing.xs} ${spacing.sm}`,
    backgroundColor: 'rgba(0, 255, 255, 0.15)',
    border: `1px solid ${colors.accent}`,
    borderRadius: '4px',
    color: colors.accent,
    fontWeight: typography.fontWeight.medium,
  },
};
