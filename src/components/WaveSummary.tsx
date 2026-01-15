import { useState, useEffect, useRef } from 'react';
import { eventBus } from '../game/events';
import { GamePhase } from '../game/types';
import styles from '../styles/WaveSummary.module.css';

interface WaveSummaryProps {
  phase: GamePhase;
}

interface WaveSummaryData {
  waveNumber: number;
  killEarnings: number;
  waveBonus: number;
  total: number;
}

export default function WaveSummary({ phase }: WaveSummaryProps) {
  const [summary, setSummary] = useState<WaveSummaryData | null>(null);
  const [visible, setVisible] = useState(false);
  const killEarningsRef = useRef(0);

  useEffect(() => {
    // Reset kill earnings when entering combat phase
    if (phase === GamePhase.COMBAT) {
      killEarningsRef.current = 0;
    }
  }, [phase]);

  useEffect(() => {
    // Track kill earnings during combat
    const unsubKill = eventBus.on('ENEMY_KILLED', (event) => {
      killEarningsRef.current += event.payload.reward;
    });

    // Show summary when wave completes
    const unsubWaveComplete = eventBus.on('WAVE_COMPLETE', (event) => {
      const killEarnings = killEarningsRef.current;
      const waveBonus = event.payload.reward;

      setSummary({
        waveNumber: event.payload.wave,
        killEarnings,
        waveBonus,
        total: killEarnings + waveBonus,
      });
      setVisible(true);

      // Auto-hide after 3 seconds
      setTimeout(() => {
        setVisible(false);
      }, 3000);
    });

    return () => {
      unsubKill();
      unsubWaveComplete();
    };
  }, []);

  if (!visible || !summary) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>Wave {summary.waveNumber} Complete!</div>
      <div className={styles.breakdown}>
        <span className={styles.kills}>Kills: ${summary.killEarnings}</span>
        <span className={styles.separator}>+</span>
        <span className={styles.bonus}>Wave Bonus: ${summary.waveBonus}</span>
        <span className={styles.separator}>=</span>
        <span className={styles.total}>Total: ${summary.total}</span>
      </div>
    </div>
  );
}
