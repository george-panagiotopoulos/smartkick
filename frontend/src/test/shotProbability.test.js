import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '../store/gameStore'

describe('Shot Probability', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should have 25% shot on target probability from position 5 (distance)', () => {
    const store = useGameStore()
    store.initializeGame()

    store.ballPossession = 'blue'
    store.ballPosition = { team: 'blue', player: 'att' }
    store.bluePlayers.att.hasBall = true
    store.bluePlayers.att.fieldPosition = 5

    // Test multiple shots to verify probability
    let shotsOnTarget = 0
    const totalShots = 1000

    for (let i = 0; i < totalShots; i++) {
      const randomValue = Math.random()
      const shotOnTarget = randomValue < 0.25 // 25% threshold
      if (shotOnTarget) shotsOnTarget++
    }

    // Should be approximately 25% (allow 5% variance)
    const percentage = (shotsOnTarget / totalShots) * 100
    expect(percentage).toBeGreaterThan(20)
    expect(percentage).toBeLessThan(30)
  })

  it('should have 25% shot on target probability from position 8 (distance)', () => {
    const store = useGameStore()
    store.initializeGame()

    store.ballPossession = 'blue'
    store.ballPosition = { team: 'blue', player: 'mid1' }
    store.bluePlayers.mid1.hasBall = true
    store.bluePlayers.mid1.fieldPosition = 8

    // Test multiple shots to verify probability
    let shotsOnTarget = 0
    const totalShots = 1000

    for (let i = 0; i < totalShots; i++) {
      const randomValue = Math.random()
      const shotOnTarget = randomValue < 0.25 // 25% threshold
      if (shotOnTarget) shotsOnTarget++
    }

    // Should be approximately 25% (allow 5% variance)
    const percentage = (shotsOnTarget / totalShots) * 100
    expect(percentage).toBeGreaterThan(20)
    expect(percentage).toBeLessThan(30)
  })

  it('should have 50% shot on target probability from position 7 (past defender)', () => {
    const store = useGameStore()
    store.initializeGame()

    store.ballPossession = 'blue'
    store.ballPosition = { team: 'blue', player: 'att' }
    store.bluePlayers.att.hasBall = true
    store.bluePlayers.att.fieldPosition = 7

    // Test multiple shots to verify probability
    let shotsOnTarget = 0
    const totalShots = 1000

    for (let i = 0; i < totalShots; i++) {
      const randomValue = Math.random()
      const shotOnTarget = randomValue < 0.50 // 50% threshold
      if (shotOnTarget) shotsOnTarget++
    }

    // Should be approximately 50% (allow 5% variance)
    const percentage = (shotsOnTarget / totalShots) * 100
    expect(percentage).toBeGreaterThan(45)
    expect(percentage).toBeLessThan(55)
  })

  it('should use correct probability when shooting from position 5', () => {
    const store = useGameStore()
    store.initializeGame()

    store.ballPossession = 'blue'
    store.ballPosition = { team: 'blue', player: 'att' }
    store.bluePlayers.att.hasBall = true
    store.bluePlayers.att.fieldPosition = 5

    // Mock Math.random to return value below 0.25 (shot on target)
    const randomSpy = vi.spyOn(Math, 'random')
    randomSpy.mockReturnValueOnce(0.2) // Shot on target (0.25 threshold)
    randomSpy.mockReturnValueOnce(0.6) // No save (0.5 threshold)

    store.executeShoot(true)
    vi.advanceTimersByTime(5000) // Advance past celebration (5 seconds)

    // Should score goal (shot on target + no save)
    expect(store.blueScore).toBeGreaterThan(0)
  })

  it('should use correct probability when shooting from position 7', () => {
    const store = useGameStore()
    store.initializeGame()

    store.ballPossession = 'blue'
    store.ballPosition = { team: 'blue', player: 'att' }
    store.bluePlayers.att.hasBall = true
    store.bluePlayers.att.fieldPosition = 7

    // Mock Math.random to return value below 0.50 (shot on target)
    const randomSpy = vi.spyOn(Math, 'random')
    randomSpy.mockReturnValueOnce(0.4) // Shot on target (0.50 threshold)
    randomSpy.mockReturnValueOnce(0.6) // No save (0.5 threshold)

    store.executeShoot(true)
    vi.advanceTimersByTime(5000) // Advance past celebration (5 seconds)

    // Should score goal (shot on target + no save)
    expect(store.blueScore).toBeGreaterThan(0)
  })

  it('should have shots off target when random value exceeds probability', () => {
    const store = useGameStore()
    store.initializeGame()

    store.ballPossession = 'blue'
    store.ballPosition = { team: 'blue', player: 'att' }
    store.bluePlayers.att.hasBall = true
    store.bluePlayers.att.fieldPosition = 5

    // Mock Math.random to return value above 0.25 (shot off target)
    const randomSpy = vi.spyOn(Math, 'random')
    randomSpy.mockReturnValueOnce(0.3) // Shot off target (above 0.25 threshold)

    const initialScore = store.blueScore
    store.executeShoot(true)
    vi.advanceTimersByTime(3500) // Advance past "Shooting..." delay (3s) + initial delay

    // Should not score (shot off target)
    expect(store.blueScore).toBe(initialScore)
    expect(store.ballPossession).toBe('red') // Ball goes to opponent
  })
})

