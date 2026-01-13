import { useState, useEffect } from 'react';
import { eventBus } from './events';
import { GamePhase } from './types';
import { GAME_CONFIG } from './config';
import styles from './HUD.module.css';

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
    <div className={styles.container}>
      <div className={styles.stat}>
        <span className={styles.creditsLabel}>Credits:</span>
        <span className={styles.creditsValue}>{state.credits}</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.livesLabel}>Lives:</span>
        <span className={styles.livesValue}>{state.lives}</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.waveLabel}>Wave:</span>
        <span className={styles.waveValue}>{state.wave}</span>
      </div>
      <div className={styles.phaseIndicator}>
        {getPhaseDisplay()}
      </div>
    </div>
  );
}
