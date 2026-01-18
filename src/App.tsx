import { useState, useLayoutEffect, useCallback } from 'react';
import './App.css';
import { useGameEngine } from './hooks/useGameEngine';
import { GamePhase, TowerType } from './game/types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './game/config';
import MainMenu from './components/MainMenu';
import LoadoutScreen from './components/LoadoutScreen';
import Game from './components/Game';
import HUD from './components/HUD';
import TowerPanel from './components/TowerPanel';
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

function App() {
  const { state, actions } = useGameEngine();
  const scale = useResponsiveScale();

  const handleEnterLoadout = () => {
    actions.enterLoadout();
  };

  const handleStartGame = () => {
    actions.startGame();
  };

  const handlePlayAgain = () => {
    actions.enterLoadout();
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
        <MainMenu onStartGame={handleEnterLoadout} />
      </div>
    );
  }

  // Show LoadoutScreen when in LOADOUT phase
  if (state.phase === GamePhase.LOADOUT) {
    return (
      <div className="app">
        <LoadoutScreen
          credits={state.credits}
          selectedTowerType={state.selectedTowerType}
          onSelectTowerType={handleSelectTowerType}
          onStartGame={handleStartGame}
        />
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
