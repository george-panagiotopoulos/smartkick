<template>
  <div class="team-selection-overlay">
    <div class="team-selection-container">
      <h1 class="selection-title">⚽ {{ languageStore.t('ui.select_teams', 'Select Teams') }}</h1>
      
      <div class="teams-section">
        <div class="team-selector">
          <h2>{{ languageStore.t('ui.your_team', 'Your Team') }}</h2>
          <div class="teams-grid">
            <div
              v-for="team in teams"
              :key="team.id"
              :class="['team-card', { selected: selectedPlayerTeam === team.id, disabled: selectedOpponentTeam === team.id }]"
              @click="selectPlayerTeam(team.id)"
            >
              <div class="team-flag">{{ team.flag }}</div>
              <div class="team-name">{{ team.name }}</div>
              <div class="team-colors">{{ team.colors }}</div>
            </div>
          </div>
        </div>

        <div class="vs-divider">
          <span>VS</span>
        </div>

        <div class="team-selector">
          <h2>{{ languageStore.t('ui.opponent_team', 'Opponent Team') }}</h2>
          <div class="teams-grid">
            <div
              v-for="team in teams"
              :key="team.id"
              :class="['team-card', { selected: selectedOpponentTeam === team.id, disabled: selectedPlayerTeam === team.id }]"
              @click="selectOpponentTeam(team.id)"
            >
              <div class="team-flag">{{ team.flag }}</div>
              <div class="team-name">{{ team.name }}</div>
              <div class="team-colors">{{ team.colors }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="selection-actions">
        <button
          class="settings-button"
          @click="showSettings = true"
        >
          ⚙️ {{ languageStore.t('ui.settings', 'Settings') }}
        </button>
        <button
          class="start-button"
          :disabled="!canStart"
          @click="startGame"
        >
          {{ languageStore.t('ui.start_game', 'Start Game') }}
        </button>
      </div>
      
      <!-- Settings Modal -->
      <div v-if="showSettings" class="settings-modal-overlay" @click.self="showSettings = false">
        <div class="settings-modal">
          <div class="settings-header">
            <h2>{{ languageStore.t('ui.settings', 'Settings') }}</h2>
            <button class="close-button" @click="showSettings = false">✕</button>
          </div>
          <div class="settings-content">
            <h3>{{ languageStore.t('ui.game_duration', 'Game Duration') }}</h3>
            <div class="duration-options">
              <label
                v-for="option in durationOptions"
                :key="option.value"
                :class="['duration-option', { selected: selectedDuration === option.value }]"
              >
                <input
                  type="radio"
                  :value="option.value"
                  v-model="selectedDuration"
                />
                <div class="option-content">
                  <div class="option-name">{{ option.label }}</div>
                  <div class="option-desc">{{ option.description }}</div>
                </div>
              </label>
            </div>
          </div>
          <div class="settings-footer">
            <button class="save-button" @click="saveSettings">
              {{ languageStore.t('ui.save', 'Save') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGameStore } from '../store/gameStore'
import { useLanguageStore } from '../store/languageStore'

const gameStore = useGameStore()
const languageStore = useLanguageStore()

const showSettings = ref(false)
const selectedDuration = ref('regular')

const durationOptions = computed(() => [
  {
    value: 'tiny',
    label: languageStore.t('ui.tiny', 'Tiny'),
    description: '10-15 actions'
  },
  {
    value: 'short',
    label: languageStore.t('ui.short', 'Short'),
    description: '40-50 actions'
  },
  {
    value: 'regular',
    label: languageStore.t('ui.regular', 'Regular'),
    description: '60-90 actions'
  },
  {
    value: 'long',
    label: languageStore.t('ui.long', 'Long'),
    description: '100-120 actions'
  }
])

// Load saved duration from localStorage
onMounted(() => {
  const savedDuration = localStorage.getItem('gameDuration')
  if (savedDuration && ['tiny', 'short', 'regular', 'long'].includes(savedDuration)) {
    selectedDuration.value = savedDuration
  }
})

function saveSettings() {
  localStorage.setItem('gameDuration', selectedDuration.value)
  gameStore.setGameDuration(selectedDuration.value)
  showSettings.value = false
}

const teams = [
  {
    id: 'brazil',
    name: 'Brazil',
    flag: '🇧🇷',
    colors: 'Yellow shirt, Green pants & socks'
  },
  {
    id: 'germany',
    name: 'Germany',
    flag: '🇩🇪',
    colors: 'Orange shirt, Black pants & socks'
  },
  {
    id: 'england',
    name: 'England',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    colors: 'White shirt, Red pants & socks'
  },
  {
    id: 'spain',
    name: 'Spain',
    flag: '🇪🇸',
    colors: 'Yellow shirt, Orange pants & socks'
  },
  {
    id: 'greece',
    name: 'Greece',
    flag: '🇬🇷',
    colors: 'Blue shirt, White pants & socks'
  },
  {
    id: 'italy',
    name: 'Italy',
    flag: '🇮🇹',
    colors: 'Blue shirt, Green pants & socks'
  },
  {
    id: 'argentina',
    name: 'Argentina',
    flag: '🇦🇷',
    colors: 'Light blue shirt, White pants & socks'
  },
  {
    id: 'france',
    name: 'France',
    flag: '🇫🇷',
    colors: 'White shirt, Blue pants & socks'
  },
  {
    id: 'netherlands',
    name: 'Netherlands',
    flag: '🇳🇱',
    colors: 'Orange shirt, Orange pants & socks'
  }
]

const selectedPlayerTeam = ref(null)
const selectedOpponentTeam = ref(null)

const canStart = computed(() => {
  return selectedPlayerTeam.value !== null && 
         selectedOpponentTeam.value !== null &&
         selectedPlayerTeam.value !== selectedOpponentTeam.value
})

function selectPlayerTeam(teamId) {
  if (selectedOpponentTeam.value === teamId) return
  selectedPlayerTeam.value = teamId
}

function selectOpponentTeam(teamId) {
  if (selectedPlayerTeam.value === teamId) return
  selectedOpponentTeam.value = teamId
}

function startGame() {
  if (!canStart.value) return
  
  gameStore.setTeams(selectedPlayerTeam.value, selectedOpponentTeam.value)
  gameStore.setGameDuration(selectedDuration.value) // Set duration before starting
  gameStore.setTeamSelectionComplete(true)
}
</script>

<style scoped>
.team-selection-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
}

.team-selection-container {
  background: white;
  border-radius: 20px;
  padding: 30px;
  max-width: 1200px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.selection-title {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 2.5em;
}

.teams-section {
  display: flex;
  gap: 30px;
  align-items: flex-start;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.team-selector {
  flex: 1;
  min-width: 300px;
}

.team-selector h2 {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
  font-size: 1.5em;
}

.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 15px;
}

.team-card {
  background: #f5f5f5;
  border: 3px solid transparent;
  border-radius: 12px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.team-card:hover:not(.disabled) {
  background: #e8f5e9;
  border-color: #4CAF50;
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.team-card.selected {
  background: #c8e6c9;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.3);
}

.team-card.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #f0f0f0;
}

.team-flag {
  font-size: 3em;
  margin-bottom: 10px;
}

.team-name {
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
  font-size: 1em;
}

.team-colors {
  font-size: 0.75em;
  color: #666;
  font-style: italic;
}

.vs-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2em;
  font-weight: bold;
  color: #666;
  min-width: 80px;
}

.vs-divider span {
  background: white;
  padding: 10px 20px;
  border-radius: 50%;
  border: 3px solid #4CAF50;
}

.selection-actions {
  text-align: center;
  margin-top: 30px;
}

.start-button {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 15px 40px;
  font-size: 1.2em;
  font-weight: bold;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 200px;
}

.start-button:hover:not(:disabled) {
  background: #45a049;
  transform: scale(1.05);
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
}

.start-button:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.settings-button {
  background: #666;
  color: white;
  border: none;
  padding: 15px 30px;
  font-size: 1em;
  font-weight: bold;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 15px;
}

.settings-button:hover {
  background: #555;
  transform: scale(1.05);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.settings-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 20px;
}

.settings-modal {
  background: white;
  border-radius: 20px;
  padding: 30px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.settings-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.8em;
}

.close-button {
  background: transparent;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-button:hover {
  background: #f0f0f0;
  color: #333;
}

.settings-content h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 1.3em;
}

.duration-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.duration-option {
  display: flex;
  align-items: center;
  padding: 15px;
  border: 3px solid #ddd;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f9f9f9;
}

.duration-option:hover {
  background: #f0f0f0;
  border-color: #4CAF50;
}

.duration-option.selected {
  background: #e8f5e9;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.duration-option input[type="radio"] {
  margin-right: 15px;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.option-content {
  flex: 1;
}

.option-name {
  font-weight: bold;
  color: #333;
  font-size: 1.1em;
  margin-bottom: 5px;
}

.option-desc {
  color: #666;
  font-size: 0.9em;
}

.settings-footer {
  margin-top: 30px;
  text-align: right;
}

.save-button {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 12px 30px;
  font-size: 1em;
  font-weight: bold;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.save-button:hover {
  background: #45a049;
  transform: scale(1.05);
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
}

@media (max-width: 768px) {
  .teams-section {
    flex-direction: column;
  }

  .vs-divider {
    min-width: auto;
    padding: 20px 0;
  }

  .teams-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }

  .team-card {
    min-height: 120px;
    padding: 10px;
  }

  .team-flag {
    font-size: 2em;
  }

  .selection-title {
    font-size: 2em;
  }
}
</style>

