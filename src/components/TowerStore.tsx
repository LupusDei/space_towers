import { TowerType } from '../game/types';
import { TOWER_STATS } from '../game/config';
import { colors, spacing, typography } from '../styles/theme';
import TowerIcon from './TowerIcon';

interface TowerStoreProps {
  credits: number;
  waveCredits?: number;
  selectedTowerType: TowerType | null;
  onSelectTowerType: (type: TowerType | null) => void;
  /** Array of tower types the player has unlocked. Locked towers cannot be selected. */
  unlockedTowers: TowerType[];
  /** Callback when player attempts to unlock a tower */
  onUnlockTower?: (type: TowerType) => void;
}

const towerTypes = Object.values(TowerType) as TowerType[];

export default function TowerStore({
  credits,
  waveCredits = 0,
  selectedTowerType,
  onSelectTowerType,
  unlockedTowers,
  onUnlockTower,
}: TowerStoreProps) {
  return (
    <div style={styles.container}>
      <div style={styles.headerSection}>
        <div style={styles.header}>Tower Store</div>
        <div style={styles.waveCredits}>Wave Credits: {waveCredits}</div>
      </div>
      <div style={styles.grid}>
        {towerTypes.map((type) => {
          const stats = TOWER_STATS[type];
          const isUnlocked = unlockedTowers.includes(type);
          const canAfford = credits >= stats.cost;
          const canAffordUnlock = waveCredits >= stats.unlockCost;
          const isSelected = selectedTowerType === type;
          const isDisabled = !isUnlocked || !canAfford;

          return (
            <div key={type} style={styles.towerCellWrapper}>
              <button
                style={{
                  ...styles.towerCell,
                  ...(isSelected ? styles.towerCellSelected : {}),
                  ...(isDisabled ? styles.towerCellDisabled : {}),
                  ...(isUnlocked ? {} : styles.towerCellLocked),
                }}
                disabled={isDisabled}
                onClick={() => onSelectTowerType(isSelected ? null : type)}
                aria-label={
                  isUnlocked
                    ? `${stats.name} - ${stats.cost} credits`
                    : `${stats.name} - Locked (${stats.unlockCost} wave credits to unlock)`
                }
              >
                <div style={styles.iconContainer}>
                  <TowerIcon type={type} size={48} />
                  {!isUnlocked && <div style={styles.lockOverlay}>🔒</div>}
                </div>
                <div style={styles.towerName}>{stats.name}</div>
                {isUnlocked ? (
                  <div style={styles.towerCost}>${stats.cost}</div>
                ) : (
                  <div style={styles.unlockCostDisplay}>
                    <span style={styles.unlockLabel}>UNLOCK</span>
                    <span style={styles.unlockCostValue}>{stats.unlockCost}</span>
                  </div>
                )}
              </button>
              {!isUnlocked && onUnlockTower && (
                <button
                  style={{
                    ...styles.unlockButton,
                    ...(canAffordUnlock ? styles.unlockButtonAfford : styles.unlockButtonCantAfford),
                  }}
                  disabled={!canAffordUnlock}
                  onClick={() => onUnlockTower(type)}
                  aria-label={
                    canAffordUnlock
                      ? `Unlock ${stats.name} for ${stats.unlockCost} wave credits`
                      : `Cannot unlock ${stats.name} - need ${stats.unlockCost} wave credits`
                  }
                >
                  🔓 {stats.unlockCost}
                </button>
              )}
            </div>
          );
        })}
        {/* Empty cells for future towers (grid expands as needed) */}
        {Array.from({ length: Math.max(0, 12 - towerTypes.length) }).map((_, index) => (
          <div key={`empty-${index}`} style={styles.emptyCell}>
            <div style={styles.emptyIcon}>?</div>
            <div style={styles.emptyLabel}>Coming Soon</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: 'rgba(10, 10, 26, 0.95)',
    borderRadius: '8px',
    border: `1px solid ${colors.accent}33`,
  },
  headerSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.xs,
  },
  header: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: '2px',
    textAlign: 'center',
  },
  waveCredits: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.credits,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gridTemplateRows: 'repeat(2, 1fr)',
    gap: spacing.sm,
  },
  towerCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: `1px solid ${colors.accent}44`,
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: typography.fontFamily.base,
    minWidth: '80px',
    minHeight: '100px',
  },
  towerCellSelected: {
    backgroundColor: `${colors.accent}22`,
    borderColor: colors.accent,
    boxShadow: `0 0 12px ${colors.accent}44`,
  },
  towerCellDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
    borderColor: colors.text.muted,
  },
  towerCellLocked: {
    filter: 'grayscale(0.5)',
  },
  towerCellWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  iconContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '56px',
    height: '56px',
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
  towerName: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
  },
  towerCost: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.mono,
    color: colors.credits,
  },
  emptyCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: `1px dashed ${colors.text.muted}`,
    borderRadius: '6px',
    minWidth: '80px',
    minHeight: '100px',
  },
  emptyIcon: {
    fontSize: typography.fontSize.xl,
    color: colors.text.muted,
    fontFamily: typography.fontFamily.mono,
  },
  emptyLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    fontStyle: 'italic',
  },
  unlockCostDisplay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  unlockLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  unlockCostValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.mono,
    color: colors.accent,
  },
  unlockButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: `${spacing.xs} ${spacing.sm}`,
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    transition: 'all 0.15s ease',
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
};
