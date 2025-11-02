# Frontend

Vue.js 3 frontend for the Football Edu Game.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The game will open at `http://localhost:3000`

3. Build for production:
```bash
npm run build
```

## Structure

- `src/components/` - Vue components
  - `Player.vue` - Individual player component with sprite rendering
  - `GameField.vue` - Football pitch with players
  - `ActionButtons.vue` - Pass/Dribble/Shoot buttons
- `src/views/` - Page views
  - `GameView.vue` - Main game view
- `src/store/` - State management (Pinia)
  - `gameStore.js` - Game state and logic
- `src/services/` - Services
  - `gameLogic.js` - Game logic utilities
- `public/assets/` - Static assets (images, sprites)

## Game Flow

1. Game starts with ball on a random blue team midfielder
2. Player can choose Pass or Dribble (Shoot is disabled until attacker has ball)
3. Each action triggers a probability check (currently simulated, will integrate questions)
4. On success: ball moves to appropriate player
5. On failure: opponent gains possession
6. Opponent automatically plays when they have possession

## Features Implemented

- ✅ Player positioning and sprites
- ✅ Ball possession visualization
- ✅ Pass/Dribble/Shoot actions
- ✅ State management with Pinia
- ✅ Shoot button disabled until only goalkeeper remains
- ✅ Player stance changes based on game state
- ✅ Opponent possession handling

## Next Steps

- Integrate question modal system
- Add shooting/goal scoring logic
- Implement opponent AI actions
- Add animations for player movements
- Add sound effects
