import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '../store/gameStore'

describe('GameStore', () => {
  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia())
    // Mock timers
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Initialization', () => {
    it('should initialize game with correct default values', async () => {
      const store = useGameStore()
      await store.initializeGame()
      vi.advanceTimersByTime(100)

      expect(store.ballPossession).toBe('blue')
      expect(store.ballPosition.team).toBe('blue')
      expect(['mid1', 'mid2']).toContain(store.ballPosition.player)
      
      // Check that exactly one player has the ball
      const ballHolders = []
      Object.values(store.bluePlayers).forEach(player => {
        if (player.hasBall) ballHolders.push('blue')
      })
      Object.values(store.redPlayers).forEach(player => {
        if (player.hasBall) ballHolders.push('red')
      })
      expect(ballHolders.length).toBe(1)
    })

    it('should set correct field positions for all players', () => {
      const store = useGameStore()
      store.initializeGame()

      expect(store.bluePlayers.gk.fieldPosition).toBe(1)
      expect(store.bluePlayers.def.fieldPosition).toBe(2)
      expect(store.bluePlayers.mid1.fieldPosition).toBe(3)
      expect(store.bluePlayers.mid2.fieldPosition).toBe(4)
      expect(store.bluePlayers.att.fieldPosition).toBe(5)

      expect(store.redPlayers.gk.fieldPosition).toBe(6)
      expect(store.redPlayers.def.fieldPosition).toBe(7)
      expect(store.redPlayers.mid1.fieldPosition).toBe(8)
      expect(store.redPlayers.mid2.fieldPosition).toBe(9)
      expect(store.redPlayers.att.fieldPosition).toBe(10)
    })

    it('should set player with ball to passing stance', async () => {
      const store = useGameStore()
      await store.initializeGame()
      vi.advanceTimersByTime(100)

      const ballHolder = store.bluePlayers[store.ballPosition.player]
      expect(ballHolder.hasBall).toBe(true)
      expect(ballHolder.stance).toBe('passing')
    })
  })

  describe('Ball Possession Validation', () => {
    it('should have exactly one player with ball at all times', async () => {
      const store = useGameStore()
      await store.initializeGame()
      vi.advanceTimersByTime(100)

      let ballCount = 0
      Object.values(store.bluePlayers).forEach(player => {
        if (player.hasBall) ballCount++
      })
      Object.values(store.redPlayers).forEach(player => {
        if (player.hasBall) ballCount++
      })

      expect(ballCount).toBe(1)
    })

    it('should match ballPosition with actual ball holder', async () => {
      const store = useGameStore()
      await store.initializeGame()
      vi.advanceTimersByTime(100)

      const team = store.ballPossession === 'blue' ? store.bluePlayers : store.redPlayers
      const ballHolder = team[store.ballPosition.player]
      
      expect(ballHolder.hasBall).toBe(true)
      expect(store.ballPosition.team).toBe(store.ballPossession)
    })
  })

  describe('Shoot Availability', () => {
    it('should allow shooting when blue attacker has ball', () => {
      const store = useGameStore()
      store.initializeGame()

      // Set ball to blue attacker
      store.ballPossession = 'blue'
      store.ballPosition = { team: 'blue', player: 'att' }
      store.bluePlayers.att.hasBall = true
      store.bluePlayers.att.fieldPosition = 5

      store.checkShootAvailability()
      expect(store.canShoot).toBe(true)
    })

    it('should allow shooting when blue player reaches position 7', () => {
      const store = useGameStore()
      store.initializeGame()

      // Set ball to blue midfielder and move to position 7
      store.ballPossession = 'blue'
      store.ballPosition = { team: 'blue', player: 'mid1' }
      store.bluePlayers.mid1.hasBall = true
      store.bluePlayers.mid1.fieldPosition = 7

      store.checkShootAvailability()
      expect(store.canShoot).toBe(true)
    })

    it('should allow shooting when red attacker has ball', () => {
      const store = useGameStore()
      store.initializeGame()

      store.ballPossession = 'red'
      store.ballPosition = { team: 'red', player: 'att' }
      store.redPlayers.att.hasBall = true
      store.redPlayers.att.fieldPosition = 10

      store.checkShootAvailability()
      expect(store.canShoot).toBe(true)
    })

    it('should not allow shooting from midfield positions', () => {
      const store = useGameStore()
      store.initializeGame()

      store.ballPossession = 'blue'
      store.ballPosition = { team: 'blue', player: 'mid1' }
      store.bluePlayers.mid1.hasBall = true
      store.bluePlayers.mid1.fieldPosition = 3

      store.checkShootAvailability()
      expect(store.canShoot).toBe(false)
    })
  })

  describe('Pass Action', () => {
    it('should transfer ball on successful pass', () => {
      const store = useGameStore()
      store.initializeGame()

      // Set ball to blue mid1
      store.ballPossession = 'blue'
      store.ballPosition = { team: 'blue', player: 'mid1' }
      store.bluePlayers.mid1.hasBall = true
      store.bluePlayers.mid1.fieldPosition = 3

      const initialPlayer = store.ballPosition.player
      store.executePass(true)

      // Ball should move to another player
      expect(store.ballPosition.player).not.toBe(initialPlayer)
      expect(store.bluePlayers[initialPlayer].hasBall).toBe(false)
      
      // New player should have ball
      const newPlayer = store.bluePlayers[store.ballPosition.player]
      expect(newPlayer.hasBall).toBe(true)
    })

    it('should transfer ball to opponent on failed pass', () => {
      const store = useGameStore()
      store.initializeGame()

      store.ballPossession = 'blue'
      store.ballPosition = { team: 'blue', player: 'mid1' }
      store.bluePlayers.mid1.hasBall = true

      store.executePass(false)

      expect(store.ballPossession).toBe('red')
      expect(store.bluePlayers.mid1.hasBall).toBe(false)
      
      // Red team should have ball
      const redPlayer = store.redPlayers[store.ballPosition.player]
      expect(redPlayer.hasBall).toBe(true)
    })

    it('should not allow pass from attacker position', () => {
      const store = useGameStore()
      store.initializeGame()

      store.ballPossession = 'blue'
      store.ballPosition = { team: 'blue', player: 'att' }
      store.bluePlayers.att.hasBall = true
      store.bluePlayers.att.fieldPosition = 5

      const initialPos = store.ballPosition
      store.executePass(true)

      // Position should not change (pass not allowed)
      expect(store.ballPosition.player).toBe(initialPos.player)
    })
  })

  describe('Dribble Action', () => {
    it('should move player forward on successful dribble', async () => {
      const store = useGameStore()
      await store.initializeGame()
      vi.advanceTimersByTime(100)

      store.ballPossession = 'blue'
      store.ballPosition = { team: 'blue', player: 'att' }
      store.bluePlayers.att.hasBall = true
      store.bluePlayers.att.fieldPosition = 5

      store.executeDribble(true)
      vi.advanceTimersByTime(100) // Advance past setTimeout delays (16ms + 50ms)

      // Attacker should move to position 7 (past defender)
      expect(store.bluePlayers.att.fieldPosition).toBe(7)
      expect(store.redPlayers.def.fieldPosition).toBe(5)
      expect(store.defenderDribbledPast).toBe(true)
    })

    it('should transfer ball to opponent on failed dribble', () => {
      const store = useGameStore()
      store.initializeGame()

      store.ballPossession = 'blue'
      store.ballPosition = { team: 'blue', player: 'mid1' }
      store.bluePlayers.mid1.hasBall = true

      store.executeDribble(false)

      expect(store.ballPossession).toBe('red')
      expect(store.bluePlayers.mid1.hasBall).toBe(false)
    })
  })

  describe('Shoot Action', () => {
    it('should score goal when shot succeeds and goalkeeper fails to save', () => {
      const store = useGameStore()
      store.initializeGame()

      store.ballPossession = 'blue'
      store.ballPosition = { team: 'blue', player: 'att' }
      store.bluePlayers.att.hasBall = true
      store.bluePlayers.att.fieldPosition = 5
      const initialScore = store.blueScore

      // Mock Math.random to return shot on target and no save
      // Position 5 is distance shot, so 25% chance on target
      const randomSpy = vi.spyOn(Math, 'random')
      randomSpy.mockReturnValueOnce(0.2) // Shot on target (0.25 threshold for position 5)
      randomSpy.mockReturnValueOnce(0.6) // No save (0.5 threshold)

      store.executeShoot(true)
      vi.advanceTimersByTime(3500) // Advance past "Shooting..." delay (3s) + initial delay
      vi.advanceTimersByTime(5000) // Advance past celebration (5 seconds)

      expect(store.blueScore).toBe(initialScore + 1)
      expect(store.isCelebrating).toBe(false)
    })

    it('should give ball to goalkeeper on shot off target', () => {
      const store = useGameStore()
      store.initializeGame()

      store.ballPossession = 'blue'
      store.ballPosition = { team: 'blue', player: 'att' }
      store.bluePlayers.att.hasBall = true

      store.executeShoot(false)
      vi.advanceTimersByTime(2000) // Advance past goalkeeper pass delay

      expect(store.ballPossession).toBe('red')
      // Goalkeeper immediately passes to midfielder (bug fix)
      expect(['mid1', 'mid2']).toContain(store.ballPosition.player)
      const midPlayer = store.redPlayers[store.ballPosition.player]
      expect(midPlayer.hasBall).toBe(true)
      expect(store.redPlayers.gk.hasBall).toBe(false)
    })

    it('should transfer ball after goalkeeper save', () => {
      const store = useGameStore()
      store.initializeGame()

      store.ballPossession = 'blue'
      store.ballPosition = { team: 'blue', player: 'att' }
      store.bluePlayers.att.hasBall = true

      // Mock Math.random for shot on target and save
      const randomSpy = vi.spyOn(Math, 'random')
      randomSpy.mockReturnValueOnce(0.3) // Shot on target
      randomSpy.mockReturnValueOnce(0.3) // Goalkeeper saves

      store.executeShoot(true)
      vi.advanceTimersByTime(3500) // Advance past "Shooting..." delay (3s) + initial delay
      vi.advanceTimersByTime(3000) // Advance past goalkeeper save message

      // Goalkeeper stance may be 'standing' or 'defending' after resetOtherPlayers
      expect(['standing', 'defending']).toContain(store.redPlayers.gk.stance)
      expect(store.ballPossession).toBe('red')
    })
  })

  describe('Transfer Ball to Opponent', () => {
    it('should transfer ball to random opponent midfielder', () => {
      const store = useGameStore()
      store.initializeGame()

      store.ballPossession = 'blue'
      store.ballPosition = { team: 'blue', player: 'mid1' }
      store.bluePlayers.mid1.hasBall = true

      store.transferBallToOpponent()

      expect(store.ballPossession).toBe('red')
      expect(store.ballPosition.team).toBe('red')
      expect(['mid1', 'mid2']).toContain(store.ballPosition.player)
      
      const redPlayer = store.redPlayers[store.ballPosition.player]
      expect(redPlayer.hasBall).toBe(true)
    })

    it('should clear all balls before transferring', () => {
      const store = useGameStore()
      store.initializeGame()

      // Intentionally set multiple players with ball (bug scenario)
      store.bluePlayers.mid1.hasBall = true
      store.bluePlayers.mid2.hasBall = true

      store.transferBallToOpponent()

      // After transfer, only one player should have ball
      let ballCount = 0
      Object.values(store.bluePlayers).forEach(p => { if (p.hasBall) ballCount++ })
      Object.values(store.redPlayers).forEach(p => { if (p.hasBall) ballCount++ })

      expect(ballCount).toBe(1)
    })
  })

  describe('Player Position Finding', () => {
    it('should find player by field position for blue team', () => {
      const store = useGameStore()
      store.initializeGame()

      const player = store.findPlayerByFieldPosition('blue', 3)
      expect(player).toBe('mid1')
    })

    it('should find player by field position for red team', () => {
      const store = useGameStore()
      store.initializeGame()

      const player = store.findPlayerByFieldPosition('red', 8)
      expect(player).toBe('mid1')
    })

    it('should return null for invalid field position', () => {
      const store = useGameStore()
      store.initializeGame()

      const player = store.findPlayerByFieldPosition('blue', 99)
      expect(player).toBeNull()
    })
  })

  describe('Computed Properties', () => {
    it('should return correct current team', () => {
      const store = useGameStore()
      store.initializeGame()

      store.ballPossession = 'blue'
      expect(store.currentTeam).toBe(store.bluePlayers)

      store.ballPossession = 'red'
      expect(store.currentTeam).toBe(store.redPlayers)
    })

    it('should return correct opponent team', () => {
      const store = useGameStore()
      store.initializeGame()

      store.ballPossession = 'blue'
      expect(store.opponentTeam).toBe(store.redPlayers)

      store.ballPossession = 'red'
      expect(store.opponentTeam).toBe(store.bluePlayers)
    })

    it('should return correct current player', () => {
      const store = useGameStore()
      store.initializeGame()

      store.ballPossession = 'blue'
      store.ballPosition = { team: 'blue', player: 'mid1' }
      
      expect(store.currentPlayer).toBe(store.bluePlayers.mid1)
    })
  })
})

