import { GamePhase } from '../game/types';
import { colors, spacing, typography } from '../styles/theme';

interface EngageButtonProps {
  phase: GamePhase;
  onEngage: () => void;
}

const buttonStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: spacing.lg,
  left: '50%',
  transform: 'translateX(-50%)',
  padding: `${spacing.md} ${spacing.xl}`,
  fontSize: typography.fontSize.lg,
  fontFamily: typography.fontFamily.base,
  fontWeight: typography.fontWeight.bold,
  color: colors.background,
  backgroundColor: colors.accent,
  border: 'none',
  borderRadius: spacing.sm,
  cursor: 'pointer',
  textTransform: 'uppercase',
  letterSpacing: '2px',
  boxShadow: `0 0 20px ${colors.accent}40`,
  transition: 'all 0.2s ease',
};

export default function EngageButton({ phase, onEngage }: EngageButtonProps) {
  if (phase !== GamePhase.PLANNING) {
    return null;
  }

  return (
    <button
      style={buttonStyle}
      onClick={onEngage}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#33ffff';
        e.currentTarget.style.boxShadow = `0 0 30px ${colors.accent}80`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = colors.accent;
        e.currentTarget.style.boxShadow = `0 0 20px ${colors.accent}40`;
      }}
    >
      Start Wave
    </button>
  );
}
