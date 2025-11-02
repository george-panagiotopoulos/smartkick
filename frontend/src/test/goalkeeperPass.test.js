import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '../store/gameStore'

describe('Goalkeeper Pass', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should allow blue goalkeeper to pass to midfielder', () => {
    const store = useGameStore()
    store.initializeGame()

    // Set goalkeeper with ball
    store.ballPossession = 'blue'
    store.ballPosition = { team: 'blue', player: 'gk' }
    store.bluePlayers.gk.hasBall = true
    store.bluePlayers.gk.fieldPosition = 1

    // Mock Math.random to control target selection
    const randomSpy = vi.spyOn(Math, 'random')
    randomSpy.mockReturnValue(0.3) // Will select position 3 (mid1)

    // Execute pass (simulate correct answer)
    store.executePass(true)
    vi.advanceTimersByTime(2000)

    // Ball should be with a midfielder
    expect(store.ballPossession).toBe('blue')
    expect(['mid1', 'mid2']).toContain(store.ballPosition.player)
    const midPlayer = store.bluePlayers[store.ballPosition.player]
    expect(midPlayer.hasBall).toBe(true)
    expect(store.bluePlayers.gk.hasBall).toBe(false)
  })

  it('should allow red goalkeeper to pass to midfielder', () => {
    const store = useGameStore()
    store.initializeGame()

    // Set red goalkeeper with ball
    store.ballPossession = 'red'
    store.ballPosition = { team: 'red', player: 'gk' }
    store.redPlayers.gk.hasBall = true
    store.redPlayers.gk.fieldPosition = 6

    // Mock Math.random to control target selection
    const randomSpy = vi.spyOn(Math, 'random')
    randomSpy.mockReturnValue(0.3) // Will select position 8 (mid1)

    // Execute pass (simulate correct answer)
    store.executePass(true)
    vi.advanceTimersByTime(2000)

    // Ball should be with a midfielder
    expect(store.ballPossession).toBe('red')
    expect(['mid1', 'mid2']).toContain(store.ballPosition.player)
    const midPlayer = store.redPlayers[store.ballPosition.player]
    expect(midPlayer.hasBall).toBe(true)
    expect(store.redPlayers.gk.hasBall).toBe(false)
  })
})

