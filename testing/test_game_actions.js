#!/usr/bin/env node
/**
 * Game Action Testing Script
 * Tests 20 random actions to ensure game doesn't fizzle or stop
 */

// Mock Vue/Pinia store for testing
class MockGameStore {
  constructor() {
    this.ballPossession = 'blue'
    this.ballPosition = { team: 'blue', player: 'mid1' }
    this.canShoot = false
    this.blueScore = 0
    this.redScore = 0
    this.gameMessage = ''
    this.isCelebrating = false
    this.isOpponentActionPending = false
    this.errors = []
    this.actions = []
    
    // Initialize players
    this.bluePlayers = {
      gk: { role: 'gk', fieldPosition: 1, stance: 'standing', hasBall: false },
      def: { role: 'def', fieldPosition: 2, stance: 'defending', hasBall: false },
      mid1: { role: 'mid1', fieldPosition: 3, stance: 'standing', hasBall: false },
      mid2: { role: 'mid2', fieldPosition: 4, stance: 'standing', hasBall: false },
      att: { role: 'att', fieldPosition: 5, stance: 'standing', hasBall: false }
    }
    
    this.redPlayers = {
      gk: { role: 'gk', fieldPosition: 6, stance: 'standing', hasBall: false },
      def: { role: 'def', fieldPosition: 7, stance: 'defending', hasBall: false },
      mid1: { role: 'mid1', fieldPosition: 8, stance: 'standing', hasBall: false },
      mid2: { role: 'mid2', fieldPosition: 9, stance: 'standing', hasBall: false },
      att: { role: 'att', fieldPosition: 10, stance: 'standing', hasBall: false }
    }
    
    this.initializeGame()
  }
  
  initializeGame() {
    const midPlayers = ['mid1', 'mid2']
    const randomMid = midPlayers[Math.floor(Math.random() * midPlayers.length)]
    
    this.ballPossession = 'blue'
    this.ballPosition = { team: 'blue', player: randomMid }
    
    this.bluePlayers[randomMid].stance = 'passing'
    this.bluePlayers[randomMid].hasBall = true
  }
  
  getCurrentTeam() {
    return this.ballPossession === 'blue' ? this.bluePlayers : this.redPlayers
  }
  
  findPlayerByFieldPosition(team, fieldPosition) {
    const players = team === 'blue' ? this.bluePlayers : this.redPlayers
    for (const [key, player] of Object.entries(players)) {
      if (player.fieldPosition === fieldPosition) {
        return key
      }
    }
    return null
  }
  
  checkShootAvailability() {
    const team = this.getCurrentTeam()
    const currentPlayerKey = this.ballPosition.player
    const currentFieldPos = team[currentPlayerKey]?.fieldPosition
    
    if (!currentFieldPos) {
      this.canShoot = false
      return
    }
    
    if (this.ballPossession === 'blue') {
      this.canShoot = currentFieldPos === 5 || currentFieldPos === 7
    } else {
      this.canShoot = currentFieldPos === 10 || currentFieldPos === 2
    }
  }
  
  executePass(success) {
    this.actions.push({ type: 'pass', success, possession: this.ballPossession })
    
    if (!success) {
      this.transferBallToOpponent()
      return
    }
    
    const team = this.getCurrentTeam()
    const currentPlayerKey = this.ballPosition.player
    const currentFieldPos = team[currentPlayerKey]?.fieldPosition
    
    if (!currentFieldPos) {
      this.errors.push('No field position for player')
      return
    }
    
    let targetPlayer = null
    
    if (this.ballPossession === 'blue') {
      if (currentFieldPos === 1) {
        const targetPos = Math.random() < 0.5 ? 3 : 4
        targetPlayer = this.findPlayerByFieldPosition('blue', targetPos)
      } else if (currentFieldPos === 3) {
        const targetPos = Math.random() < 0.5 ? 4 : 5
        targetPlayer = this.findPlayerByFieldPosition('blue', targetPos)
      } else if (currentFieldPos === 4) {
        const targetPos = Math.random() < 0.5 ? 3 : 5
        targetPlayer = this.findPlayerByFieldPosition('blue', targetPos)
      }
    } else {
      if (currentFieldPos === 6) {
        const targetPos = Math.random() < 0.5 ? 8 : 9
        targetPlayer = this.findPlayerByFieldPosition('red', targetPos)
      } else if (currentFieldPos === 8) {
        const targetPos = Math.random() < 0.5 ? 9 : 10
        targetPlayer = this.findPlayerByFieldPosition('red', targetPos)
      } else if (currentFieldPos === 9) {
        const targetPos = Math.random() < 0.5 ? 8 : 10
        targetPlayer = this.findPlayerByFieldPosition('red', targetPos)
      }
    }
    
    if (!targetPlayer) {
      return
    }
    
    team[currentPlayerKey].hasBall = false
    team[currentPlayerKey].stance = 'defending'
    team[targetPlayer].hasBall = true
    team[targetPlayer].stance = 'passing'
    this.ballPosition.player = targetPlayer
    
    this.checkShootAvailability()
  }
  
