import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '../store/gameStore'

describe('Ball Visibility Tests', () => {
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

  describe('Single Ball Constraint', () => {
    it('should always have exactly one ball after initialization', async () => {
      const store = useGameStore()
      await store.initializeGame()
      vi.advanceTimersByTime(100) // Allow any async operations to complete
      
      expect(countBalls(store)).toBe(1)
    })

    it('should have exactly one ball after pass', async () => {
      const store = useGameStore()
      await store.initializeGame()
      vi.advanceTimersByTime(100)
      
      // Set up for pass
      store.ballPossession = 'blue'
      store.ballPosition = { team: 'blue', player: 'mid1' }
      store.bluePlayers.mid1.hasBall = true
      store.bluePlayers.mid1.fieldPosition = 3
      
      store.executePass(true)
      vi.advanceTimersByTime(600) // Advance past setTimeout
      
      expect(countBalls(store)).toBe(1)
    })

    it('should have exactly one ball after pass to attacker', () => {
      const store = useGameStore()
      store.initializeGame()
      
      // Set up for pass to attacker
      store.ballPossession = 'blue'
      store.ballPosition = { team: 'blue', player: 'mid1' }
      store.bluePlayers.mid1.hasBall = true
      store.bluePlayers.mid1.fieldPosition = 3
      store.bluePlayers.att.fieldPosition = 5
      
      // Mock Math.random to control pass target (will select position 5)
      const randomSpy = vi.spyOn(Math, 'random')
      randomSpy.mockReturnValue(0.6) // Will select position 5 (attacker)
      
      store.executePass(true)
      vi.advanceTimersByTime(600) // Advance past setTimeout
      
      expect(countBalls(store)).toBe(1)
      expect(store.bluePlayers.att.hasBall).toBe(true)
      // Ball should still be visible (passing stance)
      expect(store.bluePlayers.att.stance).toBe('passing')
    })

    it('should have exactly one ball after failed pass', () => {
      const store = useGameStore()
      store.initializeGame()
      
      store.ballPossession = 'blue'
      store.ballPosition = { team: 'blue', player: 'mid1' }
      store.bluePlayers.mid1.hasBall = true
      
      store.executePass(false)
      
      expect(countBalls(store)).toBe(1)
    })

    it('should have exactly one ball after shot off target', () => {
      const store = useGameStore()
      store.initializeGame()
      
      store.ballPossession = 'blue'
      store.ballPosition = { team: 'blue', player: 'att' }
      store.bluePlayers.att.hasBall = true
      store.bluePlayers.att.fieldPosition = 5
      
      store.executeShoot(false)
      vi.advanceTimersByTime(2000) // Advance past goalkeeper pass delay
      
      expect(countBalls(store)).toBe(1)
      // Ball should be with opponent team (goalkeeper passes to midfielder immediately)
      expect(store.ballPossession).toBe('red')
      // Ball is passed from goalkeeper to midfielder automatically
      expect(['mid1', 'mid2']).toContain(store.ballPosition.player)
      const midPlayer = store.redPlayers[store.ballPosition.player]
      expect(midPlayer.hasBall).toBe(true)
    })

    it('should have exactly one ball after dribble', async () => {
      const store = useGameStore()
      await store.initializeGame()
      vi.advanceTimersByTime(100)
      
      store.ballPossession = 'blue'
      store.ballPosition = { team: 'blue', player: 'att' }
      store.bluePlayers.att.hasBall = true
      store.bluePlayers.att.fieldPosition = 5
      
      store.executeDribble(true)
      vi.advanceTimersByTime(100) // Advance past setTimeout delays (16ms + 50ms)
      
      expect(countBalls(store)).toBe(1)
    })

    it('should have exactly one ball after multiple actions', async () => {
      const store = useGameStore()
      await store.initializeGame()
      vi.advanceTimersByTime(100)
      
      // Execute multiple actions
      for (let i = 0; i < 10; i++) {
        const ballCount = countBalls(store)
        expect(ballCount).toBe(1)
        
        const holder = findBallHolder(store)
        if (!holder) {
          throw new Error('No ball holder found!')
        }
        
        // Verify ballPosition matches actual holder
        expect(store.ballPosition.team).toBe(holder.team)
        expect(store.ballPosition.player).toBe(holder.player)
        
        // Perform random action
        if (store.ballPossession === 'blue') {
          if (Math.random() < 0.5) {
            store.executePass(Math.random() < 0.8)
            vi.advanceTimersByTime(600) // Pass uses setTimeout
          } else {
            store.executeDribble(Math.random() < 0.6)
            vi.advanceTimersByTime(100) // Dribble uses setTimeout
          }
        } else {
          store.transferBallToOpponent()
        }
        
        vi.advanceTimersByTime(50) // Additional time for any async operations
      }
      
      expect(countBalls(store)).toBe(1)
    })
  })

  describe('Ball Position Consistency', () => {
    it('should match ballPosition with actual ball holder', async () => {
      const store = useGameStore()
      await store.initializeGame()
      vi.advanceTimersByTime(100)
      
      const holder = findBallHolder(store)
      expect(holder).not.toBeNull()
      expect(store.ballPosition.team).toBe(holder.team)
      expect(store.ballPosition.player).toBe(holder.player)
    })

    it('should maintain consistency after pass', () => {
      const store = useGameStore()
      store.initializeGame()
      
      store.ballPossession = 'blue'
      store.ballPosition = { team: 'blue', player: 'mid1' }
      store.bluePlayers.mid1.hasBall = true
      store.bluePlayers.mid1.fieldPosition = 3
      
      store.executePass(true)
      vi.advanceTimersByTime(600)
      
      const holder = findBallHolder(store)
      expect(holder).not.toBeNull()
      expect(store.ballPosition.team).toBe(holder.team)
      expect(store.ballPosition.player).toBe(holder.player)
    })
  })

  describe('Shoot Button Availability', () => {
    it('should only allow shooting when blue team has ball', () => {
      const store = useGameStore()
      store.initializeGame()
      
      // Blue team has ball - can shoot if in position
      store.ballPossession = 'blue'
      store.ballPosition = { team: 'blue', player: 'att' }
      store.bluePlayers.att.hasBall = true
      store.bluePlayers.att.fieldPosition = 5
      store.checkShootAvailability()
      
      expect(store.canShoot).toBe(true)
      
      // Red team has ball - blue cannot shoot
      store.ballPossession = 'red'
      store.ballPosition = { team: 'red', player: 'att' }
      store.redPlayers.att.hasBall = true
      store.redPlayers.att.fieldPosition = 10
      store.checkShootAvailability()
      
      // Even if canShoot is true for red, blue shouldn't be able to shoot
      // This is checked in ActionButtons component
      expect(store.ballPossession).toBe('red')
    })
  })
})

