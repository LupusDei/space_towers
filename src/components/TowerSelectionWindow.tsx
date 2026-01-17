import { useEffect, useRef } from 'react';
import type { Tower } from '../game/types';
import { TOWER_STATS, GAME_CONFIG } from '../game/config';
import { colors, spacing, typography } from '../styles/theme';
import TowerIcon from './TowerIcon';

interface TowerSelectionWindowProps {
  tower: Tower;
  credits: number;
  onSell: () => void;
  onUpgrade: () => void;
  onClose: () => void;
}

export default function TowerSelectionWindow({
  tower,
  credits,
  onSell,
  onUpgrade,
  onClose,
}: TowerSelectionWindowProps) {
  const windowRef = useRef<HTMLDivElement>(null);
  const stats = TOWER_STATS[tower.type];

  // Calculate refund amount (60% of base cost)
  const refundAmount = Math.floor(stats.cost * GAME_CONFIG.SELL_REFUND_PERCENT);

  // Calculate upgrade cost (if upgradeable)
  const isMaxLevel = tower.level >= stats.maxLevel;
  const upgradeCost = isMaxLevel ? 0 : stats.upgradeCosts[tower.level - 1];
  const canAffordUpgrade = !isMaxLevel && credits >= upgradeCost;

  // Calculate DPS
  const dps = (tower.damage / tower.fireRate).toFixed(1);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (windowRef.current && !windowRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    // Add listener on next tick to avoid immediate close from the click that opened it
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div ref={windowRef} style={styles.container}>
      {/* Header with tower name and level */}
      <div style={styles.header}>
        <div style={styles.headerIcon}>
          <TowerIcon type={tower.type} size={32} />
        </div>
        <div style={styles.headerInfo}>
          <div style={styles.towerName}>{stats.name}</div>
          <div style={styles.towerLevel}>Level {tower.level}</div>
        </div>
      </div>

      {/* Combat stats */}
      <div style={styles.statsSection}>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>Kills</span>
          <span style={styles.statValue}>{tower.kills}</span>
        </div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>Damage Dealt</span>
          <span style={styles.statValue}>{tower.totalDamage.toLocaleString()}</span>
        </div>
      </div>

      {/* Current stats */}
      <div style={styles.statsSection}>
        <div style={styles.sectionTitle}>Current Stats</div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>Damage</span>
          <span style={styles.statValue}>{tower.damage}</span>
        </div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>Range</span>
          <span style={styles.statValue}>{tower.range}px</span>
        </div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>Fire Rate</span>
          <span style={styles.statValue}>{tower.fireRate.toFixed(2)}s</span>
        </div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>DPS</span>
          <span style={styles.statValueHighlight}>{dps}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div style={styles.buttonSection}>
        <button
          style={{
            ...styles.upgradeButton,
            ...(canAffordUpgrade ? {} : styles.buttonDisabled),
          }}
          onClick={onUpgrade}
          disabled={!canAffordUpgrade}
        >
          {isMaxLevel ? 'MAX LEVEL' : `UPGRADE $${upgradeCost}`}
        </button>
        <button style={styles.sellButton} onClick={onSell}>
          SELL ${refundAmount}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(10, 10, 30, 0.95)',
    border: `2px solid ${colors.accent}`,
    borderRadius: '8px',
    padding: spacing.md,
    minWidth: '220px',
    boxShadow: `0 0 20px ${colors.accent}40, 0 4px 20px rgba(0, 0, 0, 0.5)`,
    zIndex: 100,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottom: `1px solid ${colors.accent}44`,
  },
  headerIcon: {
    flexShrink: 0,
  },
  headerInfo: {
    flex: 1,
  },
  towerName: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  towerLevel: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.xs,
    color: colors.accent,
  },
  statsSection: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: spacing.xs,
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '2px 0',
  },
  statLabel: {
    fontFamily: typography.fontFamily.base,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  statValue: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
  statValueHighlight: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.sm,
    color: colors.accent,
    fontWeight: typography.fontWeight.bold,
  },
  buttonSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTop: `1px solid ${colors.accent}44`,
  },
  upgradeButton: {
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: colors.success,
    border: 'none',
    borderRadius: '4px',
    color: colors.background,
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  sellButton: {
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: colors.danger,
    border: 'none',
    borderRadius: '4px',
    color: colors.text.primary,
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  buttonDisabled: {
    backgroundColor: colors.text.muted,
    cursor: 'not-allowed',
    opacity: 0.6,
  },
};