  executeDribble(success) {
    this.actions.push({ type: 'dribble', success, possession: this.ballPossession })
    
    if (!success) {
      // Dribble failed - opponent gets ball
      this.transferBallToOpponent()
      return
    }
    
    const team = this.getCurrentTeam()
    const opponent = this.ballPossession === 'blue' ? this.redPlayers : this.bluePlayers
    const currentPlayerKey = this.ballPosition.player
    const currentFieldPos = team[currentPlayerKey]?.fieldPosition
    
    if (!currentFieldPos) {
      this.errors.push('No field position for dribbler')
      return
    }
    
    // Dribble logic based on field positions
    if (this.ballPossession === 'blue') {
      if (currentFieldPos === 5) {
        // Blue attacker (position 5) dribbles past red defender (position 7)
        team[currentPlayerKey].fieldPosition = 7
        opponent.def.fieldPosition = 5
      } else if (currentFieldPos === 3 || currentFieldPos === 4) {
        // Midfielder dribbles past defender
        const midfielderPos = team[currentPlayerKey].fieldPosition
        const defenderPos = opponent.def.fieldPosition
        
        // Swap positions
        team[currentPlayerKey].fieldPosition = defenderPos
        opponent.def.fieldPosition = midfielderPos
      }
    } else {
      // Red team
      if (currentFieldPos === 10) {
        // Red attacker (position 10) dribbles past blue defender (position 2)
        team[currentPlayerKey].fieldPosition = 2
        opponent.def.fieldPosition = 10
      } else if (currentFieldPos === 8 || currentFieldPos === 9) {
        // Midfielder dribbles past defender
        const midfielderPos = team[currentPlayerKey].fieldPosition
        const defenderPos = opponent.def.fieldPosition
        
        // Swap positions
        team[currentPlayerKey].fieldPosition = defenderPos
        opponent.def.fieldPosition = midfielderPos
      }
    }
    
    this.checkShootAvailability()
  }
  
  executeShoot(success) {
    this.actions.push({ type: 'shoot', success, possession: this.ballPossession })
    
    const team = this.getCurrentTeam()
    const currentFieldPos = team[this.ballPosition.player]?.fieldPosition
    
    if (!currentFieldPos) {
      this.errors.push('No field position for shooter')
      return
    }
    
    if (!success) {
      // Shot off target
      // Clear ALL balls first
      Object.keys(this.bluePlayers).forEach(key => {
        this.bluePlayers[key].hasBall = false
      })
      Object.keys(this.redPlayers).forEach(key => {
        this.redPlayers[key].hasBall = false
      })
      
      const opponentGK = this.ballPossession === 'blue' ? 'red' : 'blue'
      const opponentTeamPlayers = opponentGK === 'blue' ? this.bluePlayers : this.redPlayers
      
      team[this.ballPosition.player].stance = 'defending'
      
      this.ballPossession = opponentGK
      this.ballPosition = { team: opponentGK, player: 'gk' }
      
      opponentTeamPlayers.gk.hasBall = true
      opponentTeamPlayers.gk.stance = 'passing'
      
      this.checkShootAvailability()
      return
    }
    
    // Shot on target
    const goalkeeperSave = Math.random() < 0.50
    
    if (goalkeeperSave) {
      // Save - transfer ball
      this.transferBallToOpponent()
    } else {
      // GOAL!
      // Clear ALL balls first
      Object.keys(this.bluePlayers).forEach(key => {
        this.bluePlayers[key].hasBall = false
      })
      Object.keys(this.redPlayers).forEach(key => {
        this.redPlayers[key].hasBall = false
      })
      
      if (this.ballPossession === 'blue') {
        this.blueScore++
      } else {
        this.redScore++
      }
      
      // After celebration, give ball to other team
      const otherTeam = this.ballPossession === 'blue' ? this.redPlayers : this.bluePlayers
      const randomMid = Math.random() < 0.5 ? 'mid1' : 'mid2'
      
      this.ballPossession = this.ballPossession === 'blue' ? 'red' : 'blue'
      this.ballPosition = { team: this.ballPossession, player: randomMid }
      
      otherTeam[randomMid].hasBall = true
      otherTeam[randomMid].stance = 'passing'
      
      this.checkShootAvailability()
    }
  }
  
