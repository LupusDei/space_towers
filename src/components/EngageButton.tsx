import { GamePhase } from '../game/types';
import { colors, spacing, typography } from '../styles/theme';

interface EngageButtonProps {
  phase: GamePhase;
  onEngage: () => void;
}

const baseButtonStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: spacing.lg,
  left: '50%',
  transform: 'translateX(-50%)',
  padding: `${spacing.md} ${spacing.xl}`,
  fontSize: typography.fontSize.lg,
  fontFamily: typography.fontFamily.base,
  fontWeight: typography.fontWeight.bold,
  border: 'none',
  borderRadius: spacing.sm,
  textTransform: 'uppercase',
  letterSpacing: '2px',
  transition: 'all 0.2s ease',
};

const enabledStyle: React.CSSProperties = {
  ...baseButtonStyle,
  color: colors.background,
  backgroundColor: colors.accent,
  cursor: 'pointer',
  boxShadow: `0 0 20px ${colors.accent}40`,
  opacity: 1,
};

const disabledStyle: React.CSSProperties = {
  ...baseButtonStyle,
  color: colors.text.muted,
  backgroundColor: '#444466',
  cursor: 'not-allowed',
  boxShadow: 'none',
  opacity: 0.5,
  pointerEvents: 'none',
};

export default function EngageButton({ phase, onEngage }: EngageButtonProps) {
  const isPlanning = phase === GamePhase.PLANNING;
  const isCombat = phase === GamePhase.COMBAT;

  // Only show during planning or combat phases
  if (!isPlanning && !isCombat) {
    return null;
  }

  const buttonText = isCombat ? 'Battle Commencing' : 'Start Wave';
  const style = isPlanning ? enabledStyle : disabledStyle;

  return (
    <button
      style={style}
      onClick={isPlanning ? onEngage : undefined}
      disabled={!isPlanning}
      onMouseEnter={(e) => {
        if (isPlanning) {
          e.currentTarget.style.backgroundColor = '#33ffff';
          e.currentTarget.style.boxShadow = `0 0 30px ${colors.accent}80`;
        }
      }}
      onMouseLeave={(e) => {
        if (isPlanning) {
          e.currentTarget.style.backgroundColor = colors.accent;
          e.currentTarget.style.boxShadow = `0 0 20px ${colors.accent}40`;
        }
      }}
    >
      {buttonText}
    </button>
  );
}
