import { useEffect, useRef } from 'react';
import { GamePhase } from '../game/types';
import { colors, spacing, typography } from '../styles/theme';

interface EngageButtonProps {
  phase: GamePhase;
  onEngage: () => void;
}

// Inject keyframe animations
const styleId = 'engage-button-animations';
const keyframes = `
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 20px ${colors.accent}60, 0 0 40px ${colors.accent}30, inset 0 0 20px ${colors.accent}20;
  }
  50% {
    box-shadow: 0 0 30px ${colors.accent}90, 0 0 60px ${colors.accent}50, inset 0 0 30px ${colors.accent}30;
  }
}

@keyframes battle-pulse {
  0%, 100% {
    opacity: 0.6;
    background-position: 0% 50%;
  }
  50% {
    opacity: 0.8;
    background-position: 100% 50%;
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
`;

function injectStyles() {
  if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = keyframes;
    document.head.appendChild(styleEl);
  }
}

const baseButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: `${spacing.md} ${spacing.xl}`,
  fontSize: typography.fontSize.lg,
  fontFamily: typography.fontFamily.mono,
  fontWeight: typography.fontWeight.bold,
  border: '2px solid',
  borderRadius: '8px',
  textTransform: 'uppercase',
  letterSpacing: '3px',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
};

const enabledStyle: React.CSSProperties = {
  ...baseButtonStyle,
  color: colors.background,
  background: `linear-gradient(135deg, ${colors.accent} 0%, #00cccc 50%, ${colors.accent} 100%)`,
  backgroundSize: '200% 200%',
  borderColor: colors.accent,
  cursor: 'pointer',
  animation: 'pulse-glow 2s ease-in-out infinite',
  textShadow: `0 0 10px ${colors.background}`,
};

const disabledStyle: React.CSSProperties = {
  ...baseButtonStyle,
  color: colors.text.muted,
  background: `linear-gradient(90deg, #2a2a4a 0%, #3a3a5a 50%, #2a2a4a 100%)`,
  backgroundSize: '200% 100%',
  borderColor: '#555577',
  cursor: 'not-allowed',
  pointerEvents: 'none',
  animation: 'battle-pulse 1.5s ease-in-out infinite',
};

export default function EngageButton({ phase, onEngage }: EngageButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isPlanning = phase === GamePhase.PLANNING;
  const isCombat = phase === GamePhase.COMBAT;

  useEffect(() => {
    injectStyles();
  }, []);

  // Only show during planning or combat phases
  if (!isPlanning && !isCombat) {
    return null;
  }

  const buttonText = isCombat ? '⚔ Battle Commencing ⚔' : '▶ Start Wave';
  const style = isPlanning ? enabledStyle : disabledStyle;

  return (
    <button
      ref={buttonRef}
      style={style}
      onClick={isPlanning ? onEngage : undefined}
      disabled={!isPlanning}
      onMouseEnter={(e) => {
        if (isPlanning) {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.background = `linear-gradient(135deg, #33ffff 0%, ${colors.accent} 50%, #33ffff 100%)`;
          e.currentTarget.style.boxShadow = `0 0 40px ${colors.accent}, 0 0 80px ${colors.accent}60, inset 0 0 40px ${colors.accent}40`;
          e.currentTarget.style.borderColor = '#66ffff';
        }
      }}
      onMouseLeave={(e) => {
        if (isPlanning) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.background = `linear-gradient(135deg, ${colors.accent} 0%, #00cccc 50%, ${colors.accent} 100%)`;
          e.currentTarget.style.boxShadow = '';
          e.currentTarget.style.borderColor = colors.accent;
        }
      }}
      onMouseDown={(e) => {
        if (isPlanning) {
          e.currentTarget.style.transform = 'scale(0.98)';
        }
      }}
      onMouseUp={(e) => {
        if (isPlanning) {
          e.currentTarget.style.transform = 'scale(1.02)';
        }
      }}
    >
      {buttonText}
    </button>
  );
}
