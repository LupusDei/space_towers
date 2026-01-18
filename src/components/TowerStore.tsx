import { TowerType } from '../game/types';
import { TOWER_STATS } from '../game/config';
import { colors, spacing, typography } from '../styles/theme';
import TowerIcon from './TowerIcon';

interface TowerStoreProps {
  credits: number;
  waveCredits: number;
  selectedTowerType: TowerType | null;
  onSelectTowerType: (type: TowerType | null) => void;
  // Multi-selection mode for loadout selection
  selectedTowers?: TowerType[];
  onToggleTower?: (type: TowerType) => void;
  onConfirmSelection?: (towers: TowerType[]) => void;
}

const REQUIRED_LOADOUT_SIZE = 4;

const towerTypes = Object.values(TowerType) as TowerType[];

export default function TowerStore({
  credits,
  waveCredits,
  selectedTowerType,
  onSelectTowerType,
  selectedTowers = [],
  onToggleTower,
  onConfirmSelection,
}: TowerStoreProps) {
  // Determine if we're in loadout selection mode
  const isLoadoutMode = onConfirmSelection !== undefined;
  const canConfirm = selectedTowers.length === REQUIRED_LOADOUT_SIZE;

  const handleTowerClick = (type: TowerType) => {
    if (isLoadoutMode && onToggleTower) {
      onToggleTower(type);
    } else {
      const isSelected = selectedTowerType === type;
      onSelectTowerType(isSelected ? null : type);
    }
  };

  const handleConfirmClick = () => {
    if (onConfirmSelection && canConfirm) {
      onConfirmSelection(selectedTowers);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerSection}>
        <div style={styles.header}>Tower Store</div>
        <div style={styles.waveCredits}>Wave Credits: {waveCredits}</div>
        {isLoadoutMode && (
          <div style={styles.selectionCount}>
            Selected: {selectedTowers.length}/{REQUIRED_LOADOUT_SIZE}
          </div>
        )}
      </div>
      <div style={styles.grid}>
        {towerTypes.map((type) => {
          const stats = TOWER_STATS[type];
          const canAfford = credits >= stats.cost;
          const isSelected = isLoadoutMode
            ? selectedTowers.includes(type)
            : selectedTowerType === type;

          return (
            <button
              key={type}
              style={{
                ...styles.towerCell,
                ...(isSelected ? styles.towerCellSelected : {}),
                ...(canAfford ? {} : styles.towerCellDisabled),
              }}
              disabled={!canAfford}
              onClick={() => handleTowerClick(type)}
              aria-label={`${stats.name} - ${stats.cost} credits`}
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
      {isLoadoutMode && (
        <button
          style={{
            ...styles.confirmButton,
            ...(canConfirm ? {} : styles.confirmButtonDisabled),
          }}
          disabled={!canConfirm}
          onClick={handleConfirmClick}
          aria-label="Confirm Selection"
        >
          Confirm Selection
        </button>
      )}
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
  selectionCount: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.accent,
  },
  confirmButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${spacing.sm} ${spacing.md}`,
    marginTop: spacing.sm,
    backgroundColor: colors.accent,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.background,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    transition: 'all 0.15s ease',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.text.muted,
    cursor: 'not-allowed',
    opacity: 0.5,
  },
};
