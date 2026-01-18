// TowerStoreScreen - Pre-game screen for selecting tower loadout
// Players select 4 towers from available unlocked towers before starting

import { useState } from 'react';
import { TowerType } from '../game/types';
import { TOWER_STATS } from '../game/config';
import { colors, spacing, typography } from '../styles/theme';
import TowerCard from './TowerCard';
import { useUserProgress } from '../hooks/useUserProgress';

const MAX_LOADOUT_SIZE = 4;

// All tower types available in the game
const allTowerTypes = Object.values(TowerType) as TowerType[];

// Default towers that are always unlocked
const DEFAULT_UNLOCKED_TOWERS: TowerType[] = [
  TowerType.LASER,
  TowerType.MISSILE,
  TowerType.TESLA,
  TowerType.CANNON,
];

interface TowerStoreScreenProps {
  /** Called when player confirms their selection with the chosen loadout */
  onConfirm: (loadout: TowerType[]) => void;
  /** Called when player wants to go back to main menu */
  onBack?: () => void;
}

export default function TowerStoreScreen({
  onConfirm,
  onBack,
}: TowerStoreScreenProps) {
  const { progress, actions } = useUserProgress();

  // Get unlocked towers (merge defaults with user's unlocked)
  const unlockedTowers = new Set([
    ...DEFAULT_UNLOCKED_TOWERS,
    ...progress.unlockedTowers,
  ]);

  // Initialize selection from last loadout if available and valid
  const [selectedTowers, setSelectedTowers] = useState<TowerType[]>(() => {
    if (progress.lastSelectedLoadout && progress.lastSelectedLoadout.length > 0) {
      // Filter to only include towers that are still unlocked
      const validLoadout = progress.lastSelectedLoadout.filter(
        (type) => unlockedTowers.has(type)
      );
      // Only use if we have valid towers, otherwise start empty
      return validLoadout.length > 0 ? validLoadout.slice(0, MAX_LOADOUT_SIZE) : [];
    }
    return [];
  });

  const handleToggleTower = (type: TowerType) => {
    setSelectedTowers((prev) => {
      if (prev.includes(type)) {
        // Remove from selection
        return prev.filter((t) => t !== type);
      } else if (prev.length < MAX_LOADOUT_SIZE) {
        // Add to selection
        return [...prev, type];
      }
      // Already at max, don't add
      return prev;
    });
  };

  const handleUnlockTower = (type: TowerType) => {
    const stats = TOWER_STATS[type];
    if (progress.waveCredits >= stats.unlockCost) {
      // Deduct credits and unlock
      actions.spendWaveCredits(stats.unlockCost);
      actions.unlockTower(type);
    }
  };

  const handleConfirm = () => {
    if (selectedTowers.length === MAX_LOADOUT_SIZE) {
      // Save the loadout for next time
      actions.setLastLoadout(selectedTowers);
      onConfirm(selectedTowers);
    }
  };

  const canConfirm = selectedTowers.length === MAX_LOADOUT_SIZE;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>Tower Selection</h1>
          <div style={styles.subtitle}>
            Select {MAX_LOADOUT_SIZE} towers for your loadout
          </div>
          <div style={styles.waveCredits}>
            Wave Credits: <span style={styles.creditsValue}>{progress.waveCredits}</span>
          </div>
        </div>

        <div style={styles.selectionStatus}>
          {selectedTowers.length} / {MAX_LOADOUT_SIZE} towers selected
        </div>

        <div style={styles.towerGrid}>
          {allTowerTypes.map((type) => {
            const isUnlocked = unlockedTowers.has(type);
            const isSelected = selectedTowers.includes(type);
            const canSelect = isUnlocked && (isSelected || selectedTowers.length < MAX_LOADOUT_SIZE);

            return (
              <TowerCard
                key={type}
                type={type}
                locked={!isUnlocked}
                selected={isSelected}
                disabled={!canSelect && isUnlocked}
                onClick={isUnlocked ? () => handleToggleTower(type) : undefined}
                waveCredits={progress.waveCredits}
                onUnlock={!isUnlocked ? () => handleUnlockTower(type) : undefined}
              />
            );
          })}
        </div>

        <div style={styles.actions}>
          {onBack && (
            <button style={styles.backButton} onClick={onBack}>
              Back
            </button>
          )}
          <button
            style={{
              ...styles.confirmButton,
              ...(canConfirm ? {} : styles.confirmButtonDisabled),
            }}
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: typography.fontFamily.base,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
    maxWidth: '800px',
    width: '100%',
  },
  header: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    margin: 0,
    fontFamily: typography.fontFamily.mono,
    textTransform: 'uppercase',
    letterSpacing: '3px',
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  waveCredits: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.mono,
  },
  creditsValue: {
    color: colors.credits,
    fontWeight: typography.fontWeight.bold,
  },
  selectionStatus: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.mono,
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '6px',
    border: `1px solid ${colors.accent}44`,
  },
  towerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: spacing.md,
    width: '100%',
    maxWidth: '700px',
  },
  actions: {
    display: 'flex',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  backButton: {
    padding: `${spacing.sm} ${spacing.lg}`,
    backgroundColor: 'transparent',
    border: `2px solid ${colors.text.muted}`,
    borderRadius: '6px',
    color: colors.text.secondary,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.mono,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  confirmButton: {
    padding: `${spacing.sm} ${spacing.xl}`,
    backgroundColor: colors.success,
    border: 'none',
    borderRadius: '6px',
    color: colors.background,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.mono,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.text.muted,
    cursor: 'not-allowed',
    opacity: 0.6,
  },
};
