import { useState, useEffect } from 'react';
import { eventBus } from '../game/events';
import { colors, spacing, typography } from '../styles/theme';

interface GameOverProps {
  onPlayAgain: () => void;
}

interface GameOverState {
  visible: boolean;
  victory: boolean;
  wavesSurvived: number;
  enemiesKilled: number;
}

export default function GameOver({ onPlayAgain }: GameOverProps) {
  const [state, setState] = useState<GameOverState>({
    visible: false,
    victory: false,
    wavesSurvived: 0,
    enemiesKilled: 0,
  });

  useEffect(() => {
    let enemyKillCount = 0;
    let currentWave = 1;

    const unsubEnemyKilled = eventBus.on('ENEMY_KILLED', () => {
      enemyKillCount++;
    });

    const unsubWaveStart = eventBus.on('WAVE_START', (event) => {
      currentWave = event.payload.wave;
    });

    const unsubGameOver = eventBus.on('GAME_OVER', (event) => {
      setState({
        visible: true,
        victory: event.payload.victory,
        wavesSurvived: currentWave,
        enemiesKilled: enemyKillCount,
      });
    });

    const unsubGameStart = eventBus.on('GAME_START', () => {
      enemyKillCount = 0;
      currentWave = 1;
      setState({
        visible: false,
        victory: false,
        wavesSurvived: 0,
        enemiesKilled: 0,
      });
    });

    return () => {
      unsubEnemyKilled();
      unsubWaveStart();
      unsubGameOver();
      unsubGameStart();
    };
  }, []);

  if (!state.visible) {
    return null;
  }

  const accentColor = state.victory ? colors.success : colors.danger;

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.container, borderColor: accentColor }}>
        <h1 style={{ ...styles.title, color: accentColor }}>
          {state.victory ? 'VICTORY' : 'DEFEAT'}
        </h1>

        <div style={styles.stats}>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Waves Survived</span>
            <span style={{ ...styles.statValue, color: accentColor }}>{state.wavesSurvived}</span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Enemies Killed</span>
            <span style={{ ...styles.statValue, color: accentColor }}>{state.enemiesKilled}</span>
          </div>
        </div>

        <button
          style={{ ...styles.button, borderColor: accentColor, color: accentColor }}
          onClick={onPlayAgain}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = accentColor;
            e.currentTarget.style.color = colors.background;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = accentColor;
          }}
        >
          Play Again
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 1000,
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xxl,
    backgroundColor: colors.background,
    border: '2px solid',
    borderRadius: '8px',
    minWidth: '300px',
  },
  title: {
    margin: 0,
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: '4px',
  },
  stats: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    width: '100%',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${spacing.sm} 0`,
    borderBottom: `1px solid ${colors.text.muted}`,
  },
  statLabel: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  statValue: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  button: {
    marginTop: spacing.md,
    padding: `${spacing.sm} ${spacing.xl}`,
    backgroundColor: 'transparent',
    border: '2px solid',
    borderRadius: '4px',
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: '2px',
    cursor: 'pointer',
    transition: 'background-color 0.2s, color 0.2s',
  },
};
