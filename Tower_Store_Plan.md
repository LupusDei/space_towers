# Tower Store Feature Plan

## Overview

This document outlines the implementation plan for the Tower Store feature, which introduces:
- 4 new tower types with unique mechanics
- A Tower Store screen where players select their loadout before each game
- Wave Credits as a persistent currency earned by completing waves
- Tower unlocking system using Wave Credits

## Core Concepts

### Wave Credits
- Earned after completing each wave (Wave N = N credits earned)
- Persistent across sessions (stored in browser local storage)
- Used to unlock new towers permanently

### Tower Selection
- Players choose 4 towers from 8 available to use in each game
- Original 4 towers (Cannon, Tesla, Laser, Missile) are always unlocked
- New 4 towers must be unlocked with Wave Credits

### Game Flow Change
```
Main Menu → [Start] → Tower Store → [Confirm Selection] → Game (Planning Phase)
```

---

## New Tower Specifications

### 1. Gravity Tower
| Attribute | Value |
|-----------|-------|
| **Unlock Cost** | 10 Wave Credits |
| **Build Cost** | $80 |
| **Damage** | 5 (AOE to all enemies in range) |
| **Range** | 100 |
| **Fire Rate** | 1.0s |
| **Special** | Slows enemies by 50% for 1 second on hit |
| **Visual** | Black hole / singularity effect |
| **Level Up** | +damage, +range, sprite grows slightly |

### 2. Storm Tower
| Attribute | Value |
|-----------|-------|
| **Unlock Cost** | 15 Wave Credits |
| **Build Cost** | $100 |
| **Damage** | 10 per second (30 total over 3s) |
| **Range** | 200 (targeting), 50 (storm AOE) |
| **Fire Rate** | 4.0s (cooldown between casts) |
| **Duration** | 3 seconds |
| **Special** | Creates stationary storm at target location |
| **Visual** | Multi-pronged transformer generating a cloud |
| **Level Up** | Storm AOE size increases |

### 3. Sniper Tower
| Attribute | Value |
|-----------|-------|
| **Unlock Cost** | 10 Wave Credits |
| **Build Cost** | $75 |
| **Damage** | 50 |
| **Range** | 350 |
| **Fire Rate** | 2.0s |
| **Special** | Single target, longest range in game |
| **Visual** | Sniper rifle with scope |
| **Level Up** | +damage, +range |

### 4. Hot Needle of Inquiry
| Attribute | Value |
|-----------|-------|
| **Unlock Cost** | 20 Wave Credits |
| **Build Cost** | $100 |
| **Damage** | 10 |
| **Range** | 100 |
| **Fire Rate** | 0.25s (4 hits per second) |
| **Special** | Rotates to point at current target |
| **Visual** | Steel needle with glowing red tip |
| **Level Up** | +damage, +fire rate |

---

## Epics & Tasks

### Epic 1: Data Storage & Persistence
*Foundation for Wave Credits and tower unlock state*

| Task | Description | Dependencies |
|------|-------------|--------------|
| 1.1 | Create `StorageService` module for local storage abstraction | None |
| 1.2 | Define `UserProgress` type (waveCredits, unlockedTowers, highestWave) | None |
| 1.3 | Implement `loadProgress()` and `saveProgress()` functions | 1.1, 1.2 |
| 1.4 | Add Wave Credit calculation logic (wave N = N credits) | 1.2 |
| 1.5 | Integrate credit awarding into Engine after wave completion | 1.3, 1.4 |
| 1.6 | Implement tower unlock purchase function | 1.3 |
| 1.7 | Add React hook `useUserProgress` for UI components | 1.3 |
| 1.8 | Write tests for StorageService and progress functions | 1.1-1.6 |

---

### Epic 2: Tower Store UI
*The pre-game screen for selecting tower loadout*

