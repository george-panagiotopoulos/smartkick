<template>
  <div v-if="show" class="game-over-overlay" @click.self="handleOverlayClick">
    <div class="game-over-modal">
      <div class="game-over-header">
        <h1 class="game-over-title">🎉 {{ languageStore.t('ui.game_over', 'Game Over!') }} 🎉</h1>
      </div>
      
      <div class="game-over-content">
        <div class="score-display">
          <div class="team-score team-player">
            <div class="team-flag-large">{{ playerTeamInfo.flag }}</div>
            <div class="team-name">{{ playerTeamInfo.name }}</div>
            <div class="team-score-value">{{ blueScore }}</div>
          </div>
          
          <div class="score-separator">VS</div>
          
          <div class="team-score team-opponent">
            <div class="team-flag-large">{{ opponentTeamInfo.flag }}</div>
            <div class="team-name">{{ opponentTeamInfo.name }}</div>
            <div class="team-score-value">{{ redScore }}</div>
          </div>
        </div>
        
        <div class="game-over-reason" v-if="gameOverReason">
          <p>{{ gameOverReason }}</p>
        </div>
        
        <div class="game-over-winner" v-if="winner">
          <h2>{{ winnerText }}</h2>
        </div>
      </div>
      
      <div class="game-over-footer">
        <button class="new-game-button" @click="startNewGame">
          {{ languageStore.t('ui.new_game', 'New Game') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../store/gameStore'
import { useLanguageStore } from '../store/languageStore'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  }
})

const gameStore = useGameStore()
const languageStore = useLanguageStore()

const blueScore = computed(() => gameStore.blueScore)
const redScore = computed(() => gameStore.redScore)
const playerTeamInfo = computed(() => gameStore.playerTeamInfo)
const opponentTeamInfo = computed(() => gameStore.opponentTeamInfo)
const gameOverReason = computed(() => gameStore.gameOverReason)

const winner = computed(() => {
  if (blueScore.value > redScore.value) {
    return 'player'
  } else if (redScore.value > blueScore.value) {
    return 'opponent'
  }
  return 'draw'
})

const winnerText = computed(() => {
  if (winner.value === 'player') {
    return languageStore.t('ui.you_won', 'You Won! 🏆')
  } else if (winner.value === 'opponent') {
    return languageStore.t('ui.opponent_won', 'Opponent Won! 🏆')
  } else {
    return languageStore.t('ui.draw', 'It\'s a Draw!')
  }
})

function handleOverlayClick() {
  // Prevent closing by clicking overlay - require button click
}

function startNewGame() {
  // Use the reset function from the game store
  gameStore.resetGame()
}

</script>

<style scoped>
.game-over-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3000;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.game-over-modal {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 30px;
  padding: 40px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.4s ease;
  text-align: center;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.game-over-header {
  margin-bottom: 30px;
}

.game-over-title {
  color: white;
  font-size: 2.5em;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  font-weight: bold;
}

.game-over-content {
  margin-bottom: 30px;
}

.score-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.team-score {
  flex: 1;
  min-width: 200px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  transition: transform 0.3s ease;
}

.team-score:hover {
  transform: scale(1.05);
  background: rgba(255, 255, 255, 0.2);
}

.team-player {
  border: 3px solid #2196F3;
  box-shadow: 0 0 20px rgba(33, 150, 243, 0.5);
}

.team-opponent {
  border: 3px solid #f44336;
  box-shadow: 0 0 20px rgba(244, 67, 54, 0.5);
}

.team-flag-large {
  font-size: 4em;
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
}

.team-name {
  color: white;
  font-size: 1.5em;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.team-score-value {
  color: white;
  font-size: 3em;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid white;
}

.score-separator {
  color: white;
  font-size: 2em;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.game-over-reason {
  color: white;
  font-size: 1.1em;
  margin-bottom: 20px;
  opacity: 0.9;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.game-over-winner {
  margin-top: 20px;
}

.game-over-winner h2 {
  color: #FFD700;
  font-size: 2em;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  font-weight: bold;
  animation: pulse 2s ease infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.game-over-footer {
  margin-top: 30px;
}

.new-game-button {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 18px 50px;
  font-size: 1.3em;
  font-weight: bold;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.new-game-button:hover {
  background: #45a049;
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(76, 175, 80, 0.6);
}

.new-game-button:active {
  transform: scale(0.98);
}

@media (max-width: 768px) {
  .game-over-modal {
    padding: 30px 20px;
    max-width: 90%;
  }
  
  .game-over-title {
    font-size: 2em;
  }
  
  .score-display {
    flex-direction: column;
    gap: 20px;
  }
  
  .team-score {
    min-width: auto;
    width: 100%;
  }
  
  .score-separator {
    width: 50px;
    height: 50px;
    font-size: 1.5em;
  }
  
  .team-flag-large {
    font-size: 3em;
  }
  
  .team-score-value {
    font-size: 2.5em;
    width: 70px;
    height: 70px;
  }
  
  .game-over-winner h2 {
    font-size: 1.5em;
  }
  
  .new-game-button {
    padding: 15px 40px;
    font-size: 1.1em;
  }
}

</style>

