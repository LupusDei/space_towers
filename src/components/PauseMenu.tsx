import { useState, useEffect } from 'react';
import { eventBus } from '../game/events';
import { GamePhase } from '../game/types';
import { colors, spacing, typography } from '../styles/theme';

interface PauseMenuProps {
  onResume: () => void;
  onBackToStore: () => void;
}

export default function PauseMenu({ onResume, onBackToStore }: PauseMenuProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsubPhase = eventBus.on('PHASE_CHANGE', (event) => {
      setVisible(event.payload.to === GamePhase.PAUSED);
    });

    return () => {
      unsubPhase();
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <h1 style={styles.title}>PAUSED</h1>

        <div style={styles.buttonGroup}>
          <button
            style={styles.button}
            onClick={onResume}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.accent;
              e.currentTarget.style.color = colors.background;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.accent;
            }}
          >
            Resume
          </button>

          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={onBackToStore}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.text.secondary;
              e.currentTarget.style.color = colors.background;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.text.secondary;
            }}
          >
            Back to Store
          </button>
        </div>

        <p style={styles.hint}>Press ESC to resume</p>
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
    border: `2px solid ${colors.accent}`,
    borderRadius: '8px',
    minWidth: '280px',
  },
  title: {
    margin: 0,
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: '4px',
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    width: '100%',
  },
  button: {
    padding: `${spacing.sm} ${spacing.xl}`,
    backgroundColor: 'transparent',
    border: `2px solid ${colors.accent}`,
    borderRadius: '4px',
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: '2px',
    cursor: 'pointer',
    transition: 'background-color 0.2s, color 0.2s',
  },
  secondaryButton: {
    borderColor: colors.text.secondary,
    color: colors.text.secondary,
  },
  hint: {
    margin: 0,
    marginTop: spacing.sm,
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    fontStyle: 'italic',
  },
};
