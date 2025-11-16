<template>
  <div class="tournament-bracket-overlay" @click.self="close">
    <div class="tournament-bracket">
      <div class="bracket-header">
        <h2>🏆 Tournament Bracket</h2>
        <button class="close-button" @click="close">✕</button>
      </div>

      <div class="bracket-content">
        <div class="round-container">
          <!-- Quarter Finals -->
          <div class="round">
            <h3>Quarter Finals</h3>
            <div class="matches">
              <div
                v-for="match in tournamentStore.quarterfinals"
                :key="match.match"
                :class="['match-card', { 'player-match': isPlayerMatch(match) }]"
              >
                <div :class="['team', { winner: match.winner === match.team1 }]">
                  <span class="team-flag">{{ getTeamInfo(match.team1).flag }}</span>
                  <span class="team-name">{{ getTeamInfo(match.team1).name }}</span>
                  <span class="score">{{ match.score1 !== null ? match.score1 : '-' }}</span>
                </div>
                <div :class="['team', { winner: match.winner === match.team2 }]">
                  <span class="team-flag">{{ getTeamInfo(match.team2).flag }}</span>
                  <span class="team-name">{{ getTeamInfo(match.team2).name }}</span>
                  <span class="score">{{ match.score2 !== null ? match.score2 : '-' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Semi Finals -->
          <div class="round">
            <h3>Semi Finals</h3>
            <div class="matches">
              <div
                v-for="match in tournamentStore.semifinals"
                :key="match.match"
                :class="['match-card', { 'player-match': isPlayerMatch(match), 'upcoming': !match.team1 }]"
              >
                <div :class="['team', { winner: match.winner === match.team1 }]">
                  <span class="team-flag">{{ match.team1 ? getTeamInfo(match.team1).flag : '?' }}</span>
                  <span class="team-name">{{ match.team1 ? getTeamInfo(match.team1).name : 'TBD' }}</span>
                  <span class="score">{{ match.score1 !== null ? match.score1 : '-' }}</span>
                </div>
                <div :class="['team', { winner: match.winner === match.team2 }]">
                  <span class="team-flag">{{ match.team2 ? getTeamInfo(match.team2).flag : '?' }}</span>
                  <span class="team-name">{{ match.team2 ? getTeamInfo(match.team2).name : 'TBD' }}</span>
                  <span class="score">{{ match.score2 !== null ? match.score2 : '-' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Final -->
          <div class="round">
            <h3>Final</h3>
            <div class="matches">
              <div :class="['match-card', 'final-match', { 'player-match': isPlayerMatch(tournamentStore.final), 'upcoming': !tournamentStore.final.team1 }]">
                <div :class="['team', { winner: tournamentStore.final.winner === tournamentStore.final.team1 }]">
                  <span class="team-flag">{{ tournamentStore.final.team1 ? getTeamInfo(tournamentStore.final.team1).flag : '?' }}</span>
                  <span class="team-name">{{ tournamentStore.final.team1 ? getTeamInfo(tournamentStore.final.team1).name : 'TBD' }}</span>
                  <span class="score">{{ tournamentStore.final.score1 !== null ? tournamentStore.final.score1 : '-' }}</span>
                </div>
                <div :class="['team', { winner: tournamentStore.final.winner === tournamentStore.final.team2 }]">
                  <span class="team-flag">{{ tournamentStore.final.team2 ? getTeamInfo(tournamentStore.final.team2).flag : '?' }}</span>
                  <span class="team-name">{{ tournamentStore.final.team2 ? getTeamInfo(tournamentStore.final.team2).name : 'TBD' }}</span>
                  <span class="score">{{ tournamentStore.final.score2 !== null ? tournamentStore.final.score2 : '-' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Current Round Info -->
        <div v-if="!tournamentStore.tournamentWinner" class="current-round-info">
          <h3>{{ tournamentStore.roundName }}</h3>
          <p v-if="tournamentStore.getCurrentPlayerMatch()">
            Your match: {{ getTeamInfo(tournamentStore.playerTeamId).flag }} vs {{ getTeamInfo(tournamentStore.currentOpponent).flag }}
          </p>
        </div>

        <!-- Tournament Winner -->
        <div v-if="tournamentStore.tournamentWinner" class="winner-announcement">
          <h2>🏆 Tournament Winner 🏆</h2>
          <div class="winner-team">
            <span class="winner-flag">{{ getTeamInfo(tournamentStore.tournamentWinner).flag }}</span>
            <span class="winner-name">{{ getTeamInfo(tournamentStore.tournamentWinner).name }}</span>
          </div>
        </div>
      </div>

      <div class="bracket-footer">
        <button class="close-footer-button" @click="close">Close</button>
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

function isPlayerMatch(match) {
  return match.team1 === tournamentStore.playerTeamId || match.team2 === tournamentStore.playerTeamId
}

function getTeamInfo(teamId) {
  return gameStore.getTeamInfo(teamId)
}
</script>

<style scoped>
.tournament-bracket-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 20px;
}

.tournament-bracket {
  background: white;
  border-radius: 20px;
  padding: 30px;
  max-width: 1400px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.bracket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.bracket-header h2 {
  margin: 0;
  color: #333;
  font-size: 2em;
}

.close-button {
  background: transparent;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 40px;
  height: 40px;
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

.bracket-content {
  margin-bottom: 20px;
}

.round-container {
  display: flex;
  gap: 30px;
  justify-content: space-between;
  overflow-x: auto;
  padding: 20px 0;
}

.round {
  flex: 1;
  min-width: 250px;
}

.round h3 {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
  font-size: 1.3em;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 10px;
}

.matches {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.match-card {
  background: #f9f9f9;
  border: 2px solid #ddd;
  border-radius: 10px;
  padding: 15px;
  transition: all 0.3s ease;
}

.match-card.player-match {
  background: #e3f2fd;
  border-color: #2196F3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.match-card.upcoming {
  opacity: 0.6;
}

.match-card.final-match {
  background: linear-gradient(135deg, #fff9c4 0%, #fff 100%);
  border-color: #FFD700;
  border-width: 3px;
}

.team {
  display: flex;
  align-items: center;
  padding: 10px;
  margin: 5px 0;
  background: white;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.team.winner {
  background: #c8e6c9;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.team-flag {
  font-size: 1.5em;
  margin-right: 10px;
}

.team-name {
  flex: 1;
  color: #333;
  font-size: 1em;
}

.score {
  font-size: 1.2em;
  font-weight: bold;
  color: #333;
  min-width: 30px;
  text-align: center;
}

.current-round-info {
  text-align: center;
  margin-top: 30px;
  padding: 20px;
  background: #e3f2fd;
  border-radius: 10px;
  border: 2px solid #2196F3;
}

.current-round-info h3 {
  margin: 0 0 10px 0;
  color: #1976D2;
  font-size: 1.5em;
}

.current-round-info p {
  margin: 0;
  color: #333;
  font-size: 1.1em;
}

.winner-announcement {
  text-align: center;
  margin-top: 30px;
  padding: 30px;
  background: linear-gradient(135deg, #FFD700 0%, #FFA000 100%);
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(255, 215, 0, 0.5);
}

.winner-announcement h2 {
  margin: 0 0 20px 0;
  color: white;
  font-size: 2em;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.winner-team {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.winner-flag {
  font-size: 3em;
}

.winner-name {
  font-size: 2em;
  font-weight: bold;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.bracket-footer {
  text-align: center;
  margin-top: 20px;
}

.close-footer-button {
  background: #666;
  color: white;
  border: none;
  padding: 12px 30px;
  font-size: 1em;
  font-weight: bold;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-footer-button:hover {
  background: #555;
  transform: scale(1.05);
}

@media (max-width: 1024px) {
  .round-container {
    flex-direction: column;
  }

  .round {
    min-width: 100%;
  }
}
</style>
