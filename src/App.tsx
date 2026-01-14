import './App.css';
import { useGameEngine } from './hooks/useGameEngine';
import { GamePhase, TowerType } from './game/types';
import MainMenu from './components/MainMenu';
import Game from './components/Game';
import HUD from './components/HUD';
import TowerPanel from './components/TowerPanel';
import GameOver from './components/GameOver';

function App() {
  const { state, actions } = useGameEngine();

  const handleStartGame = () => {
    actions.startGame();
  };

  const handlePlayAgain = () => {
    actions.startGame();
  };

  const handleSelectTowerType = (type: TowerType | null) => {
    // TowerPanel selection - engine handles this via setSelectedTowerType
    // For now, we'll just deselect any selected tower when selecting a tower type
    if (type !== null) {
      actions.selectTower(null);
    }
  };

  const handleSellTower = () => {
    if (state.selectedTower) {
      actions.sellTower(state.selectedTower);
    }
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

  // Show game UI for PLANNING, COMBAT, PAUSED, VICTORY, DEFEAT phases
  return (
    <div className="app">
      <div className="game-container">
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
        </div>
      </div>
      <GameOver onPlayAgain={handlePlayAgain} />
    </div>
  );
}

export default App;
