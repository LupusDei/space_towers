import { TowerType, type Tower } from '../game/types';
import { TOWER_STATS, GAME_CONFIG } from '../game/config';
import { colors, spacing, typography } from '../styles/theme';
import TowerIcon from './TowerIcon';

interface TowerPanelProps {
  credits: number;
  selectedTowerType: TowerType | null;
  selectedTower: Tower | null;
  onSelectTowerType: (type: TowerType | null) => void;
  onSellTower: () => void;
}

const towerTypes = Object.values(TowerType) as TowerType[];

export default function TowerPanel({
  credits,
  selectedTowerType,
  selectedTower,
  onSelectTowerType,
  onSellTower,
}: TowerPanelProps) {
  const getRefundAmount = (tower: Tower): number => {
    const stats = TOWER_STATS[tower.type];
    return Math.floor(stats.cost * GAME_CONFIG.SELL_REFUND_PERCENT);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>Towers</div>
      <div style={styles.towerGrid}>
        {towerTypes.map((type) => {
          const stats = TOWER_STATS[type];
          const canAfford = credits >= stats.cost;
          const isSelected = selectedTowerType === type;

          return (
            <button
              key={type}
              style={{
                ...styles.towerButton,
                ...(isSelected ? styles.towerButtonSelected : {}),
                ...(canAfford ? {} : styles.towerButtonDisabled),
              }}
              disabled={!canAfford}
              onClick={() => onSelectTowerType(isSelected ? null : type)}
            >
              <div style={styles.iconContainer}>
                <TowerIcon type={type} size={36} />
              </div>
              <div style={styles.towerName}>{stats.name}</div>
              <div style={styles.towerCost}>
                <span style={styles.creditIcon}>$</span>
                {stats.cost}
              </div>
            </button>
          );
        })}
      </div>

      {selectedTower && (
        <div style={styles.sellSection}>
          <div style={styles.sellHeader}>Selected Tower</div>
          <div style={styles.selectedTowerInfo}>
            {TOWER_STATS[selectedTower.type].name} (Lv.{selectedTower.level})
          </div>
          <button style={styles.sellButton} onClick={onSellTower}>
            Sell for ${getRefundAmount(selectedTower)}
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: 'rgba(10, 10, 26, 0.9)',
    borderRadius: '8px',
    border: `1px solid ${colors.accent}33`,
  },
  header: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: '2px',
  },
  towerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: spacing.sm,
  },
  towerButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: `1px solid ${colors.accent}66`,
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: typography.fontFamily.base,
  },
  towerButtonSelected: {
    backgroundColor: `${colors.accent}22`,
    borderColor: colors.accent,
    boxShadow: `0 0 12px ${colors.accent}44`,
  },
  towerButtonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
    borderColor: colors.text.muted,
  },
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  towerName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  towerCost: {
    fontSize: typography.fontSize.xs,
    color: colors.credits,
    fontFamily: typography.fontFamily.mono,
  },
  creditIcon: {
    marginRight: '2px',
  },
  sellSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTop: `1px solid ${colors.text.muted}`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  sellHeader: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  selectedTowerInfo: {
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  sellButton: {
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: colors.danger,
    border: 'none',
    borderRadius: '6px',
    color: colors.text.primary,
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
};