| Task | Description | Dependencies |
|------|-------------|--------------|
| 2.1 | Create `TowerStore` component layout (8 tower grid) | None |
| 2.2 | Create `TowerCard` component (shows tower stats, unlock status, cost) | None |
| 2.3 | Implement tower selection logic (max 4, min 4 to proceed) | 2.1 |
| 2.4 | Add "locked" visual state for towers not yet unlocked | 2.2 |
| 2.5 | Implement unlock button with Wave Credit deduction | Epic 1, 2.2 |
| 2.6 | Display current Wave Credits balance | Epic 1, 2.1 |
| 2.7 | Create "Confirm Selection" button (disabled until 4 selected) | 2.3 |
| 2.8 | Add tower stat tooltips/details panel | 2.2 |
| 2.9 | Style TowerStore to match game theme | 2.1-2.8 |
| 2.10 | Write tests for TowerStore component | 2.1-2.7 |

---

### Epic 3: Game Flow Changes
*Modify app flow to include Tower Store between menu and game*

| Task | Description | Dependencies |
|------|-------------|--------------|
| 3.1 | Add `TOWER_STORE` phase to GameStateMachine | None |
| 3.2 | Modify Main Menu "Start" to transition to Tower Store | 3.1 |
| 3.3 | Pass selected towers from TowerStore to Engine initialization | Epic 2, 3.1 |
| 3.4 | Update TowerPanel to only show selected towers | 3.3 |
| 3.5 | Add "Back to Store" option from pause menu | 3.1 |
| 3.6 | Persist last tower selection for quick-start option | Epic 1, 3.3 |
| 3.7 | Write tests for new game flow transitions | 3.1-3.4 |

---

### Epic 4: Gravity Tower
*AOE damage + slow effect tower*

| Task | Description | Dependencies |
|------|-------------|--------------|
| 4.1 | Add `GRAVITY` tower type to config with base stats | None |
| 4.2 | Implement slow effect system in Enemy class | None |
| 4.3 | Create gravity tower firing logic in CombatModule (AOE pulse) | 4.1, 4.2 |
| 4.4 | Create `GravityTowerSprite` - black hole/singularity visual | None |
| 4.5 | Add gravity pulse animation effect | 4.4 |
| 4.6 | Add slow visual indicator on affected enemies | 4.2 |
| 4.7 | Configure level-up stats (damage, range, sprite scale) | 4.1 |
| 4.8 | Write tests for gravity tower mechanics | 4.1-4.3 |

---

### Epic 5: Storm Tower
*Stationary AOE storm effect tower*

| Task | Description | Dependencies |
|------|-------------|--------------|
| 5.1 | Add `STORM` tower type to config with base stats | None |
| 5.2 | Create `StormEffect` entity for persistent ground effect | None |
| 5.3 | Implement storm spawning logic in CombatModule | 5.1, 5.2 |
| 5.4 | Implement storm tick damage (damage per second while in AOE) | 5.2, 5.3 |
| 5.5 | Create `StormTowerSprite` - transformer/generator visual | None |
| 5.6 | Create `StormEffectSprite` - lightning cloud animation | 5.2 |
| 5.7 | Add storm cast animation on tower | 5.5 |
| 5.8 | Configure level-up stats (storm AOE size) | 5.1 |
| 5.9 | Write tests for storm tower mechanics | 5.1-5.4 |

---

### Epic 6: Sniper Tower
*Long-range, high-damage single target tower*

| Task | Description | Dependencies |
|------|-------------|--------------|
| 6.1 | Add `SNIPER` tower type to config with base stats | None |
| 6.2 | Implement sniper firing logic in CombatModule (hitscan, single target) | 6.1 |
| 6.3 | Create `SniperTowerSprite` - rifle with scope visual | None |
| 6.4 | Add sniper shot tracer effect (long-range visual) | 6.3 |
| 6.5 | Add scope glint animation when targeting | 6.3 |
| 6.6 | Configure level-up stats (damage, range) | 6.1 |
| 6.7 | Write tests for sniper tower mechanics | 6.1, 6.2 |

---

### Epic 7: Hot Needle of Inquiry
*Fast-firing, short-range tower with rotation*

