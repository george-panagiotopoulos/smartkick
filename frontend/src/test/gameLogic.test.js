import { describe, it, expect, vi } from 'vitest'
import { checkActionSuccess, getRandomStance } from '../services/gameLogic'

describe('Game Logic Service', () => {
  describe('checkActionSuccess', () => {
    it('should return true when random value is below probability', () => {
      const randomSpy = vi.spyOn(Math, 'random')
      randomSpy.mockReturnValueOnce(0.5) // Below 0.8 threshold

      const result = checkActionSuccess('pass', 0.8)
      expect(result).toBe(true)

      randomSpy.mockRestore()
    })

    it('should return false when random value is above probability', () => {
      const randomSpy = vi.spyOn(Math, 'random')
      randomSpy.mockReturnValueOnce(0.9) // Above 0.8 threshold

      const result = checkActionSuccess('pass', 0.8)
      expect(result).toBe(false)

      randomSpy.mockRestore()
    })

    it('should handle probability of 0', () => {
      const randomSpy = vi.spyOn(Math, 'random')
      randomSpy.mockReturnValueOnce(0.0) // Even 0.0 is not < 0

      const result = checkActionSuccess('pass', 0)
      expect(result).toBe(false)

      randomSpy.mockRestore()
    })

    it('should handle probability of 1', () => {
      const randomSpy = vi.spyOn(Math, 'random')
      randomSpy.mockReturnValueOnce(0.99) // Below 1.0 threshold

      const result = checkActionSuccess('pass', 1)
      expect(result).toBe(true)

      randomSpy.mockRestore()
    })

    it('should work with different action types', () => {
      const randomSpy = vi.spyOn(Math, 'random')
      
      randomSpy.mockReturnValueOnce(0.5) // Below 0.6 threshold
      expect(checkActionSuccess('dribble', 0.6)).toBe(true)

      randomSpy.mockReturnValueOnce(0.7) // Above 0.6 threshold
      expect(checkActionSuccess('dribble', 0.6)).toBe(false)

      randomSpy.mockRestore()
    })
  })

  describe('getRandomStance', () => {
    it('should return a valid stance', () => {
      const validStances = ['standing', 'defending']
      const stance = getRandomStance()
      
      expect(validStances).toContain(stance)
    })

    it('should exclude specified stances', () => {
      const stance = getRandomStance(['standing'])
      
      expect(stance).toBe('defending')
    })

    it('should handle excluding all stances', () => {
      const stance = getRandomStance(['standing', 'defending'])
      
      // Should return undefined or throw - adjust based on implementation
      expect(stance).toBeUndefined()
    })

    it('should work with empty exclude list', () => {
      const validStances = ['standing', 'defending']
      const stance = getRandomStance([])
      
      expect(validStances).toContain(stance)
    })
  })
})

