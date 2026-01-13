import Button from './Button';
import { colors, spacing, typography } from './theme';

interface MainMenuProps {
  onStartGame: () => void;
}

export default function MainMenu({ onStartGame }: MainMenuProps) {
  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <h1 style={styles.title}>Space Towers</h1>
        <p style={styles.subtitle}>Defend the station</p>
        <Button size="large" onClick={onStartGame}>
          Start Game
        </Button>
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
    backgroundColor: colors.background,
    zIndex: 1000,
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xxl,
  },
  title: {
    margin: 0,
    fontFamily: typography.fontFamily.mono,
    fontSize: '48px',
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: '8px',
    color: colors.accent,
    textShadow: `
      0 0 10px ${colors.accent},
      0 0 20px ${colors.accent},
      0 0 40px rgba(0, 255, 255, 0.5),
      0 0 80px rgba(0, 255, 255, 0.3)
    `,
  },
  subtitle: {
    margin: 0,
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    letterSpacing: '2px',
    marginBottom: spacing.lg,
  },
};
