import { useState, useLayoutEffect, useCallback } from 'react';
import './App.css';
import { useGameEngine } from './hooks/useGameEngine';
import { useUserProgress } from './hooks/useUserProgress';
import { GamePhase, TowerType } from './game/types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TOWER_STATS } from './game/config';
import MainMenu from './components/MainMenu';
import Game from './components/Game';
import HUD from './components/HUD';
import TowerPanel from './components/TowerPanel';
import TowerStore from './components/TowerStore';
import TowerSelectionWindow from './components/TowerSelectionWindow';
import GameOver from './components/GameOver';
import EngageButton from './components/EngageButton';
import WavePreview from './components/WavePreview';
import WaveSummary from './components/WaveSummary';

// Total dimensions of game container (canvas + sidebar + gaps + padding)
const GAME_CONTAINER_WIDTH = CANVAS_WIDTH + 16 + 200 + 32; // 1128
const GAME_CONTAINER_HEIGHT = 50 + 8 + CANVAS_HEIGHT + 32; // ~750

function calculateScale(): number {
  const padding = 32; // Leave some padding around edges
  const availableWidth = window.innerWidth - padding;
  const availableHeight = window.innerHeight - padding;

  const scaleX = availableWidth / GAME_CONTAINER_WIDTH;
  const scaleY = availableHeight / GAME_CONTAINER_HEIGHT;

  // Use the smaller scale to fit both dimensions, cap at 1.5, floor at 0.5
  const newScale = Math.min(scaleX, scaleY, 1.5);
  return Math.max(0.5, newScale);
}

function useResponsiveScale() {
  const [scale, setScale] = useState(calculateScale);

  const handleResize = useCallback(() => {
    setScale(calculateScale());
  }, []);

  useLayoutEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return scale;
}

// Styles for Tower Store screen
const towerStoreScreenStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '24px',
  padding: '32px',
  minHeight: '100vh',
  backgroundColor: '#0a0a1a',
};

const towerStoreTitle: React.CSSProperties = {
  fontFamily: '"Orbitron", "Courier New", monospace',
  fontSize: '28px',
  color: '#00d4ff',
  textTransform: 'uppercase',
  letterSpacing: '4px',
  margin: 0,
};

const startBattleButton: React.CSSProperties = {
  padding: '16px 48px',
  fontSize: '18px',
  fontFamily: '"Orbitron", "Courier New", monospace',
  fontWeight: 'bold',
  backgroundColor: '#00d4ff',
  color: '#0a0a1a',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  textTransform: 'uppercase',
  letterSpacing: '2px',
  transition: 'all 0.2s ease',
};

function App() {
  const { state, actions } = useGameEngine();
  const { progress, actions: progressActions } = useUserProgress();
  const scale = useResponsiveScale();
  const [storeSelectedType, setStoreSelectedType] = useState<TowerType | null>(null);

  const handleStartGame = () => {
    actions.startGame();
  };

  const handlePlayAgain = () => {
    actions.startGame();
  };

  const handleConfirmTowerSelection = () => {
    actions.confirmTowerSelection();
  };

  const handleUnlockTower = (type: TowerType) => {
    const stats = TOWER_STATS[type];
    if (progressActions.spendWaveCredits(stats.unlockCost)) {
      progressActions.unlockTower(type);
    }
  };

  const handleSelectTowerType = (type: TowerType | null) => {
    // Set the selected tower type in the engine
    actions.selectTowerType(type);
    // Deselect any selected tower when selecting a tower type
    if (type !== null) {
      actions.selectTower(null);
    }
  };

  const handleSellTower = () => {
    if (state.selectedTower) {
      actions.sellTower(state.selectedTower);
    }
  };

  const handleUpgradeTower = () => {
    if (state.selectedTower) {
      actions.upgradeTower(state.selectedTower);
    }
  };

  const handleCloseSelectionWindow = () => {
    actions.selectTower(null);
  };

  // Get the selected tower object from the state
  const selectedTowerObj = state.selectedTower
    ? state.towers.get(state.selectedTower) ?? null
    : null;

  // Show MainMenu when in MENU phase
  if (state.phase === GamePhase.MENU) {
    return (
      <div className="app">
        <MainMenu onStartGame={handleStartGame} />
      </div>
    );
  }

  // Show Tower Store for tower selection before game starts
  if (state.phase === GamePhase.TOWER_STORE) {
    return (
      <div className="app">
        <div className="tower-store-screen" style={towerStoreScreenStyle}>
          <h1 style={towerStoreTitle}>Select Your Towers</h1>
          <TowerStore
            credits={0}
            waveCredits={progress.waveCredits}
            selectedTowerType={storeSelectedType}
            onSelectTowerType={setStoreSelectedType}
            unlockedTowers={progress.unlockedTowers}
            onUnlockTower={handleUnlockTower}
          />
          <button
            style={startBattleButton}
            onClick={handleConfirmTowerSelection}
          >
            Start Battle
          </button>
        </div>
      </div>
    );
  }

  // Show game UI for PLANNING, COMBAT, PAUSED, VICTORY, DEFEAT phases
  return (
    <div className="app">
      <div className="game-container" style={{ transform: `scale(${scale})` }}>
        <div className="game-main">
          <HUD />
          <Game />
        </div>
        <div className="game-sidebar">
          <TowerPanel
            credits={state.credits}
            selectedTowerType={state.selectedTowerType}
            selectedTower={selectedTowerObj}
            onSelectTowerType={handleSelectTowerType}
            onSellTower={handleSellTower}
            selectedTowers={progress.unlockedTowers}
          />
          <WavePreview wave={state.wave} phase={state.phase} />
          <EngageButton phase={state.phase} onEngage={actions.engage} />
        </div>
      </div>
      <GameOver onPlayAgain={handlePlayAgain} />
      <WaveSummary phase={state.phase} />
      {selectedTowerObj && (
        <TowerSelectionWindow
          tower={selectedTowerObj}
          credits={state.credits}
          onSell={handleSellTower}
          onUpgrade={handleUpgradeTower}
          onClose={handleCloseSelectionWindow}
        />
      )}
    </div>
  );
}

export default App;
