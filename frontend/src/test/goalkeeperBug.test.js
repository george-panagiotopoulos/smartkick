import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '../store/gameStore'

describe('Goalkeeper Bug Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Red Goalkeeper Ball Handling', () => {
    it('should continue game when red goalkeeper gets ball', async () => {
      const store = useGameStore()
      store.initializeGame()
      
      // Simulate shot off target giving ball to red goalkeeper
      store.ballPossession = 'blue'
      store.ballPosition = { team: 'blue', player: 'att' }
      store.bluePlayers.att.hasBall = true
      store.bluePlayers.att.fieldPosition = 5
      
      // Shot off target
      store.executeShoot(false)
      vi.advanceTimersByTime(1000)
      
      // Ball should be with red goalkeeper
      expect(store.ballPossession).toBe('red')
      // After shot off target, ball goes to opponent goalkeeper
      // But opponent action might have already executed, so check actual state
      const ballHolder = store.ballPosition.player
      const hasBall = store.redPlayers.gk.hasBall || store.redPlayers.mid1.hasBall || store.redPlayers.mid2.hasBall
      
      // Ball should be with red team (either GK or midfielder)
      expect(store.ballPossession).toBe('red')
      expect(['gk', 'mid1', 'mid2']).toContain(ballHolder)
      expect(hasBall).toBe(true)
      
      // If still with goalkeeper, opponent action should be pending
      if (ballHolder === 'gk') {
        expect(store.isOpponentActionPending).toBe(true)
      }
      
      // Execute opponent action (should pass from goalkeeper)
      await store.executeOpponentAction()
      vi.advanceTimersByTime(2000) // Advance more to handle setTimeout
      
      // Ball should have moved from goalkeeper to midfielder
      // Check immediately after executeOpponentAction completes
      const gkHasBall = store.redPlayers.gk.hasBall
      const ballPlayer = store.ballPosition.player
      
      // Debug: log state if test fails
      if (gkHasBall || !['mid1', 'mid2'].includes(ballPlayer)) {
        console.log('GK hasBall:', gkHasBall, 'Ball position:', ballPlayer)
        console.log('mid1 hasBall:', store.redPlayers.mid1.hasBall)
        console.log('mid2 hasBall:', store.redPlayers.mid2.hasBall)
      }
      
      expect(store.redPlayers.gk.hasBall).toBe(false)
      expect(['mid1', 'mid2']).toContain(store.ballPosition.player)
      const midPlayer = store.redPlayers[store.ballPosition.player]
      expect(midPlayer.hasBall).toBe(true)
    })
  })

  describe('Dribble Position Logic', () => {
    it('should only allow blue mid2 to dribble past red mid2 (position 9, not 7)', async () => {
      const store = useGameStore()
      await store.initializeGame()
      vi.advanceTimersByTime(100)
      
      // Set up: blue mid2 has ball at position 4
      store.ballPossession = 'blue'
      store.ballPosition = { team: 'blue', player: 'mid2' }
      store.bluePlayers.mid2.hasBall = true
      store.bluePlayers.mid2.fieldPosition = 4
      store.redPlayers.mid2.fieldPosition = 9
      store.redPlayers.def.fieldPosition = 7
      
      // Dribble
      store.executeDribble(true)
      vi.advanceTimersByTime(100) // Advance past setTimeout delays (16ms + 50ms)
      
      // Blue mid2 should move to position 9 (red mid2 position)
      expect(store.bluePlayers.mid2.fieldPosition).toBe(9)
      // Red mid2 should move to position 4
      expect(store.redPlayers.mid2.fieldPosition).toBe(4)
      // Red defender should stay at position 7
      expect(store.redPlayers.def.fieldPosition).toBe(7)
    })

    it('should only allow blue mid1 to dribble past red mid1 (position 8)', async () => {
      const store = useGameStore()
      await store.initializeGame()
      vi.advanceTimersByTime(100)
      
      // Set up: blue mid1 has ball at position 3
      store.ballPossession = 'blue'
      store.ballPosition = { team: 'blue', player: 'mid1' }
      store.bluePlayers.mid1.hasBall = true
      store.bluePlayers.mid1.fieldPosition = 3
      store.redPlayers.mid1.fieldPosition = 8
      store.redPlayers.def.fieldPosition = 7
      
      // Dribble
      store.executeDribble(true)
      vi.advanceTimersByTime(100) // Advance past setTimeout delays (16ms + 50ms)
      
      // Blue mid1 should move to position 8 (red mid1 position)
      expect(store.bluePlayers.mid1.fieldPosition).toBe(8)
      // Red mid1 should move to position 3
      expect(store.redPlayers.mid1.fieldPosition).toBe(3)
      // Red defender should stay at position 7
      expect(store.redPlayers.def.fieldPosition).toBe(7)
    })

    it('should only allow red mid2 to dribble past blue mid2 (position 4)', async () => {
      const store = useGameStore()
      await store.initializeGame()
      vi.advanceTimersByTime(100)
      
      // Set up: red mid2 has ball at position 9
      store.ballPossession = 'red'
      store.ballPosition = { team: 'red', player: 'mid2' }
      store.redPlayers.mid2.hasBall = true
      store.redPlayers.mid2.fieldPosition = 9
      store.bluePlayers.mid2.fieldPosition = 4
      store.bluePlayers.def.fieldPosition = 2
      
      // Dribble
      store.executeDribble(true)
      vi.advanceTimersByTime(100) // Advance past setTimeout delays (16ms + 50ms)
      
      // Red mid2 should move to position 4 (blue mid2 position)
      expect(store.redPlayers.mid2.fieldPosition).toBe(4)
      // Blue mid2 should move to position 9
      expect(store.bluePlayers.mid2.fieldPosition).toBe(9)
      // Blue defender should stay at position 2
      expect(store.bluePlayers.def.fieldPosition).toBe(2)
    })
  })
})

