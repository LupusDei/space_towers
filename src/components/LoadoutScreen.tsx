import Button from './Button';
import TowerStore from './TowerStore';
import { TowerType } from '../game/types';
import { colors, spacing, typography } from '../styles/theme';

interface LoadoutScreenProps {
  credits: number;
  selectedTowerType: TowerType | null;
  onSelectTowerType: (type: TowerType | null) => void;
  onStartGame: () => void;
}

export default function LoadoutScreen({
  credits,
  selectedTowerType,
  onSelectTowerType,
  onStartGame,
}: LoadoutScreenProps) {
  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <h1 style={styles.title}>Tower Loadout</h1>
        <p style={styles.subtitle}>Select towers for battle</p>
        <TowerStore
          credits={credits}
          selectedTowerType={selectedTowerType}
          onSelectTowerType={onSelectTowerType}
        />
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
    fontSize: '36px',
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: '4px',
    color: colors.accent,
    textShadow: `
      0 0 10px ${colors.accent},
      0 0 20px ${colors.accent},
      0 0 40px rgba(0, 255, 255, 0.5)
    `,
  },
  subtitle: {
    margin: 0,
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    letterSpacing: '2px',
    marginBottom: spacing.md,
  },
};
