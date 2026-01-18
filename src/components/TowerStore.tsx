import { TowerType } from '../game/types';
import { TOWER_STATS } from '../game/config';
import TowerIcon from './TowerIcon';
import styles from '../styles/TowerStore.module.css';

interface TowerStoreProps {
  credits: number;
  selectedTowerType: TowerType | null;
  onSelectTowerType: (type: TowerType | null) => void;
}

const towerTypes = Object.values(TowerType) as TowerType[];

export default function TowerStore({
  credits,
  selectedTowerType,
  onSelectTowerType,
}: TowerStoreProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>Tower Store</div>
      <div className={styles.grid}>
        {towerTypes.map((type) => {
          const stats = TOWER_STATS[type];
          const canAfford = credits >= stats.cost;
          const isSelected = selectedTowerType === type;

          const cellClasses = [
            styles.towerCell,
            isSelected && styles.towerCellSelected,
            !canAfford && styles.towerCellDisabled,
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={type}
              className={cellClasses}
              disabled={!canAfford}
              onClick={() => onSelectTowerType(isSelected ? null : type)}
              aria-label={`${stats.name} - ${stats.cost} credits`}
            >
              <div className={styles.iconContainer}>
                <TowerIcon type={type} size={48} />
              </div>
              <div className={styles.towerName}>{stats.name}</div>
              <div className={styles.towerCost}>${stats.cost}</div>
            </button>
          );
        })}
        {/* Empty cells for future towers (grid expands as needed) */}
        {Array.from({ length: Math.max(0, 12 - towerTypes.length) }).map((_, index) => (
          <div key={`empty-${index}`} className={styles.emptyCell}>
            <div className={styles.emptyIcon}>?</div>
            <div className={styles.emptyLabel}>Coming Soon</div>
          </div>
        ))}
      </div>
    </div>
  );
}