  transferBallToOpponent() {
    // Clear ALL balls first to prevent duplicates
    Object.keys(this.bluePlayers).forEach(key => {
      this.bluePlayers[key].hasBall = false
    })
    Object.keys(this.redPlayers).forEach(key => {
      this.redPlayers[key].hasBall = false
    })
    
    const team = this.getCurrentTeam()
    const opponent = this.ballPossession === 'blue' ? this.redPlayers : this.bluePlayers
    const currentPlayerKey = this.ballPosition.player
    
    team[currentPlayerKey].stance = 'defending'
    
    this.ballPossession = this.ballPossession === 'blue' ? 'red' : 'blue'
    
    const opponentMids = ['mid1', 'mid2']
    const randomOpponentMid = opponentMids[Math.floor(Math.random() * opponentMids.length)]
    
    opponent[randomOpponentMid].hasBall = true
    opponent[randomOpponentMid].stance = 'passing'
    
    this.ballPosition = {
      team: this.ballPossession,
      player: randomOpponentMid
    }
    
    this.checkShootAvailability()
  }
  
  validateState() {
    const errors = []
    
    // Check that ball is with exactly one player
    let ballCount = 0
    let ballHolder = null
    
    for (const [key, player] of Object.entries(this.bluePlayers)) {
      if (player.hasBall) {
        ballCount++
        ballHolder = { team: 'blue', player: key }
      }
    }
    
    for (const [key, player] of Object.entries(this.redPlayers)) {
      if (player.hasBall) {
        ballCount++
        ballHolder = { team: 'red', player: key }
      }
    }
    
    if (ballCount === 0) {
      errors.push('ERROR: No player has the ball!')
    } else if (ballCount > 1) {
      errors.push(`ERROR: Multiple players have the ball! (${ballCount} players)`)
    } else if (ballHolder) {
      // Verify ball position matches actual holder
      if (this.ballPosition.team !== ballHolder.team || this.ballPosition.player !== ballHolder.player) {
        errors.push(`ERROR: Ball position mismatch! Store says ${this.ballPosition.team}-${this.ballPosition.player}, but ball is with ${ballHolder.team}-${ballHolder.player}`)
      }
      
      // Verify possession matches
      if (this.ballPossession !== ballHolder.team) {
        errors.push(`ERROR: Possession mismatch! Store says ${this.ballPossession}, but ball is with ${ballHolder.team}`)
      }
    }
    
    // Check that player with ball has a valid stance
    if (ballHolder) {
      const team = ballHolder.team === 'blue' ? this.bluePlayers : this.redPlayers
      const player = team[ballHolder.player]
      if (!player) {
        errors.push(`ERROR: Player ${ballHolder.team}-${ballHolder.player} not found!`)
      } else if (!player.stance) {
        errors.push(`ERROR: Player ${ballHolder.team}-${ballHolder.player} has no stance!`)
      }
    }
    
    return errors
  }
}

function runTest(testNumber) {
  console.log(`\n=== Test ${testNumber} ===`)
  console.log('Running 20 random actions...\n')
  
  const store = new MockGameStore()
  const actions = ['pass', 'shoot']
  
  for (let i = 0; i < 20; i++) {
    const team = store.getCurrentTeam()
    const currentPlayerKey = store.ballPosition.player
    const currentFieldPos = team[currentPlayerKey]?.fieldPosition
    
    if (!currentFieldPos) {
      store.errors.push(`Action ${i + 1}: No field position for player ${currentPlayerKey}`)
      break
    }
    
    // Determine available actions
    let availableActions = []
    
    if (store.ballPossession === 'blue') {
      if (currentFieldPos === 1) {
        availableActions = ['pass'] // Goalkeeper can only pass
      } else if (currentFieldPos === 3 || currentFieldPos === 4) {
        availableActions = ['pass'] // Midfielders can pass
      } else if (currentFieldPos === 5 || currentFieldPos === 7) {
        availableActions = ['shoot'] // Attacker or past defender can shoot
      }
    } else {
      if (currentFieldPos === 6) {
        availableActions = ['pass'] // Goalkeeper can only pass
      } else if (currentFieldPos === 8 || currentFieldPos === 9) {
        availableActions = ['pass'] // Midfielders can pass
      } else if (currentFieldPos === 10 || currentFieldPos === 2) {
        availableActions = ['shoot'] // Attacker or past defender can shoot
      }
    }
    
    if (availableActions.length === 0) {
      store.errors.push(`Action ${i + 1}: No available actions for position ${currentFieldPos}`)
      break
    }
    
    const selectedAction = availableActions[Math.floor(Math.random() * availableActions.length)]
    const success = Math.random() < 0.7 // 70% success rate
    
    if (selectedAction === 'pass') {
      store.executePass(success)
    } else if (selectedAction === 'shoot') {
      store.executeShoot(success)
    }
    
    // Validate state after each action
    const validationErrors = store.validateState()
    if (validationErrors.length > 0) {
      store.errors.push(...validationErrors.map(e => `Action ${i + 1}: ${e}`))
      break
    }
  }
  
  // Final validation
  const finalErrors = store.validateState()
  store.errors.push(...finalErrors)
  
  // Report results
  console.log(`Actions executed: ${store.actions.length}`)
  console.log(`Final score: Blue ${store.blueScore} - Red ${store.redScore}`)
  console.log(`Final possession: ${store.ballPossession}`)
  console.log(`Final ball position: ${store.ballPosition.team}-${store.ballPosition.player}`)
  
  if (store.errors.length > 0) {
    console.log(`\n❌ ERRORS FOUND (${store.errors.length}):`)
    store.errors.forEach(error => console.log(`  - ${error}`))
    return false
  } else {
    console.log('\n✅ Test passed! No errors found.')
    return true
  }
}

