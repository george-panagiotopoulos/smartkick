<template>
  <div>
    <div v-if="gameStore.isGameOver" class="game-over-message">
      <h2>Game Over!</h2>
      <p>{{ gameStore.gameOverReason }}</p>
      <p>Final Score: Blue {{ gameStore.blueScore }} - {{ gameStore.redScore }} Red</p>
    </div>
    <div class="action-buttons" v-else-if="isPlayerTurn && !isCelebrating">
      <button
        class="action-btn pass-btn"
        @click="handlePass"
        :disabled="isProcessing || !canPass || gameStore.isShooting"
      >
        {{ languageStore.t('ui.pass', 'Pass') }}
      </button>
      <button
        class="action-btn dribble-btn"
        @click="handleDribble"
        :disabled="isProcessing || !canDribble || gameStore.isShooting"
      >
        {{ languageStore.t('ui.dribble', 'Dribble') }}
      </button>
      <button
        class="action-btn shoot-btn"
        @click="handleShoot"
        :disabled="!canShoot || isProcessing || gameStore.isShooting"
      >
        {{ languageStore.t('ui.shoot', 'Shoot') }}
      </button>
    </div>
    <div v-else-if="!isCelebrating" class="opponent-turn">
      <p>{{ languageStore.t('ui.opponent_turn_text', "Opponent's turn...") }}</p>
      <button
        v-if="canTackle"
        class="action-btn tackle-btn"
        @click="handleTackle"
        :disabled="isProcessing"
      >
        {{ languageStore.t('ui.tackle', 'Tackle') }}
      </button>
    </div>
    <div v-else class="celebrating">
      <p>{{ languageStore.t('ui.celebrating_goal', '🎉 Celebrating goal! 🎉') }}</p>
    </div>
    
    <!-- Question Modal -->
    <QuestionModal
      :show="showQuestionModal"
      :question="currentQuestion"
      @answer="handleQuestionAnswer"
    />
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '../store/gameStore'
import { useLanguageStore } from '../store/languageStore'
import { checkActionSuccess } from '../services/gameLogic'
import { executeAction, getRandomQuestion, getQuestionCategories } from '../services/api'
import QuestionModal from './QuestionModal.vue'

const gameStore = useGameStore()
const languageStore = useLanguageStore()
const { currentLanguage } = storeToRefs(languageStore)

const availableCategories = ref([])

const isProcessing = ref(false)
const showQuestionModal = ref(false)
const currentQuestion = ref(null)
const pendingAction = ref(null) // Store the action type while question is shown

const isPlayerTurn = computed(() => gameStore.ballPossession === 'blue' && !gameStore.isGameOver)
const ballPossession = computed(() => gameStore.ballPossession)
const canShoot = computed(() => gameStore.canShoot && gameStore.ballPossession === 'blue' && !gameStore.isGameOver)
const canTackle = computed(() => {
  if (isPlayerTurn.value || gameStore.isCelebrating || gameStore.isGameOver) return false
  if (gameStore.ballPosition.player === 'gk') return false
  
  // Can't tackle when opponent is at position 2 (past defender, shooting)
  const opponent = gameStore.redPlayers
  const opponentPlayerKey = gameStore.ballPosition.player
  const opponentFieldPos = opponent[opponentPlayerKey]?.fieldPosition
  if (opponentFieldPos === 2) return false
  
  return true
})
const isCelebrating = computed(() => gameStore.isCelebrating)

// Check if pass/dribble are available based on field position
const canPass = computed(() => {
  if (!isPlayerTurn.value) return false
  const team = gameStore.bluePlayers
  const currentPlayerKey = gameStore.ballPosition.player
  const currentFieldPos = team[currentPlayerKey]?.fieldPosition
  
  if (!currentFieldPos) return false
  
  // Can pass from goalkeeper (position 1), midfielders (3, 4)
  // Also can pass if midfielder dribbled past opponent to positions 8 or 9
  // Can't pass if at position 7 (past defender) or position 5 (attacker, should shoot/dribble)
  if (currentFieldPos === 7 || currentFieldPos === 5) return false
  return currentFieldPos === 1 || currentFieldPos === 3 || currentFieldPos === 4 || currentFieldPos === 8 || currentFieldPos === 9
})

