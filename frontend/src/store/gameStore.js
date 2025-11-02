import { defineStore } from 'pinia'
import { ref, computed, nextTick } from 'vue'

export const useGameStore = defineStore('game', () => {
  // Game state
  const gameId = ref(null) // Backend game ID
  const ballPossession = ref('blue') // 'blue' or 'red' (blue = player team, red = opponent team)
  const ballPosition = ref({ team: 'blue', player: 'mid1' }) // Which player has the ball
  const canShoot = ref(false) // Whether shooting is allowed
  const defenderDribbledPast = ref(false) // Track if defender was dribbled past (for shooting probability)
  const isOpponentActionPending = ref(false) // Track if opponent action is in progress
  const blueScore = ref(0)
  const redScore = ref(0)
  const gameMessage = ref('') // UI message for game events
  const isCelebrating = ref(false) // Track if celebrating a goal
  const isGameOver = ref(false) // Track if game is over
  const gameOverReason = ref(null) // Reason game ended
  const maxScore = ref(null) // Max score for this game
  const playerActionCount = ref(0) // Track player actions
  const isShooting = ref(false) // Track if a shot is in progress
  
  // Team selection
  const teamSelectionComplete = ref(false)
  const playerTeamId = ref(null) // Selected team ID for player (maps to 'blue' internally)
  const opponentTeamId = ref(null) // Selected team ID for opponent (maps to 'red' internally)
  
  // Player positions and states
  // Field positions: 1-5 (Blue team), 6-10 (Red team)
  // Position mapping:
  // Blue: 1=GK, 2=DEF, 3=MID1, 4=MID2, 5=ATT
  // Red: 6=GK, 7=DEF, 8=MID1, 9=MID2, 10=ATT
  const bluePlayers = ref({
    gk: { role: 'gk', fieldPosition: 1, stance: 'standing', hasBall: false },
    def: { role: 'def', fieldPosition: 2, stance: 'defending', hasBall: false },
    mid1: { role: 'mid1', fieldPosition: 3, stance: 'standing', hasBall: false },
    mid2: { role: 'mid2', fieldPosition: 4, stance: 'standing', hasBall: false },
    att: { role: 'att', fieldPosition: 5, stance: 'standing', hasBall: false }
  })
  
  const redPlayers = ref({
    gk: { role: 'gk', fieldPosition: 6, stance: 'standing', hasBall: false },
    def: { role: 'def', fieldPosition: 7, stance: 'defending', hasBall: false },
    mid1: { role: 'mid1', fieldPosition: 8, stance: 'standing', hasBall: false },
    mid2: { role: 'mid2', fieldPosition: 9, stance: 'standing', hasBall: false },
    att: { role: 'att', fieldPosition: 10, stance: 'standing', hasBall: false }
  })
  
  // Position to CSS mapping
  const positionMap = {
    // Blue team positions (1-5)
    1: { left: '5%', top: '40%' },   // GK
    2: { left: '18%', top: '40%' },   // DEF
    3: { left: '35%', top: '18%' },   // MID1 (closer to top sideline)
    4: { left: '35%', top: '62%' },   // MID2 (closer to bottom sideline)
    5: { left: '55%', top: '40%' },    // ATT
    // Red team positions (6-10)
    6: { right: '5%', top: '40%' },  // GK
    7: { right: '18%', top: '40%' },  // DEF
    8: { right: '35%', top: '18%' },  // MID1 (closer to top sideline)
    9: { right: '35%', top: '62%' },  // MID2 (closer to bottom sideline)
    10: { right: '55%', top: '40%' } // ATT
  }
  
  // Action success probabilities (loaded from config, defaults below)
  const probabilities = ref({
    pass: 0.75,
    dribble: 0.55,
    shoot: 0.50,
    tackle: 0.60
  })
  
  // Computed properties
  const currentPlayer = computed(() => {
    const team = ballPossession.value === 'blue' ? bluePlayers.value : redPlayers.value
    return team[ballPosition.value.player]
  })
  
  const currentTeam = computed(() => {
    return ballPossession.value === 'blue' ? bluePlayers.value : redPlayers.value
  })
  
  const opponentTeam = computed(() => {
    return ballPossession.value === 'blue' ? redPlayers.value : bluePlayers.value
  })
  
  // Actions
  async function initializeGame() {
    // Start game with backend
    try {
      const { startGame } = await import('../services/api')
      const result = await startGame()
      if (result.success) {
        gameId.value = result.game_id
        maxScore.value = result.max_score
      }
    } catch (error) {
      console.error('Error starting game:', error)
      // Continue with local game
    }
    
    // Reset field positions to defaults
    bluePlayers.value.gk.fieldPosition = 1
    bluePlayers.value.def.fieldPosition = 2
    bluePlayers.value.mid1.fieldPosition = 3
    bluePlayers.value.mid2.fieldPosition = 4
    bluePlayers.value.att.fieldPosition = 5
    
    redPlayers.value.gk.fieldPosition = 6
    redPlayers.value.def.fieldPosition = 7
    redPlayers.value.mid1.fieldPosition = 8
    redPlayers.value.mid2.fieldPosition = 9
    redPlayers.value.att.fieldPosition = 10
    
    // Clear all hasBall flags first
    Object.keys(bluePlayers.value).forEach(key => {
      bluePlayers.value[key].hasBall = false
    })
    Object.keys(redPlayers.value).forEach(key => {
      redPlayers.value[key].hasBall = false
    })
    
    // Ball starts with random blue midfielder
    const midPlayers = ['mid1', 'mid2']
    const randomMid = midPlayers[Math.floor(Math.random() * midPlayers.length)]
    
    ballPossession.value = 'blue'
    ballPosition.value = { team: 'blue', player: randomMid }
    
    // Set initial player stances manually
    bluePlayers.value.gk.stance = 'standing'
    bluePlayers.value.def.stance = 'defending'
    bluePlayers.value.mid1.stance = randomMid === 'mid1' ? 'passing' : 'standing'
    bluePlayers.value.mid2.stance = randomMid === 'mid2' ? 'passing' : 'standing'
    bluePlayers.value.att.stance = 'standing'
    
    redPlayers.value.gk.stance = 'standing'
    redPlayers.value.def.stance = 'defending'
    redPlayers.value.mid1.stance = 'standing'
    redPlayers.value.mid2.stance = 'standing'
    redPlayers.value.att.stance = 'standing'
    
    // Set ball holder
    bluePlayers.value[randomMid].hasBall = true
    
    // Reset defender dribbled past status
    defenderDribbledPast.value = false
    
    // Reset game state
    blueScore.value = 0
    redScore.value = 0
    playerActionCount.value = 0
    isGameOver.value = false
    gameOverReason.value = null
    isShooting.value = false
    
    // Check if shooting is allowed (only goalkeeper left)
    checkShootAvailability()
  }
  
  function updateProbability(action, newProbability) {
    // Update probability for this action
    if (probabilities.value[action] !== undefined) {
      probabilities.value[action] = newProbability
    }
  }
  
  function incrementPlayerAction() {
    playerActionCount.value++
    checkGameOver()
  }
  
  function checkGameOver() {
    // Check max score
    if (maxScore.value !== null) {
      if (blueScore.value >= maxScore.value) {
        isGameOver.value = true
        gameOverReason.value = `Blue team reached max score (${maxScore.value})`
        gameMessage.value = `Game Over! ${gameOverReason.value}`
        return
      }
      if (redScore.value >= maxScore.value) {
        isGameOver.value = true
        gameOverReason.value = `Red team reached max score (${maxScore.value})`
        gameMessage.value = `Game Over! ${gameOverReason.value}`
        return
      }
    }
    
    // Check max player actions (100)
    if (playerActionCount.value >= 100) {
      isGameOver.value = true
      gameOverReason.value = 'Reached max player actions (100)'
      gameMessage.value = `Game Over! ${gameOverReason.value}`
      return
    }
  }
  
  function resetPlayerPositions() {
    // Reset all player field positions to starting positions
    bluePlayers.value.gk.fieldPosition = 1
    bluePlayers.value.def.fieldPosition = 2
    bluePlayers.value.mid1.fieldPosition = 3
    bluePlayers.value.mid2.fieldPosition = 4
    bluePlayers.value.att.fieldPosition = 5
    
    redPlayers.value.gk.fieldPosition = 6
    redPlayers.value.def.fieldPosition = 7
    redPlayers.value.mid1.fieldPosition = 8
    redPlayers.value.mid2.fieldPosition = 9
    redPlayers.value.att.fieldPosition = 10
  }
  
  function resetPlayerStances() {
    // Reset all players to standing/defending (random)
    // BUT preserve the ball holder's stance and hasBall
    const ballHolderTeam = ballPossession.value === 'blue' ? bluePlayers.value : redPlayers.value
    const ballHolderKey = ballPosition.value.player
    const ballHolderStance = ballHolderTeam[ballHolderKey]?.stance
    const ballHolderHasBall = ballHolderTeam[ballHolderKey]?.hasBall
    
    const stances = ['standing', 'defending']
    
    Object.keys(bluePlayers.value).forEach(key => {
      if (key === ballHolderKey && ballPossession.value === 'blue' && ballHolderHasBall) {
        // Keep ball holder's stance
        return
      }
      if (key === 'def') {
        bluePlayers.value[key].stance = 'defending'
      } else {
        bluePlayers.value[key].stance = stances[Math.floor(Math.random() * stances.length)]
      }
      bluePlayers.value[key].hasBall = false
    })
    
    Object.keys(redPlayers.value).forEach(key => {
      if (key === ballHolderKey && ballPossession.value === 'red' && ballHolderHasBall) {
        // Keep ball holder's stance
        return
      }
      if (key === 'def') {
        redPlayers.value[key].stance = 'defending'
      } else {
        redPlayers.value[key].stance = stances[Math.floor(Math.random() * stances.length)]
      }
      redPlayers.value[key].hasBall = false
    })
    
    // Restore ball holder's hasBall and stance
    if (ballHolderHasBall && ballHolderTeam[ballHolderKey]) {
      ballHolderTeam[ballHolderKey].hasBall = true
      if (ballHolderStance) {
        ballHolderTeam[ballHolderKey].stance = ballHolderStance
      }
    }
  }
  
  function checkShootAvailability() {
    // Shooting is allowed when:
    // - Blue attacker (position 5) has ball, OR blue player reached position 7, 8, or 9
    // - Red attacker (position 10) has ball, OR red player reached position 2
    const team = currentTeam.value
    const currentPlayerKey = ballPosition.value.player
    const currentFieldPos = team[currentPlayerKey].fieldPosition
    
    if (ballPossession.value === 'blue') {
      canShoot.value = currentFieldPos === 5 || currentFieldPos === 7 || currentFieldPos === 8 || currentFieldPos === 9
    } else {
      canShoot.value = currentFieldPos === 10 || currentFieldPos === 2
    }
  }
  
  function getShootProbability() {
    // Get base shoot probability from config (default 0.50)
    // Position affects shot on target probability:
    // - From distance (position 5, 8, 9, 10): 30% chance shot is on target (reduced from base)
    // - Past defender (position 7, 2): use base probability (50% default)
    const team = currentTeam.value
    const currentFieldPos = team[ballPosition.value.player].fieldPosition
    
    // Get current shoot probability (may be adjusted by question results)
    const baseShootProb = probabilities.value.shoot || 0.50
    
    if (ballPossession.value === 'blue') {
      if (currentFieldPos === 7) {
        // Past defender - use base probability
        return baseShootProb
      } else if (currentFieldPos === 5 || currentFieldPos === 8 || currentFieldPos === 9) {
        // From distance - reduce to 30% (fixed at 30% regardless of base)
        return 0.30
      }
    } else {
      if (currentFieldPos === 2) {
        // Past defender - use base probability
        return baseShootProb
      } else if (currentFieldPos === 10) {
        // From distance - reduce to 30%
        return 0.30
      }
    }
    
    // Default: distance shot
    return 0.30
  }
  
  function executePass(success) {
    incrementPlayerAction()
    
    if (!success) {
      // Pass failed - opponent gets ball
      transferBallToOpponent()
      return
    }
    
    const team = currentTeam.value
    const currentPlayerKey = ballPosition.value.player
    const currentFieldPos = team[currentPlayerKey].fieldPosition
    
    // Pass logic based on field positions
    let targetPlayer = null
    
    if (ballPossession.value === 'blue') {
      // Blue team passing rules
      if (currentFieldPos === 1) {
        // Position 1 (GK) can pass to midfielders (3 or 4)
        const targetPos = Math.random() < 0.5 ? 3 : 4
        targetPlayer = findPlayerByFieldPosition('blue', targetPos)
      } else if (currentFieldPos === 3) {
        // Position 3 (MID1) can pass to 4 (MID2) or 5 (ATT)
        const targetPos = Math.random() < 0.5 ? 4 : 5
        targetPlayer = findPlayerByFieldPosition('blue', targetPos)
      } else if (currentFieldPos === 4) {
        // Position 4 (MID2) can pass to 3 (MID1) or 5 (ATT)
        const targetPos = Math.random() < 0.5 ? 3 : 5
        targetPlayer = findPlayerByFieldPosition('blue', targetPos)
      } else if (currentFieldPos === 8) {
        // Position 8 (dribbled past red mid1) - pass to attacker at position 5
        targetPlayer = findPlayerByFieldPosition('blue', 5)
      } else if (currentFieldPos === 9) {
        // Position 9 (dribbled past red mid2) - pass to attacker at position 5
        targetPlayer = findPlayerByFieldPosition('blue', 5)
      } else if (currentFieldPos === 5) {
        // Position 5 (ATT) - can't pass forward, only sideways (but usually shoots or dribbles)
        return
      } else if (currentFieldPos === 7) {
        // Position 7 (reached opponent defender position) - can only shoot, not pass
        return
      }
    } else {
      // Red team passing rules
      if (currentFieldPos === 6) {
        // Position 6 (GK) can pass to midfielders (8 or 9)
        const targetPos = Math.random() < 0.5 ? 8 : 9
        targetPlayer = findPlayerByFieldPosition('red', targetPos)
      } else if (currentFieldPos === 8) {
        // Position 8 (MID1) can pass to 9 (MID2) or 10 (ATT)
        const targetPos = Math.random() < 0.5 ? 9 : 10
        targetPlayer = findPlayerByFieldPosition('red', targetPos)
      } else if (currentFieldPos === 9) {
        // Position 9 (MID2) can pass to 8 (MID1) or 10 (ATT)
        const targetPos = Math.random() < 0.5 ? 8 : 10
        targetPlayer = findPlayerByFieldPosition('red', targetPos)
      } else if (currentFieldPos === 10) {
        // Position 10 (ATT) - can't pass forward
        return
      } else if (currentFieldPos === 2) {
        // Position 2 (reached opponent defender position) - can only shoot, not pass
        return
      }
    }
    
    if (!targetPlayer) {
      return
    }
    
    // Clear ALL balls first to prevent duplicates
    Object.keys(bluePlayers.value).forEach(key => {
      bluePlayers.value[key].hasBall = false
    })
    Object.keys(redPlayers.value).forEach(key => {
      redPlayers.value[key].hasBall = false
    })
    
    // Transfer ball - passer switches to defending
    team[currentPlayerKey].stance = 'defending'
    
    // Receiver gets ball - show passing stance
    ballPosition.value.player = targetPlayer
    team[targetPlayer].hasBall = true
    team[targetPlayer].stance = 'passing'
    
    // Update other players (this will preserve the ball holder's state)
    resetOtherPlayers()
    
    // Ensure receiver still has ball after reset
    team[targetPlayer].hasBall = true
    team[targetPlayer].stance = 'passing'
    
    checkShootAvailability()
  }
  
  function findPlayerByFieldPosition(team, fieldPosition) {
    const players = team === 'blue' ? bluePlayers.value : redPlayers.value
    for (const [key, player] of Object.entries(players)) {
      if (player.fieldPosition === fieldPosition) {
        return key
      }
    }
    return null
  }
  
  function executeDribble(success) {
    incrementPlayerAction()
    
    if (!success) {
      // Dribble failed - opponent gets ball
      transferBallToOpponent()
      return
    }
    
    // Clear ALL balls first to prevent duplicates
    Object.keys(bluePlayers.value).forEach(key => {
      bluePlayers.value[key].hasBall = false
    })
    Object.keys(redPlayers.value).forEach(key => {
      redPlayers.value[key].hasBall = false
    })
    
    const team = currentTeam.value
    const opponent = opponentTeam.value
    const currentPlayerKey = ballPosition.value.player
    const currentFieldPos = team[currentPlayerKey].fieldPosition
    
    // Player keeps the ball during dribble
    team[currentPlayerKey].hasBall = true
    
    // Set dribbling stance
    team[currentPlayerKey].stance = 'dribbling'
    
    // First, ensure player has ball and stance is set
    team[currentPlayerKey].hasBall = true
    team[currentPlayerKey].stance = 'dribbling'
    
    // Store new positions before changing
    let newPlayerPosition = null
    let newOpponentPosition = null
    
    // Dribble logic based on field positions
    if (ballPossession.value === 'blue') {
      if (currentFieldPos === 5) {
        // Blue attacker (position 5) dribbles past red defender (position 7)
        newPlayerPosition = 7
        newOpponentPosition = { player: 'def', pos: 5 }
        defenderDribbledPast.value = true
      } else if (currentFieldPos === 8) {
        newPlayerPosition = 7
        newOpponentPosition = { player: 'def', pos: 8 }
        defenderDribbledPast.value = true
      } else if (currentFieldPos === 9) {
        newPlayerPosition = 7
        newOpponentPosition = { player: 'def', pos: 9 }
        defenderDribbledPast.value = true
      } else if (currentFieldPos === 3) {
        newPlayerPosition = 8
        newOpponentPosition = { player: 'mid1', pos: 3 }
        defenderDribbledPast.value = true
      } else if (currentFieldPos === 4) {
        newPlayerPosition = 9
        newOpponentPosition = { player: 'mid2', pos: 4 }
        defenderDribbledPast.value = true
      }
    } else {
      // Red team
      if (currentFieldPos === 10) {
        newPlayerPosition = 2
        newOpponentPosition = { player: 'def', pos: 10 }
        defenderDribbledPast.value = true
      } else if (currentFieldPos === 8) {
        newPlayerPosition = 3
        newOpponentPosition = { player: 'mid1', pos: 8 }
        defenderDribbledPast.value = true
      } else if (currentFieldPos === 9) {
        newPlayerPosition = 4
        newOpponentPosition = { player: 'mid2', pos: 9 }
        defenderDribbledPast.value = true
      }
    }
    
    // Apply position changes with delay to allow CSS transitions
    if (newPlayerPosition !== null) {
      // Small delay to ensure browser has rendered current position before changing
      setTimeout(() => {
        // Change positions - this should trigger CSS transition
        team[currentPlayerKey].fieldPosition = newPlayerPosition
        if (newOpponentPosition) {
          opponent[newOpponentPosition.player].fieldPosition = newOpponentPosition.pos
        }
        
        // Check shoot availability after position change
        checkShootAvailability()
        
        // Wait for transition to start before resetting other players
        setTimeout(() => {
          resetOtherPlayers()
          // Ensure ball is still there after reset
          team[currentPlayerKey].hasBall = true
          team[currentPlayerKey].stance = 'dribbling'
          // Check shoot availability again after reset to ensure it's correct
          checkShootAvailability()
        }, 50)
      }, 16) // ~1 frame delay to ensure old position is rendered
    } else {
      // No position change, just reset
      resetOtherPlayers()
      checkShootAvailability()
    }
  }
  
  function executeShoot(success) {
    // success parameter means: question answered correctly
    // Position affects shot on target probability:
    // - From distance (position 5, 8, 9, 10): 30% chance shot is on target
    // - Past defender (position 7, 2): base probability (50% default, 60% after correct answer)
    
    incrementPlayerAction()
    
    const team = currentTeam.value
    const opponent = opponentTeam.value
    const currentFieldPos = team[ballPosition.value.player].fieldPosition
    
    if (!success) {
      // Question answered incorrectly - action fails immediately, opponent gains possession
      transferBallToOpponent()
      return
    }
    
    // Set shooting flag to disable actions
    isShooting.value = true
    
    // Show "Shooting..." message and wait 3 seconds before processing shot
    gameMessage.value = 'Shooting...'
    
    setTimeout(() => {
      // Question answered correctly - get shot on target probability based on position
      const shotOnTargetProb = getShootProbability()
      const shotOnTarget = Math.random() < shotOnTargetProb
      
      if (!shotOnTarget) {
      // Shot off target - give ball to opponent goalkeeper
      gameMessage.value = 'Shot off target!'
      setTimeout(() => {
        gameMessage.value = ''
      }, 3000)
      
      // Clear ALL balls first to prevent duplicates
      Object.keys(bluePlayers.value).forEach(key => {
        bluePlayers.value[key].hasBall = false
      })
      Object.keys(redPlayers.value).forEach(key => {
        redPlayers.value[key].hasBall = false
      })
      
      // Give ball to opponent goalkeeper
      const opponentGK = ballPossession.value === 'blue' ? 'red' : 'blue'
      const opponentTeamPlayers = opponentGK === 'blue' ? bluePlayers.value : redPlayers.value
      const currentPlayerKey = ballPosition.value.player
      
      // Remove ball from shooter
      team[currentPlayerKey].stance = 'defending'
      
      // Switch possession
      ballPossession.value = opponentGK
      ballPosition.value = {
        team: opponentGK,
        player: 'gk'
      }
      
      // Reset all positions after shot
      resetPlayerPositions()
      
      // Give ball to goalkeeper with passing stance
      opponentTeamPlayers.gk.hasBall = true
      opponentTeamPlayers.gk.stance = 'passing'
      
      resetPlayerStances()
      // Make sure goalkeeper still has ball and passing stance
      opponentTeamPlayers.gk.hasBall = true
      opponentTeamPlayers.gk.stance = 'passing'
      
      defenderDribbledPast.value = false
      checkShootAvailability()
      
      // Reset shooting flag after shot is complete
      isShooting.value = false
      
      // Opponent gets ball from goalkeeper - auto-pass
      if (opponentGK === 'red') {
        isOpponentActionPending.value = true
        setTimeout(() => executeOpponentAction(), 1000)
      } else {
        // Blue goalkeeper gets ball - auto-pass to midfielder after delay
        setTimeout(() => {
          const targetMids = ['mid1', 'mid2']
          const targetMid = targetMids[Math.floor(Math.random() * targetMids.length)]
          
          // Clear all balls first
          Object.keys(bluePlayers.value).forEach(key => {
            bluePlayers.value[key].hasBall = false
          })
          
          // Update ballPosition and set ball on midfielder
          bluePlayers.value.gk.stance = 'defending'
          ballPosition.value = {
            team: 'blue',
            player: targetMid
          }
          bluePlayers.value[targetMid].hasBall = true
          bluePlayers.value[targetMid].stance = 'passing'
          
          resetOtherPlayers()
          // Ensure midfielder has ball and goalkeeper doesn't
          bluePlayers.value[targetMid].hasBall = true
          bluePlayers.value[targetMid].stance = 'passing'
          bluePlayers.value.gk.hasBall = false
          
          checkShootAvailability()
        }, 1000)
      }
      
      return
    }
    
    // Shot on target - check goalkeeper save (50% chance to save)
    const goalkeeperSave = Math.random() < 0.50
    
    if (goalkeeperSave) {
      // Goalkeeper saved - switch to blocking stance
      const opponentGK = ballPossession.value === 'blue' ? redPlayers.value.gk : bluePlayers.value.gk
      opponentGK.stance = 'blocking'
      
      gameMessage.value = 'Goalkeeper blocked!'
      setTimeout(() => {
        gameMessage.value = ''
        opponentGK.stance = 'standing'
      }, 3000)
      
      // After save, give ball to goalkeeper's team midfielder
      setTimeout(() => {
        resetPlayerPositions() // Reset all positions after save
        const savedTeam = ballPossession.value
        if (savedTeam === 'blue') {
          // Blue goalkeeper saved - auto-pass to midfielder
          transferBallToOpponent()
          // Additional auto-pass for blue goalkeeper
          setTimeout(() => {
            if (ballPossession.value === 'blue' && ballPosition.value.player === 'gk') {
              const targetMids = ['mid1', 'mid2']
              const targetMid = targetMids[Math.floor(Math.random() * targetMids.length)]
              
              // Clear all balls first
              Object.keys(bluePlayers.value).forEach(key => {
                bluePlayers.value[key].hasBall = false
              })
              
              // Update ballPosition and set ball on midfielder
              bluePlayers.value.gk.stance = 'defending'
              ballPosition.value = {
                team: 'blue',
                player: targetMid
              }
              bluePlayers.value[targetMid].hasBall = true
              bluePlayers.value[targetMid].stance = 'passing'
              
              resetOtherPlayers()
              bluePlayers.value[targetMid].hasBall = true
              bluePlayers.value[targetMid].stance = 'passing'
              bluePlayers.value.gk.hasBall = false
              
              checkShootAvailability()
            }
          }, 1000)
        } else {
          // Red goalkeeper saved - opponent action will handle it
          transferBallToOpponent()
        }
        defenderDribbledPast.value = false
        // Reset shooting flag after save is processed
        isShooting.value = false
      }, 2000)
    } else {
      // GOAL!
      const scoringTeam = ballPossession.value
      
      if (scoringTeam === 'blue') {
        blueScore.value++
        gameMessage.value = 'Goal!'
        // Update backend score
        if (gameId.value) {
          import('../services/api').then(({ updateScore }) => {
            updateScore(gameId.value, 'blue', 1)
          })
        }
      } else {
        redScore.value++
        gameMessage.value = 'Goal!'
        // Update backend score
        if (gameId.value) {
          import('../services/api').then(({ updateScore }) => {
            updateScore(gameId.value, 'red', 1)
          })
        }
      }
      
      checkGameOver()
      
      // Put all players of attacking team on celebration stance
      const celebratingTeam = scoringTeam === 'blue' ? bluePlayers.value : redPlayers.value
      Object.keys(celebratingTeam).forEach(key => {
        celebratingTeam[key].stance = 'celebration'
      })
      
      isCelebrating.value = true
      
      // Wait 5 seconds for celebrations
      setTimeout(() => {
        isCelebrating.value = false
        gameMessage.value = ''
        
        // Reset all positions after goal
        resetPlayerPositions()
        
        // Reset celebration stances
        Object.keys(celebratingTeam).forEach(key => {
          if (key === 'def') {
            celebratingTeam[key].stance = 'defending'
          } else {
            celebratingTeam[key].stance = 'standing'
          }
        })
        
        // Give ball to goalkeeper of other team
        const otherTeam = scoringTeam === 'blue' ? redPlayers.value : bluePlayers.value
        
        ballPossession.value = scoringTeam === 'blue' ? 'red' : 'blue'
        ballPosition.value = {
          team: ballPossession.value,
          player: 'gk'
        }
        
        otherTeam.gk.hasBall = true
        otherTeam.gk.stance = 'passing'
        
        resetPlayerStances()
        otherTeam.gk.hasBall = true
        otherTeam.gk.stance = 'passing'
        
        defenderDribbledPast.value = false
        checkShootAvailability()
        
        // Reset shooting flag after goal celebration
        isShooting.value = false
        
        // Auto-pass for goalkeeper
        if (ballPossession.value === 'blue') {
          // Blue goalkeeper gets ball - auto-pass to midfielder
          setTimeout(() => {
            const targetMids = ['mid1', 'mid2']
            const targetMid = targetMids[Math.floor(Math.random() * targetMids.length)]
            
            // Clear all balls first
            Object.keys(bluePlayers.value).forEach(key => {
              bluePlayers.value[key].hasBall = false
            })
            
            // Update ballPosition and set ball on midfielder
            bluePlayers.value.gk.stance = 'defending'
            ballPosition.value = {
              team: 'blue',
              player: targetMid
            }
            bluePlayers.value[targetMid].hasBall = true
            bluePlayers.value[targetMid].stance = 'passing'
            
            resetOtherPlayers()
            bluePlayers.value[targetMid].hasBall = true
            bluePlayers.value[targetMid].stance = 'passing'
            bluePlayers.value.gk.hasBall = false
            
            checkShootAvailability()
          }, 1000)
        } else {
          // Red goalkeeper gets ball - opponent action will handle it
          isOpponentActionPending.value = true
          setTimeout(() => executeOpponentAction(), 1000)
        }
      }, 5000) // Wait 5 seconds for celebrations
    }
    }, 3000) // Wait 3 seconds before processing shot
  }
  
  function transferBallToOpponent() {
    const team = currentTeam.value
    const opponent = opponentTeam.value
    const currentPlayerKey = ballPosition.value.player
    
    // Clear ALL balls first to prevent duplicates
    Object.keys(bluePlayers.value).forEach(key => {
      bluePlayers.value[key].hasBall = false
    })
    Object.keys(redPlayers.value).forEach(key => {
      redPlayers.value[key].hasBall = false
    })
    
    // Remove ball from current player
    team[currentPlayerKey].stance = 'defending'
    
    // Reset defender dribbled past status
    defenderDribbledPast.value = false
    
    // Switch possession first
    ballPossession.value = ballPossession.value === 'blue' ? 'red' : 'blue'
    
    // Opponent gets ball - randomly select midfielder
    const opponentMids = ['mid1', 'mid2']
    const randomOpponentMid = opponentMids[Math.floor(Math.random() * opponentMids.length)]
    
    // Opponent gets ball in passing or dribbling stance (random)
    const opponentStance = Math.random() < 0.5 ? 'passing' : 'dribbling'
    
    ballPosition.value = {
      team: ballPossession.value,
      player: randomOpponentMid
    }
    
    opponent[randomOpponentMid].hasBall = true
    opponent[randomOpponentMid].stance = opponentStance
    
    // Reset all players to defending/waiting stance (will preserve ball holder)
    resetPlayerStances()
    
    // Ensure opponent still has ball after reset
    opponent[randomOpponentMid].hasBall = true
    opponent[randomOpponentMid].stance = opponentStance
    
    checkShootAvailability()
    
    // Trigger opponent action
    isOpponentActionPending.value = true
  }
  
  // Opponent AI actions
  async function executeOpponentAction() {
    if (ballPossession.value !== 'red') {
      isOpponentActionPending.value = false
      return
    }
    
    const opponent = redPlayers.value
    const currentPlayerKey = ballPosition.value.player
    const currentFieldPos = opponent[currentPlayerKey]?.fieldPosition
    
    // Handle goalkeeper first - pass to midfielder (don't wait, handle immediately)
    if (currentPlayerKey === 'gk' || currentFieldPos === 6) {
      // Reset the flag to allow this action
      isOpponentActionPending.value = false
      
      // Transfer ball from goalkeeper to midfielder immediately
      const targetMids = ['mid1', 'mid2']
      const targetMid = targetMids[Math.floor(Math.random() * targetMids.length)]
      
      // Clear all balls first
      Object.keys(bluePlayers.value).forEach(key => {
        bluePlayers.value[key].hasBall = false
      })
      Object.keys(redPlayers.value).forEach(key => {
        redPlayers.value[key].hasBall = false
      })
      
      // Update ballPosition and set ball on midfielder
      opponent[currentPlayerKey].stance = 'defending'
      ballPosition.value = {
        team: 'red',
        player: targetMid
      }
      opponent[targetMid].hasBall = true
      opponent[targetMid].stance = 'passing'
      
      resetOtherPlayers()
      // Ensure midfielder has ball and goalkeeper doesn't
      opponent[targetMid].hasBall = true
      opponent[targetMid].stance = 'passing'
      opponent[currentPlayerKey].hasBall = false
      
      checkShootAvailability()
      
      // Continue opponent action with midfielder after a delay
      isOpponentActionPending.value = true
      setTimeout(() => executeOpponentAction(), 1000)
      return
    }
    
    // Check if already processing (for non-goalkeeper cases)
    if (isOpponentActionPending.value) {
      // Already processing
      return
    }
    
    isOpponentActionPending.value = true
    
    // Wait a moment before opponent acts
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Re-check after delay (possession might have changed)
    if (ballPossession.value !== 'red') {
      isOpponentActionPending.value = false
      return
    }
    
    // Get updated values after delay
    const updatedPlayerKey = ballPosition.value.player
    const updatedFieldPos = opponent[updatedPlayerKey]?.fieldPosition
    
    // Opponent action logic based on field positions
    // Check position 2 FIRST (past defender - must shoot immediately)
    if (updatedFieldPos === 2) {
      // Red player reached position 2 (past defender) - must shoot
      // Show "Opponent shooting" message first
      gameMessage.value = 'Opponent shooting...'
      
      // Wait 3 seconds, then execute shot
      setTimeout(() => {
        // Use same probability as player (50% for position 2)
        // Temporarily set ball position to get correct probability
        const tempBallPos = ballPosition.value
        ballPosition.value = { team: 'red', player: updatedPlayerKey }
        const shotOnTargetProb = getShootProbability()
        ballPosition.value = tempBallPos
        const shotOnTarget = Math.random() < shotOnTargetProb
        
        if (!shotOnTarget) {
          // Shot off target
          gameMessage.value = 'Shot off target!'
          setTimeout(() => {
            gameMessage.value = ''
          }, 3000)
        
        const blueTeam = bluePlayers.value
        opponent[updatedPlayerKey].hasBall = false
        opponent[updatedPlayerKey].stance = 'defending'
        
        ballPossession.value = 'blue'
        ballPosition.value = { team: 'blue', player: 'gk' }
        
        blueTeam.gk.hasBall = true
        blueTeam.gk.stance = 'passing'
        
        resetPlayerPositions() // Reset all positions after shot
        resetPlayerStances()
        // Make sure goalkeeper still has ball and passing stance
        blueTeam.gk.hasBall = true
        blueTeam.gk.stance = 'passing'
        
        defenderDribbledPast.value = false
        checkShootAvailability()
        isOpponentActionPending.value = false
        return
      }
      
      // Shot on target
      const goalkeeperSave = Math.random() < 0.50
      if (goalkeeperSave) {
        const blueGK = bluePlayers.value.gk
        blueGK.stance = 'blocking'
        
        gameMessage.value = 'Goalkeeper blocked!'
        setTimeout(() => {
          gameMessage.value = ''
          blueGK.stance = 'standing'
        }, 3000)
        
        setTimeout(() => {
          transferBallToOpponent()
          resetPlayerPositions() // Reset all positions after shot
          
          // Auto-pass for blue goalkeeper if they got the ball
          if (ballPossession.value === 'blue' && ballPosition.value.player === 'gk') {
            setTimeout(() => {
              const targetMids = ['mid1', 'mid2']
              const targetMid = targetMids[Math.floor(Math.random() * targetMids.length)]
              
              // Clear all balls first
              Object.keys(bluePlayers.value).forEach(key => {
                bluePlayers.value[key].hasBall = false
              })
              
              // Update ballPosition and set ball on midfielder
              bluePlayers.value.gk.stance = 'defending'
              ballPosition.value = {
                team: 'blue',
                player: targetMid
              }
              bluePlayers.value[targetMid].hasBall = true
              bluePlayers.value[targetMid].stance = 'passing'
              
              resetOtherPlayers()
              bluePlayers.value[targetMid].hasBall = true
              bluePlayers.value[targetMid].stance = 'passing'
              bluePlayers.value.gk.hasBall = false
              
              checkShootAvailability()
            }, 1000)
          }
          
          defenderDribbledPast.value = false
        }, 2000)
        } else {
          // GOAL!
          redScore.value++
          gameMessage.value = 'Goal!'
          // Update backend score
          if (gameId.value) {
            import('../services/api').then(({ updateScore }) => {
              updateScore(gameId.value, 'red', 1)
            })
          }
          checkGameOver()
        
        Object.keys(opponent).forEach(key => {
          opponent[key].stance = 'celebration'
        })
        
        isCelebrating.value = true
        
        setTimeout(() => {
          isCelebrating.value = false
          gameMessage.value = ''
          
          resetPlayerPositions() // Reset all positions after goal
          
          Object.keys(opponent).forEach(key => {
            if (key === 'def') {
              opponent[key].stance = 'defending'
            } else {
              opponent[key].stance = 'standing'
            }
          })
          
          // Give ball to blue goalkeeper
          const blueTeam = bluePlayers.value
          
          ballPossession.value = 'blue'
          ballPosition.value = { team: 'blue', player: 'gk' }
          
          blueTeam.gk.hasBall = true
          blueTeam.gk.stance = 'passing'
          
          resetPlayerStances()
          blueTeam.gk.hasBall = true
          blueTeam.gk.stance = 'passing'
          
          defenderDribbledPast.value = false
          checkShootAvailability()
          
          // Auto-pass for blue goalkeeper
          setTimeout(() => {
            const targetMids = ['mid1', 'mid2']
            const targetMid = targetMids[Math.floor(Math.random() * targetMids.length)]
            
            // Clear all balls first
            Object.keys(bluePlayers.value).forEach(key => {
              bluePlayers.value[key].hasBall = false
            })
            
            // Update ballPosition and set ball on midfielder
            bluePlayers.value.gk.stance = 'defending'
            ballPosition.value = {
              team: 'blue',
              player: targetMid
            }
            bluePlayers.value[targetMid].hasBall = true
            bluePlayers.value[targetMid].stance = 'passing'
            
            resetOtherPlayers()
            bluePlayers.value[targetMid].hasBall = true
            bluePlayers.value[targetMid].stance = 'passing'
            bluePlayers.value.gk.hasBall = false
            
            checkShootAvailability()
          }, 1000)
        }, 5000) // Wait 5 seconds for celebrations
      }
      isOpponentActionPending.value = false
      return
      }, 3000) // Wait 3 seconds before showing result
    } else if (updatedFieldPos === 10) {
      // Red attacker (position 10) - can shoot (low chance) or dribble past defender
      const actionRoll = Math.random()
      if (actionRoll < 0.70) {
        // 70% chance to dribble past defender to position 2
        const blueTeam = bluePlayers.value
        opponent[updatedPlayerKey].fieldPosition = 2
        blueTeam.def.fieldPosition = 10
        
        opponent[updatedPlayerKey].stance = 'dribbling'
        resetOtherPlayers()
        
        setTimeout(() => executeOpponentAction(), 1000)
      } else {
        // 30% chance to shoot from distance
        // Use same probability as player (25% for position 10)
        // Temporarily set ball position to get correct probability
        const tempBallPos = ballPosition.value
        ballPosition.value = { team: 'red', player: updatedPlayerKey }
        const shotOnTargetProb = getShootProbability()
        ballPosition.value = tempBallPos
        const shotOnTarget = Math.random() < shotOnTargetProb
        if (!shotOnTarget) {
          // Shot off target
          gameMessage.value = 'Opponent shot off target!'
          setTimeout(() => {
            gameMessage.value = ''
          }, 3000)
          
      // Give ball to blue goalkeeper
      const blueTeam = bluePlayers.value
      opponent[updatedPlayerKey].hasBall = false
      opponent[updatedPlayerKey].stance = 'defending'
      
      ballPossession.value = 'blue'
      ballPosition.value = { team: 'blue', player: 'gk' }
      
      blueTeam.gk.hasBall = true
      blueTeam.gk.stance = 'passing'
      
      resetPlayerPositions() // Reset all positions after shot
      resetPlayerStances()
      // Make sure goalkeeper still has ball and passing stance
      blueTeam.gk.hasBall = true
      blueTeam.gk.stance = 'passing'
      
      defenderDribbledPast.value = false
      checkShootAvailability()
      
      // Auto-pass for blue goalkeeper
      setTimeout(() => {
        const targetMids = ['mid1', 'mid2']
        const targetMid = targetMids[Math.floor(Math.random() * targetMids.length)]
        
        // Clear all balls first
        Object.keys(bluePlayers.value).forEach(key => {
          bluePlayers.value[key].hasBall = false
        })
        
        // Update ballPosition and set ball on midfielder
        bluePlayers.value.gk.stance = 'defending'
        ballPosition.value = {
          team: 'blue',
          player: targetMid
        }
        bluePlayers.value[targetMid].hasBall = true
        bluePlayers.value[targetMid].stance = 'passing'
        
        resetOtherPlayers()
        bluePlayers.value[targetMid].hasBall = true
        bluePlayers.value[targetMid].stance = 'passing'
        bluePlayers.value.gk.hasBall = false
        
        checkShootAvailability()
      }, 1000)
      
      isOpponentActionPending.value = false
      return
        }
        
        // Shot on target
        const goalkeeperSave = Math.random() < 0.50
        if (goalkeeperSave) {
          const blueGK = bluePlayers.value.gk
          blueGK.stance = 'blocking'
          
          gameMessage.value = 'Goalkeeper saves!'
          setTimeout(() => {
            gameMessage.value = ''
            blueGK.stance = 'standing'
          }, 2000)
          
          setTimeout(() => {
            transferBallToOpponent()
            resetPlayerPositions() // Reset all positions after save
            defenderDribbledPast.value = false
          }, 2000)
        } else {
          // GOAL!
          redScore.value++
          gameMessage.value = 'GOAL! Red team scores!'
          // Update backend score
          if (gameId.value) {
            import('../services/api').then(({ updateScore }) => {
              updateScore(gameId.value, 'red', 1)
            })
          }
          checkGameOver()
          
          Object.keys(opponent).forEach(key => {
            opponent[key].stance = 'celebration'
          })
          
          isCelebrating.value = true
          
          setTimeout(() => {
            isCelebrating.value = false
            gameMessage.value = ''
            
            resetPlayerPositions() // Reset all positions after goal
            
            Object.keys(opponent).forEach(key => {
              if (key === 'def') {
                opponent[key].stance = 'defending'
              } else {
                opponent[key].stance = 'standing'
              }
            })
            
            // Give ball to blue goalkeeper
            const blueTeam = bluePlayers.value
            
            ballPossession.value = 'blue'
            ballPosition.value = { team: 'blue', player: 'gk' }
            
            blueTeam.gk.hasBall = true
            blueTeam.gk.stance = 'passing'
            
            resetPlayerStances()
            blueTeam.gk.hasBall = true
            blueTeam.gk.stance = 'passing'
            
            defenderDribbledPast.value = false
            checkShootAvailability()
          }, 5000) // Wait 5 seconds for celebrations
        }
        isOpponentActionPending.value = false
        return
      }
    } else if (updatedFieldPos === 8 || updatedFieldPos === 9) {
      // Red midfielders can pass to each other or to attacker (position 10)
      const actions = ['pass', 'dribble']
      const selectedAction = actions[Math.floor(Math.random() * actions.length)]
      
      if (selectedAction === 'pass') {
        let targetPlayer = null
        if (updatedFieldPos === 8) {
          // Position 8 can pass to 9 or 10
          const targetPos = Math.random() < 0.5 ? 9 : 10
          targetPlayer = findPlayerByFieldPosition('red', targetPos)
        } else if (updatedFieldPos === 9) {
          // Position 9 can pass to 8 or 10
          const targetPos = Math.random() < 0.5 ? 8 : 10
          targetPlayer = findPlayerByFieldPosition('red', targetPos)
        }
        
        if (!targetPlayer) {
          isOpponentActionPending.value = false
          return
        }
        
        opponent[currentPlayerKey].stance = 'defending'
        opponent[currentPlayerKey].hasBall = false
        
        // Use nextTick + requestAnimationFrame for smooth ball transfer transition
        nextTick(() => {
          opponent[targetPlayer].stance = 'passing'
          opponent[targetPlayer].hasBall = true
          ballPosition.value.player = targetPlayer
          
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resetOtherPlayers()
              checkShootAvailability()
            })
          })
        })
        
        setTimeout(() => executeOpponentAction(), 1000)
      } else {
        // Dribble
        const blueTeam = bluePlayers.value
        const midfielderPos = opponent[currentPlayerKey].fieldPosition
        const defenderPos = blueTeam.def.fieldPosition
        
        // Clear ALL balls first
        Object.keys(bluePlayers.value).forEach(key => {
          bluePlayers.value[key].hasBall = false
        })
        Object.keys(redPlayers.value).forEach(key => {
          redPlayers.value[key].hasBall = false
        })
        
        opponent[currentPlayerKey].stance = 'dribbling'
        opponent[currentPlayerKey].hasBall = true
        
        // Small delay to ensure browser has rendered current position before changing
        setTimeout(() => {
          // Change positions - this should trigger CSS transition
          opponent[currentPlayerKey].fieldPosition = defenderPos
          blueTeam.def.fieldPosition = midfielderPos
          
          // Wait for transition to start before resetting other players
          setTimeout(() => {
            resetOtherPlayers()
            // Ensure dribbler still has ball after reset
            opponent[currentPlayerKey].hasBall = true
            opponent[currentPlayerKey].stance = 'dribbling'
          }, 50)
        }, 16) // ~1 frame delay to ensure old position is rendered
        
        setTimeout(() => executeOpponentAction(), 1000)
      }
    } else {
      // Fallback: if player is in an unexpected position, force a pass or dribble
      // This ensures the game never gets stuck
      const fallbackAction = Math.random() < 0.5 ? 'pass' : 'dribble'
      
      if (fallbackAction === 'pass' && (updatedFieldPos === 8 || updatedFieldPos === 9)) {
        // Try to pass to attacker or other midfielder
        const targetPos = updatedFieldPos === 8 ? (Math.random() < 0.5 ? 9 : 10) : (Math.random() < 0.5 ? 8 : 10)
        const targetPlayer = findPlayerByFieldPosition('red', targetPos)
        
        if (targetPlayer) {
          opponent[updatedPlayerKey].stance = 'defending'
          opponent[updatedPlayerKey].hasBall = false
          
          // Use nextTick + requestAnimationFrame for smooth ball transfer transition
          nextTick(() => {
            opponent[targetPlayer].stance = 'passing'
            opponent[targetPlayer].hasBall = true
            ballPosition.value.player = targetPlayer
            
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                resetOtherPlayers()
                checkShootAvailability()
              })
            })
          })
          
          setTimeout(() => executeOpponentAction(), 1000)
          return
        }
      }
      
      // If all else fails, pass to a random teammate
      const teammates = ['mid1', 'mid2', 'att'].filter(p => p !== updatedPlayerKey)
      if (teammates.length > 0) {
        const randomTeammate = teammates[Math.floor(Math.random() * teammates.length)]
        opponent[updatedPlayerKey].stance = 'defending'
        opponent[updatedPlayerKey].hasBall = false
        
        // Use nextTick + requestAnimationFrame for smooth ball transfer transition
        nextTick(() => {
          opponent[randomTeammate].stance = 'passing'
          opponent[randomTeammate].hasBall = true
          ballPosition.value.player = randomTeammate
          
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resetOtherPlayers()
              checkShootAvailability()
            })
          })
        })
        
        setTimeout(() => executeOpponentAction(), 1000)
        return
      }
    }
    
    isOpponentActionPending.value = false
  }
  
  function executeTackle(success) {
    incrementPlayerAction()
    
    if (!success) {
      // Tackle failed - opponent performs pass or dribble
      isOpponentActionPending.value = false
      
      // Opponent randomly chooses pass or dribble
      const opponentAction = Math.random() < 0.5 ? 'pass' : 'dribble'
      
      if (opponentAction === 'pass') {
        // Execute opponent pass - only forward or sideways
        const opponent = redPlayers.value
        const currentPlayerKey = ballPosition.value.player
        
        let targetPlayer
        if (currentPlayerKey === 'mid1') {
          // Can pass to attacker (forward) or mid2 (sideways)
          targetPlayer = Math.random() < 0.5 ? 'att' : 'mid2'
        } else if (currentPlayerKey === 'mid2') {
          // Can pass to attacker (forward) or mid1 (sideways)
          targetPlayer = Math.random() < 0.5 ? 'att' : 'mid1'
        } else if (currentPlayerKey === 'att') {
          // Attacker can only pass to midfielders (sideways/backwards but allowed here)
          targetPlayer = Math.random() < 0.5 ? 'mid1' : 'mid2'
        } else {
          setTimeout(() => executeOpponentAction(), 500)
          return
        }
        
        opponent[currentPlayerKey].stance = 'defending'
        opponent[currentPlayerKey].hasBall = false
        
        // Use requestAnimationFrame for smooth ball transfer transition
        requestAnimationFrame(() => {
          opponent[targetPlayer].stance = 'passing'
          opponent[targetPlayer].hasBall = true
          ballPosition.value.player = targetPlayer
          
          requestAnimationFrame(() => {
            resetOtherPlayers()
            checkShootAvailability()
          })
        })
        
        // Continue opponent turn
        setTimeout(() => executeOpponentAction(), 1000)
      } else {
        // Execute opponent dribble
        const opponent = redPlayers.value
        const blueTeam = bluePlayers.value
        const currentPlayerKey = ballPosition.value.player
        
        opponent[currentPlayerKey].stance = 'dribbling'
        
        // Swap positions with blue defender
        const midfielderPos = opponent[currentPlayerKey].fieldPosition
        const defenderPos = blueTeam.def.fieldPosition
        
        opponent[currentPlayerKey].fieldPosition = defenderPos
        blueTeam.def.fieldPosition = midfielderPos
        
        // Use nextTick + requestAnimationFrame for smooth position transition
        nextTick(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resetOtherPlayers()
            })
          })
        })
        
        // Continue opponent turn
        setTimeout(() => executeOpponentAction(), 1000)
      }
      return
    }
    
    // Tackle successful - player gains possession
    const opponent = redPlayers.value
    const currentPlayerKey = ballPosition.value.player
    
    // Remove ball from opponent
    opponent[currentPlayerKey].hasBall = false
    opponent[currentPlayerKey].stance = 'defending'
    
    // Switch possession to blue team
    ballPossession.value = 'blue'
    isOpponentActionPending.value = false
    
    // Blue team gets ball - randomly select midfielder
    const blueMids = ['mid1', 'mid2']
    const randomBlueMid = blueMids[Math.floor(Math.random() * blueMids.length)]
    
    // Use nextTick + requestAnimationFrame for smooth ball transfer transition
    nextTick(() => {
      bluePlayers.value[randomBlueMid].stance = 'passing'
      bluePlayers.value[randomBlueMid].hasBall = true
      
      ballPosition.value = {
        team: 'blue',
        player: randomBlueMid
      }
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resetPlayerStances()
          bluePlayers.value[randomBlueMid].hasBall = true
          bluePlayers.value[randomBlueMid].stance = 'passing'
          
          checkShootAvailability()
        })
      })
    })
  }
  
  function resetOtherPlayers() {
    // Reset all players except the one with the ball
    // IMPORTANT: Save ball holder info BEFORE clearing
    const ballHolderTeam = ballPosition.value.team
    const ballHolderPlayer = ballPosition.value.player
    const ballHolderTeamPlayers = ballHolderTeam === 'blue' ? bluePlayers.value : redPlayers.value
    const ballHolderStance = ballHolderTeamPlayers[ballHolderPlayer]?.stance || 'passing'
    const ballHolderHasBall = ballHolderTeamPlayers[ballHolderPlayer]?.hasBall || false
    
    // Clear ALL hasBall flags to prevent duplicates
    Object.keys(bluePlayers.value).forEach(key => {
      bluePlayers.value[key].hasBall = false
    })
    Object.keys(redPlayers.value).forEach(key => {
      redPlayers.value[key].hasBall = false
    })
    
    const team = currentTeam.value
    const opponent = opponentTeam.value
    const stances = ['standing', 'defending']
    
    // Reset stances for all players
    Object.keys(team).forEach(key => {
      if (key === 'def') {
        team[key].stance = 'defending'
      } else {
        team[key].stance = stances[Math.floor(Math.random() * stances.length)]
      }
    })
    
    Object.keys(opponent).forEach(key => {
      if (key === 'def') {
        opponent[key].stance = 'defending'
      } else {
        opponent[key].stance = stances[Math.floor(Math.random() * stances.length)]
      }
    })
    
    // Now restore ball holder's hasBall and stance using the correct team
    if (ballHolderTeamPlayers[ballHolderPlayer] && ballHolderHasBall) {
      ballHolderTeamPlayers[ballHolderPlayer].hasBall = true
      ballHolderTeamPlayers[ballHolderPlayer].stance = ballHolderStance
    }
  }
  
  // Team management functions
  function setTeams(playerTeam, opponentTeam) {
    playerTeamId.value = playerTeam
    opponentTeamId.value = opponentTeam
  }
  
  function setTeamSelectionComplete(complete) {
    teamSelectionComplete.value = complete
  }
  
  // Get team ID for rendering (maps 'blue'/'red' to actual team IDs)
  function getTeamId(team) {
    if (team === 'blue') {
      return playerTeamId.value || 'blue' // Fallback to 'blue' if not selected
    } else {
      return opponentTeamId.value || 'red' // Fallback to 'red' if not selected
    }
  }
  
  // Get team info (name, flag, etc.)
  const teamInfo = {
    brazil: { name: 'Brazil', flag: '🇧🇷' },
    germany: { name: 'Germany', flag: '🇩🇪' },
    england: { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    spain: { name: 'Spain', flag: '🇪🇸' },
    greece: { name: 'Greece', flag: '🇬🇷' },
    italy: { name: 'Italy', flag: '🇮🇹' },
    argentina: { name: 'Argentina', flag: '🇦🇷' },
    france: { name: 'France', flag: '🇫🇷' },
    netherlands: { name: 'Netherlands', flag: '🇳🇱' }
  }
  
  function getTeamInfo(teamId) {
    return teamInfo[teamId] || { name: teamId, flag: '' }
  }
  
  const playerTeamInfo = computed(() => {
    return playerTeamId.value ? getTeamInfo(playerTeamId.value) : { name: 'Blue', flag: '' }
  })
  
  const opponentTeamInfo = computed(() => {
    return opponentTeamId.value ? getTeamInfo(opponentTeamId.value) : { name: 'Red', flag: '' }
  })
  
  return {
    // State
    gameId,
    ballPossession,
    ballPosition,
    canShoot,
    defenderDribbledPast,
    isOpponentActionPending,
    bluePlayers,
    redPlayers,
    probabilities,
    positionMap,
    blueScore,
    redScore,
    gameMessage,
    isCelebrating,
    isGameOver,
    gameOverReason,
    maxScore,
    playerActionCount,
    isShooting,
    teamSelectionComplete,
    playerTeamId,
    opponentTeamId,
    
    // Computed
    currentPlayer,
    currentTeam,
    opponentTeam,
    playerTeamInfo,
    opponentTeamInfo,
    
    // Actions
    initializeGame,
    updateProbability,
    incrementPlayerAction,
    checkGameOver,
    executePass,
    executeDribble,
    executeShoot,
    transferBallToOpponent,
    resetPlayerStances,
    executeOpponentAction,
    executeTackle,
    getShootProbability,
    findPlayerByFieldPosition,
    checkShootAvailability,
    setTeams,
    setTeamSelectionComplete,
    getTeamId,
    getTeamInfo
  }
})