// Enhanced test with more scenarios
function runExtendedTest(testNumber, numActions = 50) {
  console.log(`\n=== Extended Test ${testNumber} ===`)
  console.log(`Running ${numActions} random actions...\n`)
  
  const store = new MockGameStore()
  const actions = ['pass', 'shoot', 'dribble']
  
  for (let i = 0; i < numActions; i++) {
    const team = store.getCurrentTeam()
    const currentPlayerKey = store.ballPosition.player
    const currentFieldPos = team[currentPlayerKey]?.fieldPosition
    
    if (!currentFieldPos) {
      store.errors.push(`Action ${i + 1}: No field position for player ${currentPlayerKey}`)
      break
    }
    
    // Determine available actions
    let availableActions = []
    
    if (store.ballPossession === 'blue') {
      if (currentFieldPos === 1) {
        availableActions = ['pass']
      } else if (currentFieldPos === 3 || currentFieldPos === 4) {
        availableActions = ['pass', 'dribble']
      } else if (currentFieldPos === 5 || currentFieldPos === 7) {
        availableActions = ['shoot', 'dribble']
      }
    } else {
      if (currentFieldPos === 6) {
        availableActions = ['pass']
      } else if (currentFieldPos === 8 || currentFieldPos === 9) {
        availableActions = ['pass', 'dribble']
      } else if (currentFieldPos === 10 || currentFieldPos === 2) {
        availableActions = ['shoot', 'dribble']
      }
    }
    
    if (availableActions.length === 0) {
      store.errors.push(`Action ${i + 1}: No available actions for position ${currentFieldPos}`)
      break
    }
    
    const selectedAction = availableActions[Math.floor(Math.random() * availableActions.length)]
    const success = Math.random() < 0.7
    
    if (selectedAction === 'pass') {
      store.executePass(success)
    } else if (selectedAction === 'shoot') {
      store.executeShoot(success)
    } else if (selectedAction === 'dribble') {
      store.executeDribble(success)
    }
    
    // Validate state after each action
    const validationErrors = store.validateState()
    if (validationErrors.length > 0) {
      store.errors.push(...validationErrors.map(e => `Action ${i + 1}: ${e}`))
      break
    }
  }
  
  // Final validation
  const finalErrors = store.validateState()
  store.errors.push(...finalErrors)
  
  // Report results
  console.log(`Actions executed: ${store.actions.length}`)
  console.log(`Final score: Blue ${store.blueScore} - Red ${store.redScore}`)
  console.log(`Final possession: ${store.ballPossession}`)
  console.log(`Final ball position: ${store.ballPosition.team}-${store.ballPosition.player}`)
  
  if (store.errors.length > 0) {
    console.log(`\n❌ ERRORS FOUND (${store.errors.length}):`)
    store.errors.forEach(error => console.log(`  - ${error}`))
    return false
  } else {
    console.log('\n✅ Test passed! No errors found.')
    return true
  }
}

// Run tests
console.log('Game Action Testing Script')
console.log('==========================')

const test1Passed = runTest(1)
const test2Passed = runTest(2)
const test3Passed = runExtendedTest(3, 50)
const test4Passed = runExtendedTest(4, 100)

console.log('\n=== Summary ===')
console.log(`Test 1 (20 actions): ${test1Passed ? '✅ PASSED' : '❌ FAILED'}`)
console.log(`Test 2 (20 actions): ${test2Passed ? '✅ PASSED' : '❌ FAILED'}`)
console.log(`Test 3 (50 actions): ${test3Passed ? '✅ PASSED' : '❌ FAILED'}`)
console.log(`Test 4 (100 actions): ${test4Passed ? '✅ PASSED' : '❌ FAILED'}`)

const allPassed = test1Passed && test2Passed && test3Passed && test4Passed
process.exit(allPassed ? 0 : 1)

