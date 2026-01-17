import { useState, useEffect } from 'react';
import { eventBus } from '../game/events';
import { GamePhase, EnemyType, type WaveDefinition } from '../game/types';
import { getWaveDefinition } from '../data/waves';
import { aggregateEnemies, isBossWave, getEnemyIcon, formatSpeed } from '../utils/wavePreview';
import styles from '../styles/WavePreview.module.css';

interface WavePreviewProps {
  wave: number;
  phase: GamePhase;
}

export default function WavePreview({ wave, phase }: WavePreviewProps) {
  const [nextWave, setNextWave] = useState<WaveDefinition | null>(null);

  useEffect(() => {
    // Calculate the wave to preview based on current state
    const updatePreview = () => {
      // During planning, show the upcoming wave
      if (phase === GamePhase.PLANNING) {
        setNextWave(getWaveDefinition(wave));
      }
    };

    updatePreview();

    const unsubPhase = eventBus.on('PHASE_CHANGE', (event) => {
      if (event.payload.to === GamePhase.PLANNING) {
        // When entering planning, show the next wave
        setNextWave(getWaveDefinition(wave));
      }
    });

    const unsubWaveComplete = eventBus.on('WAVE_COMPLETE', () => {
      // Wave complete - next planning phase will show updated wave
    });

    return () => {
      unsubPhase();
      unsubWaveComplete();
    };
  }, [wave, phase]);

  // Only show during planning phase
  if (phase !== GamePhase.PLANNING || !nextWave) {
    return null;
  }

  const enemies = aggregateEnemies(nextWave);
  const hasBoss = isBossWave(nextWave);
  const totalEnemies = enemies.reduce((sum, e) => sum + e.count, 0);

  return (
    <div className={`${styles.container} ${hasBoss ? styles.bossWave : ''}`}>
      <div className={styles.header}>
        <span className={styles.title}>Incoming Wave {nextWave.waveNumber}</span>
        {hasBoss && <span className={styles.bossIndicator}>BOSS</span>}
      </div>

      <div className={styles.enemyList}>
        {enemies.map((enemy) => (
          <div
            key={enemy.type}
            className={`${styles.enemyRow} ${enemy.type === EnemyType.BOSS ? styles.bossEnemy : ''}`}
          >
            <div className={styles.enemyMainLine}>
              <span className={styles.enemyIcon}>{getEnemyIcon(enemy.type)}</span>
              <span className={styles.enemyName}>{enemy.name}</span>
              <span className={styles.enemyCount}>x{enemy.count}</span>
            </div>
            <div className={styles.enemyStats}>
              {enemy.hp}hp • {enemy.armor}arm • {formatSpeed(enemy.speed)}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <span className={styles.totalLabel}>Total:</span>
        <span className={styles.totalCount}>{totalEnemies}</span>
      </div>
    </div>
  );
}
