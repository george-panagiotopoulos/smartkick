import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useTournamentStore = defineStore('tournament', () => {
  // Tournament state
  const isTournamentMode = ref(false)
  const currentRound = ref(null) // 'quarterfinal', 'semifinal', 'final'
  const playerTeamId = ref(null)
  const tournamentTeams = ref([]) // All 8 teams in tournament

  // Bracket structure: { team1, team2, winner, score1, score2 }
  const quarterfinals = ref([
    { match: 1, team1: null, team2: null, winner: null, score1: null, score2: null },
    { match: 2, team1: null, team2: null, winner: null, score1: null, score2: null },
    { match: 3, team1: null, team2: null, winner: null, score1: null, score2: null },
    { match: 4, team1: null, team2: null, winner: null, score1: null, score2: null }
  ])

  const semifinals = ref([
    { match: 1, team1: null, team2: null, winner: null, score1: null, score2: null },
    { match: 2, team1: null, team2: null, winner: null, score1: null, score2: null }
  ])

  const final = ref({
    match: 1, team1: null, team2: null, winner: null, score1: null, score2: null
  })

  const tournamentWinner = ref(null)
  const showTrophyCeremony = ref(false)

  // Available teams
  const availableTeams = [
    'brazil', 'germany', 'england', 'spain', 'greece',
    'italy', 'argentina', 'france', 'netherlands',
    'croatia', 'australia', 'china'
  ]

  // Initialize tournament with player team and 7 random opponents
  function initializeTournament(selectedPlayerTeam) {
    playerTeamId.value = selectedPlayerTeam

    // Get 7 random teams (excluding player's team)
    const otherTeams = availableTeams.filter(t => t !== selectedPlayerTeam)
    const shuffled = [...otherTeams].sort(() => Math.random() - 0.5)
    const selectedOpponents = shuffled.slice(0, 7)

    // Combine player team with opponents and shuffle
    tournamentTeams.value = [selectedPlayerTeam, ...selectedOpponents]

    // Randomly position player team in bracket
    const allTeams = [...tournamentTeams.value].sort(() => Math.random() - 0.5)

    // Set up quarterfinals bracket
    quarterfinals.value[0].team1 = allTeams[0]
    quarterfinals.value[0].team2 = allTeams[1]
    quarterfinals.value[1].team1 = allTeams[2]
    quarterfinals.value[1].team2 = allTeams[3]
    quarterfinals.value[2].team1 = allTeams[4]
    quarterfinals.value[2].team2 = allTeams[5]
    quarterfinals.value[3].team1 = allTeams[6]
    quarterfinals.value[3].team2 = allTeams[7]

    currentRound.value = 'quarterfinal'
    isTournamentMode.value = true
    tournamentWinner.value = null
    showTrophyCeremony.value = false
  }

  // Get current match for player
  function getCurrentPlayerMatch() {
    if (currentRound.value === 'quarterfinal') {
      return quarterfinals.value.find(m =>
        m.team1 === playerTeamId.value || m.team2 === playerTeamId.value
      )
    } else if (currentRound.value === 'semifinal') {
      return semifinals.value.find(m =>
        m.team1 === playerTeamId.value || m.team2 === playerTeamId.value
      )
    } else if (currentRound.value === 'final') {
      if (final.value.team1 === playerTeamId.value || final.value.team2 === playerTeamId.value) {
        return final.value
      }
    }
    return null
  }

  // Simulate a match between two AI teams
  function simulateMatch(team1, team2) {
    // Random score between 0-3 for each team
    const score1 = Math.floor(Math.random() * 4)
    const score2 = Math.floor(Math.random() * 4)

    // If draw, add extra goal to random team
    if (score1 === score2) {
      if (Math.random() < 0.5) {
        return { score1: score1 + 1, score2, winner: team1 }
      } else {
        return { score1, score2: score2 + 1, winner: team2 }
      }
    }

    return {
      score1,
      score2,
      winner: score1 > score2 ? team1 : team2
    }
  }

  // Simulate all AI matches in current round
  function simulateRoundMatches() {
    if (currentRound.value === 'quarterfinal') {
      quarterfinals.value.forEach(match => {
        // Skip player's match
        if (match.team1 === playerTeamId.value || match.team2 === playerTeamId.value) {
          return
        }

        // Skip if already simulated
        if (match.winner) {
          return
        }

        const result = simulateMatch(match.team1, match.team2)
        match.score1 = result.score1
        match.score2 = result.score2
        match.winner = result.winner
      })
    } else if (currentRound.value === 'semifinal') {
      semifinals.value.forEach(match => {
        // Skip player's match
        if (match.team1 === playerTeamId.value || match.team2 === playerTeamId.value) {
          return
        }

        // Skip if already simulated
        if (match.winner) {
          return
        }

        const result = simulateMatch(match.team1, match.team2)
        match.score1 = result.score1
        match.score2 = result.score2
        match.winner = result.winner
      })
    }
  }

  // Record player match result
  function recordPlayerMatchResult(winner, playerScore, opponentScore) {
    const playerMatch = getCurrentPlayerMatch()
    if (!playerMatch) return

    if (playerMatch.team1 === playerTeamId.value) {
      playerMatch.score1 = playerScore
      playerMatch.score2 = opponentScore
    } else {
      playerMatch.score1 = opponentScore
      playerMatch.score2 = playerScore
    }
    playerMatch.winner = winner
  }

  // Check if all matches in current round are complete
  function isRoundComplete() {
    if (currentRound.value === 'quarterfinal') {
      return quarterfinals.value.every(m => m.winner !== null)
    } else if (currentRound.value === 'semifinal') {
      return semifinals.value.every(m => m.winner !== null)
    } else if (currentRound.value === 'final') {
      return final.value.winner !== null
    }
    return false
  }

  // Advance to next round
  function advanceToNextRound() {
    if (currentRound.value === 'quarterfinal') {
      // Set up semifinals
      semifinals.value[0].team1 = quarterfinals.value[0].winner
      semifinals.value[0].team2 = quarterfinals.value[1].winner
      semifinals.value[1].team1 = quarterfinals.value[2].winner
      semifinals.value[1].team2 = quarterfinals.value[3].winner

      currentRound.value = 'semifinal'
    } else if (currentRound.value === 'semifinal') {
      // Set up final
      final.value.team1 = semifinals.value[0].winner
      final.value.team2 = semifinals.value[1].winner

      currentRound.value = 'final'
    } else if (currentRound.value === 'final') {
      // Tournament complete
      tournamentWinner.value = final.value.winner

      // Show trophy ceremony if player won
      if (tournamentWinner.value === playerTeamId.value) {
        showTrophyCeremony.value = true
      }
    }
  }

  // Check if player is still in tournament
  function isPlayerInTournament() {
    return getCurrentPlayerMatch() !== null
  }

  // Reset tournament
  function resetTournament() {
    isTournamentMode.value = false
    currentRound.value = null
    playerTeamId.value = null
    tournamentTeams.value = []
    tournamentWinner.value = null
    showTrophyCeremony.value = false

    // Reset brackets
    quarterfinals.value = [
      { match: 1, team1: null, team2: null, winner: null, score1: null, score2: null },
      { match: 2, team1: null, team2: null, winner: null, score1: null, score2: null },
      { match: 3, team1: null, team2: null, winner: null, score1: null, score2: null },
      { match: 4, team1: null, team2: null, winner: null, score1: null, score2: null }
    ]

    semifinals.value = [
      { match: 1, team1: null, team2: null, winner: null, score1: null, score2: null },
      { match: 2, team1: null, team2: null, winner: null, score1: null, score2: null }
    ]

    final.value = {
      match: 1, team1: null, team2: null, winner: null, score1: null, score2: null
    }
  }

  // Get opponent team for current player match
  const currentOpponent = computed(() => {
    const match = getCurrentPlayerMatch()
    if (!match) return null

    return match.team1 === playerTeamId.value ? match.team2 : match.team1
  })

  // Get round name for display
  const roundName = computed(() => {
    if (currentRound.value === 'quarterfinal') return 'Quarter Final'
    if (currentRound.value === 'semifinal') return 'Semi Final'
    if (currentRound.value === 'final') return 'Final'
    return ''
  })

  return {
    // State
    isTournamentMode,
    currentRound,
    playerTeamId,
    tournamentTeams,
    quarterfinals,
    semifinals,
    final,
    tournamentWinner,
    showTrophyCeremony,

    // Computed
    currentOpponent,
    roundName,

    // Actions
    initializeTournament,
    getCurrentPlayerMatch,
    simulateMatch,
    simulateRoundMatches,
    recordPlayerMatchResult,
    isRoundComplete,
    advanceToNextRound,
    isPlayerInTournament,
    resetTournament
  }
})
