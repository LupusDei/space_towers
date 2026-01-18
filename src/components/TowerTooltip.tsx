import { TowerType } from '../game/types';
import { TOWER_STATS, COMBAT_CONFIG } from '../game/config';
import { colors, spacing, typography } from '../styles/theme';

interface TowerTooltipProps {
  type: TowerType;
  position: { x: number; y: number };
}

function getSpecialAbilityDetails(type: TowerType): string | null {
  const stats = TOWER_STATS[type];
  switch (type) {
    case TowerType.LASER:
      return 'Hitscan (instant hit)';
    case TowerType.MISSILE:
      return `Splash: ${stats.splashRadius} cells (+${stats.splashRadiusPerLevel}/lvl)`;
    case TowerType.TESLA:
      return `Chain: ${stats.chainCount} targets (+${stats.chainCountPerLevel}/lvl), ${(COMBAT_CONFIG.CHAIN_DAMAGE_FALLOFF * 100).toFixed(0)}% falloff`;
    case TowerType.CANNON:
      return null;
    case TowerType.GRAVITY:
      return `Slow: ${(COMBAT_CONFIG.GRAVITY_SLOW_MULTIPLIER * 100).toFixed(0)}% for ${COMBAT_CONFIG.GRAVITY_SLOW_DURATION}s`;
    case TowerType.STORM:
      return `Duration: ${stats.stormDuration}s (+${stats.stormDurationPerLevel}s/lvl)`;
    case TowerType.SNIPER:
      return 'Hitscan (instant hit)';
    case TowerType.NEEDLE:
      return 'Rapid-fire';
    default:
      return null;
  }
}

export default function TowerTooltip({ type, position }: TowerTooltipProps) {
  const stats = TOWER_STATS[type];
  const dps = (stats.damage / stats.fireRate).toFixed(1);
  const specialAbility = getSpecialAbilityDetails(type);

  return (
    <div
      style={{
        ...styles.container,
        left: position.x,
        top: position.y,
      }}
    >
      <div style={styles.header}>
        <span style={styles.name}>{stats.name}</span>
        <span style={styles.cost}>${stats.cost}</span>
      </div>

      <p style={styles.description}>{stats.description}</p>

      <div style={styles.statsSection}>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>Damage</span>
          <span style={styles.statValue}>
            {stats.damage}{' '}
            <span style={styles.perLevel}>(+{stats.damagePerLevel}/lvl)</span>
          </span>
        </div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>DPS</span>
          <span style={styles.statValueHighlight}>{dps}</span>
        </div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>Range</span>
          <span style={styles.statValue}>
            {stats.range}{' '}
            <span style={styles.perLevel}>(+{stats.rangePerLevel}/lvl)</span>
          </span>
        </div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>Fire Rate</span>
          <span style={styles.statValue}>
            {stats.fireRate}s{' '}
            <span style={styles.perLevel}>({stats.fireRatePerLevel}s/lvl)</span>
          </span>
        </div>
      </div>

      {specialAbility && (
        <div style={styles.specialSection}>
          <span style={styles.specialLabel}>Special</span>
          <span style={styles.specialValue}>{specialAbility}</span>
        </div>
      )}

      <div style={styles.upgradeSection}>
        <span style={styles.upgradeLabel}>Max Level: {stats.maxLevel}</span>
        <span style={styles.upgradeCosts}>
          Upgrades: {stats.upgradeCosts.map((c) => `$${c}`).join(' → ')}
        </span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    zIndex: 1000,
    minWidth: '260px',
    maxWidth: '320px',
    padding: spacing.md,
    backgroundColor: 'rgba(10, 10, 26, 0.95)',
    border: `1px solid ${colors.accent}`,
    borderRadius: '8px',
    boxShadow: `0 4px 16px rgba(0, 0, 0, 0.5), 0 0 8px ${colors.accent}33`,
    fontFamily: typography.fontFamily.base,
    pointerEvents: 'none',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottom: `1px solid ${colors.text.muted}`,
  },
  name: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  cost: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.credits,
    fontFamily: typography.fontFamily.mono,
  },
  description: {
    margin: `0 0 ${spacing.sm} 0`,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.normal,
  },
  statsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: spacing.sm,
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.mono,
  },
  statValueHighlight: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontFamily: typography.fontFamily.mono,
    fontWeight: typography.fontWeight.bold,
  },
  perLevel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  specialSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    marginBottom: spacing.sm,
    padding: spacing.xs,
    backgroundColor: `${colors.accent}11`,
    borderRadius: '4px',
    border: `1px solid ${colors.accent}44`,
  },
  specialLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: typography.fontWeight.medium,
  },
  specialValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.mono,
  },
  upgradeSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    paddingTop: spacing.xs,
    borderTop: `1px solid ${colors.text.muted}`,
  },
  upgradeLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  upgradeCosts: {
    fontSize: typography.fontSize.xs,
    color: colors.credits,
    fontFamily: typography.fontFamily.mono,
  },
};
