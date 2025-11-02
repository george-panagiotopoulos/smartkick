/**
 * Game logic service for handling action success/failure
 */

export function checkActionSuccess(action, probability) {
  // Returns true if action succeeds based on probability
  return Math.random() < probability
}

export function getRandomStance(excludeStances = []) {
  const stances = ['standing', 'defending']
  const available = stances.filter(s => !excludeStances.includes(s))
  return available[Math.floor(Math.random() * available.length)]
}

