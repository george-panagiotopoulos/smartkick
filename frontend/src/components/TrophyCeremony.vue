<template>
  <div class="trophy-ceremony-overlay">
    <div class="trophy-ceremony">
      <div class="confetti-container">
        <div v-for="i in 50" :key="i" class="confetti"></div>
      </div>

      <div class="ceremony-content">
        <h1 class="ceremony-title">🏆 CHAMPIONS! 🏆</h1>

        <div class="trophy-animation">
          <div class="trophy">🏆</div>
        </div>

        <div class="winner-info">
          <div class="winner-flag">{{ getTeamInfo(tournamentStore.playerTeamId).flag }}</div>
          <div class="winner-name">{{ getTeamInfo(tournamentStore.playerTeamId).name }}</div>
        </div>

        <div class="celebration-message">
          <p>TOURNAMENT WINNERS!</p>
          <p class="sub-message">You've conquered all opponents and lifted the trophy!</p>
        </div>

        <div class="tournament-summary">
          <h3>Tournament Results</h3>
          <div class="summary-row">
            <span>Quarter Final:</span>
            <span class="result-score">{{ getMatchResult('quarterfinal') }}</span>
          </div>
          <div class="summary-row">
            <span>Semi Final:</span>
            <span class="result-score">{{ getMatchResult('semifinal') }}</span>
          </div>
          <div class="summary-row">
            <span>Final:</span>
            <span class="result-score">{{ getMatchResult('final') }}</span>
          </div>
        </div>

        <button class="continue-button" @click="close">
          Continue
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTournamentStore } from '../store/tournamentStore'
import { useGameStore } from '../store/gameStore'

const tournamentStore = useTournamentStore()
const gameStore = useGameStore()

const emit = defineEmits(['close'])

function close() {
  emit('close')
}

function getTeamInfo(teamId) {
  return gameStore.getTeamInfo(teamId)
}

function getMatchResult(round) {
  let match = null

  if (round === 'quarterfinal') {
    match = tournamentStore.quarterfinals.find(m =>
      m.team1 === tournamentStore.playerTeamId || m.team2 === tournamentStore.playerTeamId
    )
  } else if (round === 'semifinal') {
    match = tournamentStore.semifinals.find(m =>
      m.team1 === tournamentStore.playerTeamId || m.team2 === tournamentStore.playerTeamId
    )
  } else if (round === 'final') {
    match = tournamentStore.final
  }

  if (!match) return '-'

  const playerScore = match.team1 === tournamentStore.playerTeamId ? match.score1 : match.score2
  const opponentScore = match.team1 === tournamentStore.playerTeamId ? match.score2 : match.score1
  const opponentTeam = match.team1 === tournamentStore.playerTeamId ? match.team2 : match.team1

  return `${playerScore} - ${opponentScore} vs ${getTeamInfo(opponentTeam).flag} ${getTeamInfo(opponentTeam).name}`
}
</script>

<style scoped>
.trophy-ceremony-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1a237e 0%, #0d47a1 50%, #01579b 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3000;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.trophy-ceremony {
  text-align: center;
  max-width: 800px;
  width: 100%;
  padding: 40px;
  position: relative;
}

.confetti-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.confetti {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #FFD700;
  top: -10px;
  animation: fall linear infinite;
}

.confetti:nth-child(odd) {
  background: #FF6B6B;
}

.confetti:nth-child(3n) {
  background: #4ECDC4;
}

.confetti:nth-child(4n) {
  background: #95E1D3;
}

.confetti:nth-child(5n) {
  background: #F38181;
}

@keyframes fall {
  to {
    transform: translateY(100vh) rotate(360deg);
  }
}