const canDribble = computed(() => {
  if (!isPlayerTurn.value) return false
  const team = gameStore.bluePlayers
  const currentPlayerKey = gameStore.ballPosition.player
  const currentFieldPos = team[currentPlayerKey]?.fieldPosition
  
  if (!currentFieldPos) return false
  
  // Can dribble if at position 5 (attacker) or midfield positions (3, 4)
  // Also can dribble if midfielder dribbled past opponent to positions 8 or 9
  // Can't dribble if at position 7 (past defender, should only shoot) or position 1 (goalkeeper)
  if (currentFieldPos === 7 || currentFieldPos === 1) return false
  return currentFieldPos === 5 || currentFieldPos === 3 || currentFieldPos === 4 || currentFieldPos === 8 || currentFieldPos === 9
})

// Load available categories on mount
onMounted(async () => {
  try {
    const categories = await getQuestionCategories()
    availableCategories.value = categories
    console.log('Available question categories:', categories)
  } catch (error) {
    console.error('Error loading categories:', error)
    // Fallback to default categories
    availableCategories.value = ['math_1', 'math_2', 'english_1', 'german_1', 'greek_1', 'geography_1']
  }
})

async function showQuestion(actionType) {
  pendingAction.value = actionType
  
  // Get current language using storeToRefs for proper reactivity
  const language = currentLanguage.value || 'en'
  
  // Select a random category from available categories
  let category = 'math_1' // Default fallback
  if (availableCategories.value.length > 0) {
    // Randomly select a category
    const randomIndex = Math.floor(Math.random() * availableCategories.value.length)
    category = availableCategories.value[randomIndex]
  }
  
  console.log('Fetching question with language:', language, 'for category:', category) // Debug log
  
  try {
    // Fetch random question from backend
    const question = await getRandomQuestion(category, language)
    
    if (question) {
      // Transform API response to format expected by QuestionModal
      currentQuestion.value = {
        text: question.question,
        options: question.answers,
        correctAnswer: question.correct_answer,
        id: question.id,
        category: question.category
      }
    } else {
      // Fallback to default question if API fails
      currentQuestion.value = {
        text: 'What is 1+1?',
        options: ['0', '1', '2', '3'],
        correctAnswer: 2
      }
    }
  } catch (error) {
    console.error('Error fetching question:', error)
    // Fallback to default question on error
    currentQuestion.value = {
      text: 'What is 1+1?',
      options: ['0', '1', '2', '3'],
      correctAnswer: 2
    }
  }
  
  showQuestionModal.value = true
}

