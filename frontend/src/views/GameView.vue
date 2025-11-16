<template>
  <div class="game-view">
    <TeamSelection v-if="!teamSelectionComplete" />

    <!-- Tournament Bracket -->
    <TournamentBracket
      v-if="showBracket"
      @close="showBracket = false"
    />

    <!-- Trophy Ceremony -->
    <TrophyCeremony
      v-if="tournamentStore.showTrophyCeremony"
      @close="handleTrophyCeremonyClose"
    />

    <template v-else>
      <div class="game-header">
        <div class="header-top">
          <h1>SmartKick</h1>
          <div class="controls">
            <button
              v-if="tournamentStore.isTournamentMode"
              class="bracket-button"
              @click="showBracket = true"
            >
              🏆 Bracket
            </button>
            <LanguageToggle />
            <CategorySelector />
          </div>
        </div>

        <!-- Tournament Round Info -->
        <div v-if="tournamentStore.isTournamentMode" class="tournament-info">
          <h2>{{ tournamentStore.roundName }}</h2>
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
      
      <!-- Game Over Modal -->
      <GameOverModal :show="isGameOver" />
    
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
import { ref, computed, onMounted, watch } from 'vue'
import { useGameStore } from '../store/gameStore'
import { useLanguageStore } from '../store/languageStore'
import { useTournamentStore } from '../store/tournamentStore'
import GameField from '../components/GameField.vue'
import ActionButtons from '../components/ActionButtons.vue'
import LanguageToggle from '../components/LanguageToggle.vue'
import CategorySelector from '../components/CategorySelector.vue'
import TeamSelection from '../components/TeamSelection.vue'
import GameOverModal from '../components/GameOverModal.vue'
import TournamentBracket from '../components/TournamentBracket.vue'
import TrophyCeremony from '../components/TrophyCeremony.vue'

const gameStore = useGameStore()
const languageStore = useLanguageStore()
const tournamentStore = useTournamentStore()

const showBracket = ref(false)

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
const isGameOver = computed(() => gameStore.isGameOver)

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

// Watch for game over to handle tournament progression
watch(() => gameStore.isGameOver, (gameOver) => {
  if (gameOver && tournamentStore.isTournamentMode) {
    handleTournamentMatchEnd()
  }
})

function handleTournamentMatchEnd() {
  // Determine winner based on final score
  const playerScore = gameStore.blueScore
  const opponentScore = gameStore.redScore

  // Handle draws - player advances in case of draw
  let winner
  if (playerScore >= opponentScore) {
    winner = tournamentStore.playerTeamId
  } else {
    winner = tournamentStore.currentOpponent
  }

  // Record match result
  tournamentStore.recordPlayerMatchResult(winner, playerScore, opponentScore)

  // Check if player lost
  if (winner !== tournamentStore.playerTeamId) {
    // Player eliminated - GameOverModal will show elimination message
    // Don't advance tournament, just wait for user to click "New Game"
    return
  }

  // Player won/drew - check if round is complete
  if (tournamentStore.isRoundComplete()) {
    // Advance to next round
    tournamentStore.advanceToNextRound()

    // Check if player is still in tournament
    if (tournamentStore.isPlayerInTournament()) {
      // Player advanced - prepare next match
      setTimeout(() => {
        // Show bracket before next match
        showBracket.value = true

        // After closing bracket, start next match
        setTimeout(() => {
          const opponent = tournamentStore.currentOpponent
          gameStore.setTeams(tournamentStore.playerTeamId, opponent)
          gameStore.resetGame()
          gameStore.setTeamSelectionComplete(true)
          gameStore.initializeGame()

          // Simulate other matches in new round
          tournamentStore.simulateRoundMatches()
        }, 3000)
      }, 3000)
    } else if (tournamentStore.tournamentWinner === tournamentStore.playerTeamId) {
      // Player won tournament - show trophy ceremony
      setTimeout(() => {
        tournamentStore.showTrophyCeremony = true
      }, 3000)
    }
  }
}

function handleTrophyCeremonyClose() {
  tournamentStore.showTrophyCeremony = false
  showBracket.value = true
}

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

.controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bracket-button {
  background: #FFD700;
  color: #333;
  border: none;
  padding: 10px 20px;
  font-size: 1em;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 3px 10px rgba(255, 215, 0, 0.4);
}

.bracket-button:hover {
  background: #FFC700;
  transform: scale(1.05);
  box-shadow: 0 5px 15px rgba(255, 215, 0, 0.6);
}

.tournament-info {
  margin: 15px 0;
  padding: 15px;
  background: rgba(255, 215, 0, 0.2);
  border-radius: 10px;
  border: 2px solid #FFD700;
}

.tournament-info h2 {
  margin: 0;
  color: white;
  font-size: 1.5em;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
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

