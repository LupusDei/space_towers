import { useState, useEffect, useCallback } from 'react';
import { TowerType, type Tower } from '../game/types';
import { TOWER_STATS, GAME_CONFIG, COMBAT_CONFIG } from '../game/config';

function getSpecialEffect(type: TowerType): string | null {
  switch (type) {
    case TowerType.LASER:
      return 'Hitscan';
    case TowerType.MISSILE:
      return `Splash ${COMBAT_CONFIG.MISSILE_SPLASH_RADIUS}`;
    case TowerType.TESLA:
      return `Chain ×${COMBAT_CONFIG.TESLA_MAX_CHAIN}`;
    case TowerType.GRAVITY:
      return `Slow ${COMBAT_CONFIG.GRAVITY_SLOW_DURATION}s`;
    default:
      return null;
  }
}
import { eventBus } from '../game/events';
import { colors, spacing, typography } from '../styles/theme';
import TowerIcon from './TowerIcon';
import TowerTooltip from './TowerTooltip';

interface TowerPanelProps {
  credits: number;
  selectedTowerType: TowerType | null;
  selectedTower: Tower | null;
  onSelectTowerType: (type: TowerType | null) => void;
  onSellTower: () => void;
  /** Optional list of towers to display (loadout). If not provided, shows all towers. */
  selectedTowers?: TowerType[];
}

const allTowerTypes = Object.values(TowerType) as TowerType[];

export default function TowerPanel({
  credits: initialCredits,
  selectedTowerType,
  selectedTower,
  onSelectTowerType,
  onSellTower,
  selectedTowers,
}: TowerPanelProps) {
  // Filter to only show selected towers if a loadout is provided
  const towerTypes = selectedTowers && selectedTowers.length > 0
    ? selectedTowers
    : allTowerTypes;
  // Subscribe directly to credits changes for immediate updates
  const [credits, setCredits] = useState(initialCredits);
  const [hoveredTower, setHoveredTower] = useState<TowerType | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Sync with prop when it changes (e.g., on game restart)
    setCredits(initialCredits);
  }, [initialCredits]);

  useEffect(() => {
    const unsubscribe = eventBus.on('CREDITS_CHANGED', (event) => {
      setCredits(event.payload.newTotal);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleMouseEnter = useCallback((type: TowerType, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    // Position tooltip to the right of the hovered element
    setTooltipPosition({
      x: rect.right + 8,
      y: rect.top,
    });
    setHoveredTower(type);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredTower(null);
  }, []);

  const getRefundAmount = (tower: Tower): number => {
    const stats = TOWER_STATS[tower.type];
    return Math.floor(stats.cost * GAME_CONFIG.SELL_REFUND_PERCENT);
  };

  return (
    <div style={styles.container}>
      <div style={styles.creditsDisplay}>
        <span style={styles.creditsLabel}>Credits</span>
        <span style={styles.creditsValue}>${credits}</span>
      </div>
      <div style={styles.header}>Towers</div>
      <div style={styles.towerList}>
        {towerTypes.map((type) => {
          const stats = TOWER_STATS[type];
          const canAfford = credits >= stats.cost;
          const isSelected = selectedTowerType === type;
          const dps = (stats.damage / stats.fireRate).toFixed(0);
          const special = getSpecialEffect(type);

          return (
            <button
              key={type}
              style={{
                ...styles.towerRow,
                ...(isSelected ? styles.towerRowSelected : {}),
                ...(canAfford ? {} : styles.towerRowDisabled),
              }}
              disabled={!canAfford}
              onClick={() => onSelectTowerType(isSelected ? null : type)}
              onMouseEnter={(e) => handleMouseEnter(type, e)}
              onMouseLeave={handleMouseLeave}
            >
              <div style={styles.rowIcon}>
                <TowerIcon type={type} size={28} />
              </div>
              <div style={styles.rowInfo}>
                <div style={styles.rowName}>{stats.name}</div>
                <div style={styles.rowStats}>
                  <span style={styles.stat}>{stats.damage}dmg</span>
                  <span style={styles.statSep}>·</span>
                  <span style={styles.stat}>{dps}dps</span>
                  <span style={styles.statSep}>·</span>
                  <span style={styles.stat}>{stats.range}rng</span>
                  {special && (
                    <>
                      <span style={styles.statSep}>·</span>
                      <span style={styles.statSpecial}>{special}</span>
                    </>
                  )}
                </div>
              </div>
              <div style={styles.rowCost}>${stats.cost}</div>
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

      {hoveredTower && (
        <TowerTooltip type={hoveredTower} position={tooltipPosition} />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: 'rgba(10, 10, 26, 0.9)',
    borderRadius: '8px',
    border: `1px solid ${colors.accent}33`,
    maxWidth: '280px',
  },
  creditsDisplay: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: '6px',
    border: `1px solid ${colors.credits}44`,
  },
  creditsLabel: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  creditsValue: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.credits,
  },
  header: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: '2px',
  },
  towerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    maxHeight: '320px',
    overflowY: 'auto',
    paddingRight: '4px',
  },
  towerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: '6px 8px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: `1px solid ${colors.accent}44`,
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: typography.fontFamily.base,
    textAlign: 'left',
    minHeight: '44px',
  },
  towerRowSelected: {
    backgroundColor: `${colors.accent}22`,
    borderColor: colors.accent,
    boxShadow: `0 0 8px ${colors.accent}44`,
  },
  towerRowDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
    borderColor: colors.text.muted,
  },
  rowIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '32px',
  },
  rowInfo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  rowName: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  rowStats: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '2px',
    fontSize: '10px',
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.mono,
  },
  stat: {
    whiteSpace: 'nowrap',
  },
  statSep: {
    color: colors.text.muted,
  },
  statSpecial: {
    color: colors.accent,
    fontStyle: 'italic',
  },
  rowCost: {
    fontSize: typography.fontSize.xs,
    color: colors.credits,
    fontFamily: typography.fontFamily.mono,
    fontWeight: typography.fontWeight.bold,
    flexShrink: 0,
  },
  sellSection: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTop: `1px solid ${colors.text.muted}`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  sellHeader: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  selectedTowerInfo: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
  sellButton: {
    padding: `${spacing.xs} ${spacing.sm}`,
    backgroundColor: colors.danger,
    border: 'none',
    borderRadius: '4px',
    color: colors.text.primary,
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
};
