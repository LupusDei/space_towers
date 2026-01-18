import { TowerType } from '../game/types';
import { TOWER_STATS, COMBAT_CONFIG } from '../game/config';
import { colors, spacing, typography } from '../styles/theme';
import TowerIcon from './TowerIcon';

function getSpecialEffect(type: TowerType): string | null {
  switch (type) {
    case TowerType.LASER:
      return 'Hitscan';
    case TowerType.MISSILE:
      return `Splash ${COMBAT_CONFIG.MISSILE_SPLASH_RADIUS}`;
    case TowerType.TESLA:
      return `Chain ×${COMBAT_CONFIG.TESLA_MAX_CHAIN}`;
    default:
      return null;
  }
}

export interface TowerCardProps {
  type: TowerType;
  locked?: boolean;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  /** Current wave credits available (required if locked) */
  waveCredits?: number;
  /** Callback when unlock button is clicked */
  onUnlock?: () => void;
}

export default function TowerCard({
  type,
  locked = false,
  selected = false,
  disabled = false,
  onClick,
  waveCredits = 0,
  onUnlock,
}: TowerCardProps) {
  const stats = TOWER_STATS[type];
  const dps = (stats.damage / stats.fireRate).toFixed(0);
  const special = getSpecialEffect(type);
  const isInteractive = !locked && !disabled && onClick;
  const canAfford = waveCredits >= stats.unlockCost;
  const showUnlockButton = locked && onUnlock;

  return (
    <div
      style={{
        ...styles.card,
        ...(selected ? styles.cardSelected : {}),
        ...(locked ? styles.cardLocked : {}),
        ...(disabled ? styles.cardDisabled : {}),
        ...(isInteractive ? styles.cardInteractive : {}),
      }}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <div style={styles.iconContainer}>
        <TowerIcon type={type} size={48} />
        {locked && !showUnlockButton && <div style={styles.lockOverlay}>🔒</div>}
      </div>

      <div style={styles.info}>
        <div style={styles.name}>{stats.name}</div>

        <div style={styles.statsRow}>
          <span style={styles.stat}>{stats.damage} dmg</span>
          <span style={styles.statSep}>·</span>
          <span style={styles.stat}>{stats.range} rng</span>
          <span style={styles.statSep}>·</span>
          <span style={styles.stat}>{stats.fireRate}s</span>
        </div>

        <div style={styles.statsRow}>
          <span style={styles.statDps}>{dps} DPS</span>
          {special && (
            <>
              <span style={styles.statSep}>·</span>
              <span style={styles.statSpecial}>{special}</span>
            </>
          )}
        </div>
      </div>

      <div style={styles.cost}>
        <span style={styles.costValue}>${stats.cost}</span>
      </div>

      {showUnlockButton && (
        <button
          style={{
            ...styles.unlockButton,
            ...(canAfford ? styles.unlockButtonAfford : styles.unlockButtonCantAfford),
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (canAfford) {
              onUnlock();
            }
          }}
          disabled={!canAfford}
          title={canAfford ? `Unlock for ${stats.unlockCost} credits` : 'Not enough credits'}
          aria-label={canAfford ? `Unlock for ${stats.unlockCost} credits` : `Unlock (${stats.unlockCost} credits needed)`}
        >
          <span style={styles.unlockIcon}>🔓</span>
          <span style={styles.unlockCost}>{stats.unlockCost}</span>
        </button>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: `1px solid ${colors.accent}44`,
    borderRadius: '6px',
    fontFamily: typography.fontFamily.base,
    minHeight: '64px',
  },
  cardSelected: {
    backgroundColor: `${colors.accent}22`,
    borderColor: colors.accent,
    boxShadow: `0 0 8px ${colors.accent}44`,
  },
  cardLocked: {
    opacity: 0.5,
    filter: 'grayscale(0.5)',
  },
  cardDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  cardInteractive: {
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  iconContainer: {
    position: 'relative',
    flexShrink: 0,
    width: '48px',
    height: '48px',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: '4px',
    fontSize: typography.fontSize.lg,
  },
  info: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  name: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  statsRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '4px',
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.mono,
  },
  stat: {
    whiteSpace: 'nowrap',
  },
  statSep: {
    color: colors.text.muted,
  },
  statDps: {
    color: colors.success,
    fontWeight: typography.fontWeight.medium,
  },
  statSpecial: {
    color: colors.accent,
    fontStyle: 'italic',
  },
  cost: {
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  costValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.credits,
    fontFamily: typography.fontFamily.mono,
  },
  unlockButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: `${spacing.xs} ${spacing.sm}`,
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    transition: 'all 0.15s ease',
    flexShrink: 0,
  },
  unlockButtonAfford: {
    backgroundColor: colors.success,
    color: colors.background,
  },
  unlockButtonCantAfford: {
    backgroundColor: colors.text.muted,
    color: colors.text.secondary,
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  unlockIcon: {
    fontSize: typography.fontSize.md,
  },
  unlockCost: {
    fontWeight: typography.fontWeight.bold,
  },
};
