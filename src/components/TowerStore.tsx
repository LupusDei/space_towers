import { TowerType } from '../game/types';
import { TOWER_STATS } from '../game/config';
import { colors, spacing, typography } from '../styles/theme';
import TowerIcon from './TowerIcon';

interface TowerStoreProps {
  credits: number;
  waveCredits: number;
  selectedTowerTypes: TowerType[];
  onToggleTowerType: (type: TowerType) => void;
}

const MAX_SELECTIONS = 4;

const towerTypes = Object.values(TowerType) as TowerType[];

export default function TowerStore({
  credits,
  waveCredits,
  selectedTowerTypes,
  onToggleTowerType,
}: TowerStoreProps) {
  const selectionCount = selectedTowerTypes.length;
  const isMaxSelected = selectionCount >= MAX_SELECTIONS;

  return (
    <div style={styles.container}>
      <div style={styles.headerSection}>
        <div style={styles.header}>Tower Store</div>
        <div style={styles.waveCredits}>Wave Credits: {waveCredits}</div>
        <div style={{
          ...styles.selectionCounter,
          color: selectionCount === MAX_SELECTIONS ? colors.success : colors.text.secondary,
        }}>
          Selected: {selectionCount}/{MAX_SELECTIONS}
        </div>
      </div>
      <div style={styles.grid}>
        {towerTypes.map((type) => {
          const stats = TOWER_STATS[type];
          const canAfford = credits >= stats.cost;
          const isSelected = selectedTowerTypes.includes(type);
          const isDisabled = !canAfford || (!isSelected && isMaxSelected);

          return (
            <button
              key={type}
              style={{
                ...styles.towerCell,
                ...(isSelected ? styles.towerCellSelected : {}),
                ...(isDisabled ? styles.towerCellDisabled : {}),
              }}
              disabled={isDisabled}
              onClick={() => onToggleTowerType(type)}
              aria-label={`${stats.name} - ${stats.cost} credits${isSelected ? ' (selected)' : ''}`}
            >
              <div style={styles.iconContainer}>
                <TowerIcon type={type} size={48} />
              </div>
              <div style={styles.towerName}>{stats.name}</div>
              <div style={styles.towerCost}>${stats.cost}</div>
            </button>
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
  selectionCounter: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
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
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '56px',
    height: '56px',
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
};