/* Generate random positions and durations for confetti */
.confetti:nth-child(1) { left: 2%; animation-duration: 3s; animation-delay: 0s; }
.confetti:nth-child(2) { left: 6%; animation-duration: 4s; animation-delay: 0.2s; }
.confetti:nth-child(3) { left: 10%; animation-duration: 3.5s; animation-delay: 0.4s; }
.confetti:nth-child(4) { left: 14%; animation-duration: 4.5s; animation-delay: 0.1s; }
.confetti:nth-child(5) { left: 18%; animation-duration: 3.2s; animation-delay: 0.3s; }
.confetti:nth-child(6) { left: 22%; animation-duration: 4.2s; animation-delay: 0.5s; }
.confetti:nth-child(7) { left: 26%; animation-duration: 3.8s; animation-delay: 0.2s; }
.confetti:nth-child(8) { left: 30%; animation-duration: 4.8s; animation-delay: 0.4s; }
.confetti:nth-child(9) { left: 34%; animation-duration: 3.3s; animation-delay: 0.1s; }
.confetti:nth-child(10) { left: 38%; animation-duration: 4.3s; animation-delay: 0.3s; }
.confetti:nth-child(11) { left: 42%; animation-duration: 3.7s; animation-delay: 0s; }
.confetti:nth-child(12) { left: 46%; animation-duration: 4.7s; animation-delay: 0.2s; }
.confetti:nth-child(13) { left: 50%; animation-duration: 3.4s; animation-delay: 0.4s; }
.confetti:nth-child(14) { left: 54%; animation-duration: 4.4s; animation-delay: 0.1s; }
.confetti:nth-child(15) { left: 58%; animation-duration: 3.9s; animation-delay: 0.3s; }
.confetti:nth-child(16) { left: 62%; animation-duration: 4.9s; animation-delay: 0.5s; }
.confetti:nth-child(17) { left: 66%; animation-duration: 3.1s; animation-delay: 0.2s; }
.confetti:nth-child(18) { left: 70%; animation-duration: 4.1s; animation-delay: 0.4s; }
.confetti:nth-child(19) { left: 74%; animation-duration: 3.6s; animation-delay: 0.1s; }
.confetti:nth-child(20) { left: 78%; animation-duration: 4.6s; animation-delay: 0.3s; }
.confetti:nth-child(21) { left: 82%; animation-duration: 3.5s; animation-delay: 0s; }
.confetti:nth-child(22) { left: 86%; animation-duration: 4.5s; animation-delay: 0.2s; }
.confetti:nth-child(23) { left: 90%; animation-duration: 3.2s; animation-delay: 0.4s; }
.confetti:nth-child(24) { left: 94%; animation-duration: 4.2s; animation-delay: 0.1s; }
.confetti:nth-child(25) { left: 98%; animation-duration: 3.8s; animation-delay: 0.3s; }

.ceremony-content {
  background: white;
  border-radius: 30px;
  padding: 50px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.8s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.ceremony-title {
  font-size: 3.5em;
  color: #FFD700;
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.3);
  margin: 0 0 30px 0;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.trophy-animation {
  margin: 30px 0;
}

.trophy {
  font-size: 8em;
  display: inline-block;
  animation: rotateTrophy 3s ease-in-out infinite, float 2s ease-in-out infinite;
  filter: drop-shadow(0 10px 20px rgba(255, 215, 0, 0.5));
}

@keyframes rotateTrophy {
  0%, 100% { transform: rotateY(0deg) rotateZ(-5deg); }
  50% { transform: rotateY(360deg) rotateZ(5deg); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

.winner-info {
  margin: 30px 0;
}

.winner-flag {
  font-size: 5em;
  margin-bottom: 15px;
}

.winner-name {
  font-size: 2.5em;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.celebration-message {
  margin: 30px 0;
}

.celebration-message p {
  font-size: 1.8em;
  font-weight: bold;
  color: #4CAF50;
  margin: 10px 0;
}

.sub-message {
  font-size: 1.2em !important;
  color: #666 !important;
  font-weight: normal !important;
}

.tournament-summary {
  background: #f5f5f5;
  border-radius: 15px;
  padding: 25px;
  margin: 30px 0;
}

.tournament-summary h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 1.5em;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #ddd;
  font-size: 1.1em;
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-row span:first-child {
  font-weight: bold;
  color: #333;
}

.result-score {
  color: #4CAF50;
  font-weight: bold;
}

.continue-button {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  border: none;
  padding: 18px 50px;
  font-size: 1.3em;
  font-weight: bold;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 30px;
  box-shadow: 0 5px 20px rgba(76, 175, 80, 0.4);
}

.continue-button:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 30px rgba(76, 175, 80, 0.6);
}

@media (max-width: 768px) {
  .ceremony-content {
    padding: 30px 20px;
  }

  .ceremony-title {
    font-size: 2em;
  }

  .trophy {
    font-size: 5em;
  }

  .winner-flag {
    font-size: 3em;
  }

  .winner-name {
    font-size: 1.8em;
  }

  .celebration-message p {
    font-size: 1.3em;
  }
}
</style>