| Task | Description | Dependencies |
|------|-------------|--------------|
| 7.1 | Add `NEEDLE` tower type to config with base stats | None |
| 7.2 | Implement needle firing logic in CombatModule (rapid single target) | 7.1 |
| 7.3 | Create `NeedleTowerSprite` - steel needle with red tip | None |
| 7.4 | Implement tower rotation toward target | 7.3 |
| 7.5 | Add red tip glow animation (pulses when firing) | 7.3 |
| 7.6 | Add rapid-fire visual effect (heat shimmer or beam flicker) | 7.4 |
| 7.7 | Configure level-up stats (damage, fire rate) | 7.1 |
| 7.8 | Write tests for needle tower mechanics | 7.1, 7.2 |

---

## Parallel Development Strategy

### Phase 1 (Can Start Immediately - No Dependencies)
All of these can be developed in parallel:

```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   Epic 1: Storage   │  │  Epic 2: Store UI   │  │  Tower Configs      │
│   Tasks 1.1-1.4     │  │  Tasks 2.1-2.2      │  │  4.1, 5.1, 6.1, 7.1 │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘

┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  Gravity Sprite     │  │  Storm Sprites      │  │  Sniper Sprite      │
│  Tasks 4.4-4.5      │  │  Tasks 5.5-5.6      │  │  Tasks 6.3-6.5      │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘

┌─────────────────────┐  ┌─────────────────────┐
│  Needle Sprite      │  │  Slow Effect System │
│  Tasks 7.3-7.6      │  │  Task 4.2           │
└─────────────────────┘  └─────────────────────┘
```

### Phase 2 (After Phase 1 Components Ready)
```
┌─────────────────────┐  ┌─────────────────────┐
│  Storage Integration│  │  Store UI Wiring    │
│  Tasks 1.5-1.7      │  │  Tasks 2.3-2.9      │
└─────────────────────┘  └─────────────────────┘

┌─────────────────────┐  ┌─────────────────────┐
│  Tower Combat Logic │  │  Storm Effect Entity│
│  4.3, 6.2, 7.2      │  │  Tasks 5.2-5.4      │
└─────────────────────┘  └─────────────────────┘
```

### Phase 3 (Integration)
```
┌─────────────────────┐  ┌─────────────────────┐
│  Game Flow Changes  │  │  All Tower Tests    │
│  Epic 3             │  │  1.8, 2.10, etc.    │
└─────────────────────┘  └─────────────────────┘
```

---

## Implementation Notes

### Slow Effect System (Gravity Tower)
- Add `slowMultiplier` and `slowEndTime` fields to Enemy
- Modify enemy movement calculation to apply slow
- Visual: tint enemy sprite or add slow particle effect

### Storm Effect System
- Create `StormEffect` class with position, radius, duration, damage per tick
- Store active storms in Engine or CombatModule
- Each game tick: check enemies in storm radius, apply damage
- Remove storm when duration expires

### Tower Rotation (Hot Needle)
- Add `rotation` field to Tower (or just Needle tower)
- Calculate angle to target: `Math.atan2(targetY - towerY, targetX - towerX)`
- Apply rotation in sprite rendering

### Storage Schema
```typescript
interface UserProgress {
  waveCredits: number;
  unlockedTowers: TowerType[];
  highestWaveCompleted: number;
  lastSelectedLoadout: TowerType[];
}
```

### Default Tower Availability
```typescript
const DEFAULT_UNLOCKED: TowerType[] = ['CANNON', 'TESLA', 'LASER', 'MISSILE'];
```

---

## Success Criteria

- [ ] Wave Credits persist across browser sessions
- [ ] All 8 towers appear in Tower Store with correct unlock states
- [ ] Players cannot start game without selecting exactly 4 towers
- [ ] Locked towers can be purchased with sufficient Wave Credits
- [ ] Each new tower functions with unique mechanics as specified
- [ ] All new towers have distinct visual sprites and animations
- [ ] New towers can be upgraded with appropriate stat increases
- [ ] Game flow smoothly transitions: Menu → Store → Game
- [ ] All features have test coverage
