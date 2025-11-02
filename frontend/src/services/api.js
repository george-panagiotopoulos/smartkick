/** API service for backend communication */
// Use the current hostname and port for API calls
// This works both locally and on remote servers
const getApiBaseUrl = () => {
  // If in browser, use the same hostname/port as the frontend
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol
    const hostname = window.location.hostname
    // Use port 8000 for backend (frontend runs on 3000)
    return `${protocol}//${hostname}:8000/api`
  }
  // Fallback for non-browser environments
  return 'http://localhost:8000/api'
}

export async function startGame(duration = 'regular') {
  try {
    const response = await fetch(`${getApiBaseUrl()}/game/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ duration })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error starting game:', error)
    // Return fallback data if backend is not available
    const durationRanges = {
      tiny: { min: 10, max: 15 },
      short: { min: 40, max: 50 },
      regular: { min: 60, max: 90 },
      long: { min: 100, max: 120 }
    }
    const range = durationRanges[duration] || durationRanges.regular
    const maxActions = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
    
    return {
      success: true,
      game_id: 'local-game',
      max_score: 5,
      max_player_actions: 100,
      max_actions: maxActions,
      total_action_count: 0,
      duration: duration
    }
  }
}

export async function executeAction(gameId, action, questionCorrect) {
  try {
    const response = await fetch(`${getApiBaseUrl()}/game/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        game_id: gameId,
        action: action,
        question_correct: questionCorrect
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error executing action:', error)
    // Fallback: calculate probability with adjustment, then check success
    // Base probabilities (must match backend config)
    const baseProbs = {
      pass: 0.75,
      dribble: 0.55,
      shoot: 0.45,
      tackle: 0.50
    }
    const baseProb = baseProbs[action] || 0.5
    
    // Apply ADDITIVE adjustment based on question result
    let adjustedProb = baseProb
    if (questionCorrect) {
      // Additive increase: +15% for all actions
      adjustedProb = Math.min(1.0, baseProb + 0.15)
    } else {
      // Additive decrease: -25% for all actions
      adjustedProb = Math.max(0.0, baseProb - 0.25)
    }
    
    // Check if action succeeds (only if question was correct)
    const actionSuccess = questionCorrect && Math.random() < adjustedProb
    
    return {
      success: true,
      action_success: actionSuccess,
      probability: adjustedProb
    }
  }
}

export async function updateScore(gameId, team, points = 1) {
  try {
    const response = await fetch(`${getApiBaseUrl()}/game/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        game_id: gameId,
        team: team,
        points: points
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error updating score:', error)
    return { success: true }
  }
}

export async function getGameState(gameId) {
  try {
    const response = await fetch(`${getApiBaseUrl()}/game/state/${gameId}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error getting game state:', error)
    return null
  }
}

export async function getProbability(gameId, actor, action) {
  try {
    const response = await fetch(`${getApiBaseUrl()}/game/probability/${gameId}/${actor}/${action}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data.probability
  } catch (error) {
    console.error('Error getting probability:', error)
    return null
  }
}

export async function getRandomQuestion(category = 'math_1', language = 'en') {
  try {
    const response = await fetch(`${getApiBaseUrl()}/questions/random/${category}?language=${language}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    if (data.success && data.question) {
      return data.question
    }
    return null
  } catch (error) {
    console.error('Error fetching question:', error)
    // Return fallback question
    return {
      id: 0,
      question: 'What is 1+1?',
      answers: ['0', '1', '2', '3'],
      correct_answer: 2,
      category: category
    }
  }
}

export async function getQuestionCategories() {
  try {
    const response = await fetch(`${getApiBaseUrl()}/questions/categories`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    if (data.success && data.categories) {
      return data.categories
    }
    return []
  } catch (error) {
    console.error('Error fetching categories:', error)
    return ['math_1', 'math_2', 'math_3', 'english_1', 'german_1', 'greek_1', 'geography_1']
  }
}