async function handleQuestionAnswer(answerData) {
  const { correct } = answerData
  const actionType = pendingAction.value
  
  showQuestionModal.value = false
  isProcessing.value = true
  
  // Call backend API to execute action with question result
  let actionSuccess = false
  if (gameStore.gameId) {
    try {
      const result = await executeAction(gameStore.gameId, actionType, correct)
      actionSuccess = result.action_success || false
      
      // Debug logging
      console.log(`Action: ${actionType}, Correct: ${correct}, Success: ${actionSuccess}, Probability: ${result.probability}`)
      
      // Note: Probability returned is the adjusted value for this action only
      // Don't permanently update the store - adjustment is temporary per action
    } catch (error) {
      console.error('Error executing action:', error)
      // Fallback: use local probability check with adjustment
      const baseProb = gameStore.probabilities[actionType] || 0.5
      
      // Apply ADDITIVE adjustment based on question result
      let adjustedProb = baseProb
      if (correct) {
        // Additive increase: +15% for all actions
        adjustedProb = Math.min(1.0, baseProb + 0.15)
      } else {
        // Additive decrease: -25% for all actions
        adjustedProb = Math.max(0.0, baseProb - 0.25)
      }
      
      // Check success (only if question was correct)
      actionSuccess = correct && checkActionSuccess(actionType, adjustedProb)
      
      // Debug logging
      console.log(`[FALLBACK ERROR] Action: ${actionType}, Correct: ${correct}, BaseProb: ${baseProb}, AdjustedProb: ${adjustedProb}, Success: ${actionSuccess}`)
    }
  } else {
    // Fallback: use local probability check with adjustment
    const baseProb = gameStore.probabilities[actionType] || 0.5
    
    // Apply ADDITIVE adjustment based on question result
    let adjustedProb = baseProb
    if (correct) {
      // Additive increase: +15% for all actions
      adjustedProb = Math.min(1.0, baseProb + 0.15)
    } else {
      // Additive decrease: -25% for all actions
      adjustedProb = Math.max(0.0, baseProb - 0.25)
    }
    
    // Check success (only if question was correct)
    actionSuccess = correct && checkActionSuccess(actionType, adjustedProb)
    
    // Debug logging
    console.log(`[NO BACKEND] Action: ${actionType}, Correct: ${correct}, BaseProb: ${baseProb}, AdjustedProb: ${adjustedProb}, Success: ${actionSuccess}`)
  }
  
  // Execute the action based on type
  switch (actionType) {
    case 'pass':
      gameStore.executePass(actionSuccess)
      break
    case 'dribble':
      gameStore.executeDribble(actionSuccess)
      break
    case 'shoot':
      gameStore.executeShoot(correct) // For shoot, pass question correctness
      break
    case 'tackle':
      gameStore.executeTackle(actionSuccess)
      break
  }
  
  pendingAction.value = null
  isProcessing.value = false
}

function handlePass() {
  if (isProcessing.value) return
  showQuestion('pass')
}

function handleDribble() {
  if (isProcessing.value) return
  showQuestion('dribble')
}

function handleShoot() {
  if (isProcessing.value || !canShoot.value) return
  
  // Set shooter to shooting stance before action
  const team = gameStore.ballPossession === 'blue' ? gameStore.bluePlayers : gameStore.redPlayers
  const currentPlayerKey = gameStore.ballPosition.player
  if (team[currentPlayerKey]) {
    team[currentPlayerKey].stance = 'shooting'
  }
  
  showQuestion('shoot')
}

function handleTackle() {
  if (isProcessing.value || !canTackle.value) return
  showQuestion('tackle')
}
</script>

<style scoped>
.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  padding: 20px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 15px 30px;
  font-size: 18px;
  font-weight: bold;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

.pass-btn {
  background: #4CAF50;
  color: white;
}

.pass-btn:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.3);
}

.dribble-btn {
  background: #2196F3;
  color: white;
}

.dribble-btn:hover:not(:disabled) {
  background: #0b7dda;
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.3);
}

.shoot-btn {
  background: #FF9800;
  color: white;
}

.shoot-btn:hover:not(:disabled) {
  background: #e68900;
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.3);
}

.tackle-btn {
  background: #f44336;
  color: white;
  margin-top: 10px;
}

.tackle-btn:hover:not(:disabled) {
  background: #da190b;
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.3);
}

  .action-btn:disabled {
    background: #cccccc;
    color: #666666;
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  .game-over-message {
    text-align: center;
    padding: 30px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 15px;
    margin: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }
  
  .game-over-message h2 {
    color: #f44336;
    font-size: 32px;
    margin-bottom: 15px;
  }
  
  .game-over-message p {
    font-size: 20px;
    color: #333;
    margin: 10px 0;
  }
  
  .opponent-turn {
  text-align: center;
  padding: 20px;
  font-size: 20px;
  color: white;
  font-weight: bold;
}

@media (max-width: 768px) {
  .action-buttons {
    gap: 10px;
    padding: 15px;
  }
  
  .action-btn {
    padding: 12px 20px;
    font-size: 16px;
    min-width: 100px;
  }
}
</style>

