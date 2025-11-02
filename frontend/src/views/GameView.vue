<template>
  <div class="game-view">
    <TeamSelection v-if="!teamSelectionComplete" />
    
    <template v-else>
      <div class="game-header">
        <div class="header-top">
          <h1>SmartKick</h1>
          <LanguageToggle />
        </div>
        <div class="score">
          <span class="score-blue">
            <span class="team-flag">{{ playerTeamInfo.flag }}</span>
            {{ playerTeamInfo.name }}: {{ blueScore }}
          </span>
          <span class="score-red">
            <span class="team-flag">{{ opponentTeamInfo.flag }}</span>
            {{ opponentTeamInfo.name }}: {{ redScore }}
          </span>
        </div>
      </div>
      
      <GameField />
      
      <ActionButtons />
    
    <div class="game-info">
      <p v-if="ballPossession === 'blue' && !isCelebrating">
        <strong>{{ languageStore.t('ui.your_turn', 'Your turn!') }}</strong> {{ languageStore.t('ui.ball_with', 'Ball with:') }} {{ currentPlayerPosition }}
      </p>
      <p v-else-if="!isCelebrating">
        <strong>{{ languageStore.t('ui.opponent_turn', "Opponent's turn!") }}</strong>
      </p>
      <p v-if="canShoot && ballPossession === 'blue' && !isCelebrating" class="shoot-hint">
        {{ languageStore.t('ui.can_shoot_now', '⚽ You can shoot now!') }}
      </p>
      <p v-if="gameMessage" class="game-message" :class="{ 'goal-message': gameMessage.includes('GOAL') || gameMessage.includes('Goal') || gameMessage.includes('ΓΚΟΛ') || gameMessage.includes('TOR') }">
        {{ translatedGameMessage }}
      </p>
    </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useGameStore } from '../store/gameStore'
import { useLanguageStore } from '../store/languageStore'
import GameField from '../components/GameField.vue'
import ActionButtons from '../components/ActionButtons.vue'
import LanguageToggle from '../components/LanguageToggle.vue'
import TeamSelection from '../components/TeamSelection.vue'

const gameStore = useGameStore()
const languageStore = useLanguageStore()

// Watch for opponent possession and trigger opponent actions
watch(() => gameStore.ballPossession, (newVal) => {
  if (newVal === 'red' && gameStore.isOpponentActionPending) {
    gameStore.executeOpponentAction()
  }
})

// Also watch for opponent action pending flag
watch(() => gameStore.isOpponentActionPending, (pending) => {
  if (pending && gameStore.ballPossession === 'red') {
    gameStore.executeOpponentAction()
  }
})

const blueScore = computed(() => gameStore.blueScore)
const redScore = computed(() => gameStore.redScore)
const ballPossession = computed(() => gameStore.ballPossession)
const canShoot = computed(() => gameStore.canShoot)
const gameMessage = computed(() => gameStore.gameMessage)
const isCelebrating = computed(() => gameStore.isCelebrating)
const teamSelectionComplete = computed(() => gameStore.teamSelectionComplete)
const playerTeamInfo = computed(() => gameStore.playerTeamInfo)
const opponentTeamInfo = computed(() => gameStore.opponentTeamInfo)

const currentPlayerPosition = computed(() => {
  const pos = gameStore.ballPosition.player
  const positionNames = {
    gk: languageStore.t('ui.goalkeeper', 'Goalkeeper'),
    def: languageStore.t('ui.defender', 'Defender'),
    mid1: languageStore.t('ui.midfielder_1', 'Midfielder 1'),
    mid2: languageStore.t('ui.midfielder_2', 'Midfielder 2'),
    att: languageStore.t('ui.attacker', 'Attacker')
  }
  return positionNames[pos] || pos
})

// Translate game messages
const translatedGameMessage = computed(() => {
  const msg = gameMessage.value
  if (!msg) return ''
  
  // Map English messages to translation keys
  if (msg.includes('Shooting...')) return languageStore.t('game.shooting', 'Shooting...')
  if (msg.includes('Opponent shooting')) return languageStore.t('game.opponent_shooting', 'Opponent shooting...')
  if (msg.includes('Shot off target')) return languageStore.t('game.shot_off_target', 'Shot off target!')
  if (msg.includes('Opponent shot off target')) return languageStore.t('game.opponent_shot_off_target', 'Opponent shot off target!')
  if (msg.includes('Goalkeeper blocked') || msg.includes('Goalkeeper saves')) return languageStore.t('game.goalkeeper_blocked', 'Goalkeeper blocked!')
  if (msg.includes('Goal!') && !msg.includes('Red team')) return languageStore.t('game.goal_message', 'Goal!')
  if (msg.includes('GOAL! Red team scores')) return languageStore.t('game.red_team_scores', 'GOAL! Red team scores!')
  
  return msg
})

onMounted(() => {
  // Only initialize game after team selection is complete
  watch(() => gameStore.teamSelectionComplete, (complete) => {
    if (complete) {
      gameStore.initializeGame()
    }
  }, { immediate: true })
})
</script>

<style scoped>
.game-view {
  min-height: 100vh;
  background: #1a5f2f;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.game-header {
  width: 100%;
  max-width: 1200px;
  text-align: center;
  margin-bottom: 20px;
  color: white;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 15px;
}

.game-header h1 {
  font-size: 32px;
  margin: 0;
  flex: 1;
}

.score {
  display: flex;
  justify-content: center;
  gap: 30px;
  font-size: 24px;
  font-weight: bold;
}

.score-blue {
  color: #2196F3;
}

.score-red {
  color: #f44336;
}

.team-flag {
  font-size: 1.2em;
  margin-right: 8px;
  vertical-align: middle;
}

.game-info {
  margin-top: 20px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: white;
  text-align: center;
  max-width: 600px;
}

.game-info p {
  margin: 5px 0;
  font-size: 18px;
}

.shoot-hint {
  color: #FF9800;
  font-weight: bold;
  animation: pulse 1.5s ease infinite;
}

.game-message {
  margin-top: 10px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  font-weight: bold;
  font-size: 20px;
}

.goal-message {
  background: rgba(255, 215, 0, 0.3);
  color: #FFD700;
  font-size: 24px;
  animation: pulse 1s ease infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@media (max-width: 768px) {
  .game-view {
    padding: 10px;
  }
  
  .header-top {
    flex-direction: column;
    align-items: center;
  }
  
  .game-header h1 {
    font-size: 24px;
  }
  
  .score {
    font-size: 20px;
    gap: 20px;
  }
  
  .game-info {
    padding: 10px;
  }
  
  .game-info p {
    font-size: 16px;
  }
}
</style>

