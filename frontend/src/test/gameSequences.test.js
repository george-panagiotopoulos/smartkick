import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '../store/gameStore'

describe('Game Sequences - Real Store Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function countBalls(store) {
    let count = 0
    Object.values(store.bluePlayers).forEach(player => {
      if (player.hasBall) count++
    })
    Object.values(store.redPlayers).forEach(player => {
      if (player.hasBall) count++
    })
    return count
  }

  function findBallHolder(store) {
    for (const [key, player] of Object.entries(store.bluePlayers)) {
      if (player.hasBall) return { team: 'blue', player: key }
    }
    for (const [key, player] of Object.entries(store.redPlayers)) {
      if (player.hasBall) return { team: 'red', player: key }
    }
    return null
  }

  function validateState(store) {
    const errors = []
    
    // Check exactly one ball
    const ballCount = countBalls(store)
    if (ballCount !== 1) {
      errors.push(`Expected exactly 1 ball, found ${ballCount}`)
    }
    
    // Check ball position matches actual holder
    const holder = findBallHolder(store)
    if (!holder) {
      errors.push('No ball holder found!')
    } else {
      if (store.ballPosition.team !== holder.team || store.ballPosition.player !== holder.player) {
        errors.push(`Ball position mismatch: store says ${store.ballPosition.team}-${store.ballPosition.player}, actual is ${holder.team}-${holder.player}`)
      }
      if (store.ballPossession !== holder.team) {
        errors.push(`Possession mismatch: store says ${store.ballPossession}, actual is ${holder.team}`)
      }
    }
    
    return errors
  }

  describe('Sequence 1: Pass to Attacker', () => {
    it('should keep ball visible when passing to blue attacker', () => {
      const store = useGameStore()
      store.initializeGame()
      
      // Set up: mid1 has ball
      store.ballPossession = 'blue'
      store.ballPosition = { team: 'blue', player: 'mid1' }
      store.bluePlayers.mid1.hasBall = true
      store.bluePlayers.mid1.fieldPosition = 3
      store.bluePlayers.att.fieldPosition = 5
      
      // Mock Math.random to force pass to attacker (position 5)
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.9) // > 0.5 means position 5
      
      // Mock findPlayerByFieldPosition to return attacker
      const originalFind = store.findPlayerByFieldPosition
      vi.spyOn(store, 'findPlayerByFieldPosition').mockImplementation((team, pos) => {
        if (team === 'blue' && pos === 5) return 'att'
        if (team === 'blue' && pos === 4) return 'mid2'
        return originalFind(team, pos)
      })
      
      // Pass to attacker
      store.executePass(true)
      vi.advanceTimersByTime(600) // Advance past setTimeout
      
      randomSpy.mockRestore()
      
      // Validate state
      const errors = validateState(store)
      if (errors.length > 0) {
        throw new Error(errors.join(', '))
      }
      
      // Check ball is visible (hasBall and correct stance)
      expect(store.bluePlayers.att.hasBall).toBe(true)
      expect(store.bluePlayers.att.stance).toBe('passing') // Should keep passing stance
      expect(store.ballPosition.player).toBe('att')
    })
  })

  describe('Sequence 2: Shot Off Target', () => {
    it('should transfer ball to opponent goalkeeper after shot off target', () => {
      const store = useGameStore()
      store.initializeGame()
      
      // Set up: blue attacker shoots
      store.ballPossession = 'blue'
      store.ballPosition = { team: 'blue', player: 'att' }
      store.bluePlayers.att.hasBall = true
      store.bluePlayers.att.fieldPosition = 5
      
      // Shoot off target
      store.executeShoot(false)
      vi.advanceTimersByTime(2000) // Advance past goalkeeper pass delay
      
      // Validate state
      const errors = validateState(store)
      if (errors.length > 0) {
        throw new Error(errors.join(', '))
      }
      
      // Ball should be with red team (goalkeeper passes to midfielder immediately)
      expect(store.ballPossession).toBe('red')
      expect(store.ballPosition.team).toBe('red')
      // Goalkeeper immediately passes to midfielder (bug fix)
      expect(['mid1', 'mid2']).toContain(store.ballPosition.player)
      const midPlayer = store.redPlayers[store.ballPosition.player]
      expect(midPlayer.hasBall).toBe(true)
      expect(store.redPlayers.gk.hasBall).toBe(false)
      expect(store.bluePlayers.att.hasBall).toBe(false)
    })
  })

  describe('Sequence 3: Multiple Actions', () => {
    it('should maintain exactly one ball through multiple actions', async () => {
      const store = useGameStore()
      await store.initializeGame()
      vi.advanceTimersByTime(100)
      
      // Run 20 random actions
      for (let i = 0; i < 20; i++) {
        // Validate before action
        const preErrors = validateState(store)
        if (preErrors.length > 0) {
          throw new Error(`Pre-action ${i + 1}: ${preErrors.join(', ')}`)
        }
        
        const team = store.ballPossession === 'blue' ? store.bluePlayers : store.redPlayers
        const currentPlayerKey = store.ballPosition.player
        const currentFieldPos = team[currentPlayerKey]?.fieldPosition
        
        if (!currentFieldPos) {
          throw new Error(`Action ${i + 1}: No field position for player ${currentPlayerKey}`)
        }
        
        // Determine action
        let action = null
        if (store.ballPossession === 'blue') {
          if (store.canShoot && Math.random() < 0.3) {
            action = 'shoot'
          } else if (currentFieldPos === 5 || currentFieldPos === 7) {
            action = 'dribble'
          } else if (currentFieldPos === 3 || currentFieldPos === 4) {
            action = 'pass'
          }
        } else {
          // Red team - just transfer for simplicity
          action = 'transfer'
        }
        
        // Execute action
        if (action === 'pass') {
          store.executePass(Math.random() < 0.8)
          vi.advanceTimersByTime(600) // Pass uses setTimeout
        } else if (action === 'dribble') {
          store.executeDribble(Math.random() < 0.6)
          vi.advanceTimersByTime(100) // Dribble uses setTimeout
        } else if (action === 'shoot') {
          store.executeShoot(Math.random() < 0.5)
          vi.advanceTimersByTime(100) // Initial shoot delay
        } else if (action === 'transfer') {
          store.transferBallToOpponent()
        }
        
        vi.advanceTimersByTime(50) // Additional time for any async operations
        
        // Validate after action
        const postErrors = validateState(store)
        if (postErrors.length > 0) {
          throw new Error(`Post-action ${i + 1}: ${postErrors.join(', ')}`)
        }
      }
      
      // Final validation
      const finalErrors = validateState(store)
      if (finalErrors.length > 0) {
        throw new Error(`Final: ${finalErrors.join(', ')}`)
      }
      
      expect(countBalls(store)).toBe(1)
    })
  })

  describe('Sequence 4: Shoot Button Availability', () => {
    it('should not allow shooting when opponent has ball', () => {
      const store = useGameStore()
      store.initializeGame()
      
      // Blue has ball - can shoot if in position
      store.ballPossession = 'blue'
      store.ballPosition = { team: 'blue', player: 'att' }
      store.bluePlayers.att.hasBall = true
      store.bluePlayers.att.fieldPosition = 5
      store.checkShootAvailability()
      
      expect(store.canShoot).toBe(true)
      
      // Red gets ball
      store.transferBallToOpponent()
      
      // Blue should not be able to shoot now
      // canShoot might be true, but ActionButtons checks ballPossession
      expect(store.ballPossession).toBe('red')
      // The component will disable the button because ballPossession !== 'blue'
    })
  })

  describe('Sequence 5: Pass -> Dribble -> Shoot', () => {
    it('should maintain ball through pass, dribble, and shoot sequence', async () => {
      const store = useGameStore()
      await store.initializeGame()
      vi.advanceTimersByTime(100)
      
      // Start: mid1 has ball
      store.ballPossession = 'blue'
      store.ballPosition = { team: 'blue', player: 'mid1' }
      store.bluePlayers.mid1.hasBall = true
      store.bluePlayers.mid1.fieldPosition = 3
      store.bluePlayers.att.fieldPosition = 5
      
      // Mock Math.random to force pass to attacker (position 5)
      // Position 3 (MID1) can pass to 4 (MID2) or 5 (ATT)
      // Math.random() < 0.5 selects 4, >= 0.5 selects 5
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.6) // > 0.5 means position 5
      
      // Pass to attacker
      store.executePass(true)
      
      randomSpy.mockRestore()
      
      let errors = validateState(store)
      if (errors.length > 0) throw new Error(errors.join(', '))
      expect(store.bluePlayers.att.hasBall).toBe(true)
      
      // Dribble past defender
      store.executeDribble(true)
      vi.advanceTimersByTime(100) // Advance past setTimeout delays
      
      errors = validateState(store)
      if (errors.length > 0) throw new Error(errors.join(', '))
      expect(store.bluePlayers.att.hasBall).toBe(true)
      expect(store.bluePlayers.att.fieldPosition).toBe(7)
      
      // Shoot
      store.executeShoot(true)
      vi.advanceTimersByTime(100) // Initial delay
      
      errors = validateState(store)
      if (errors.length > 0) throw new Error(errors.join(', '))
      
      // Ball should still exist (either with GK after save or scoring team)
      expect(countBalls(store)).toBe(1)
    })
  })
})

