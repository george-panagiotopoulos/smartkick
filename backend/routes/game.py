"""Game logic API routes"""
from flask import Blueprint, request, jsonify
from services.game_service import get_game_service
from services.config_service import get_config_service

game_bp = Blueprint('game', __name__)


@game_bp.route('/start', methods=['POST'])
def start_game():
    """Start a new game"""
    data = request.get_json() or {}
    duration = data.get('duration', 'regular')  # Get duration from request, default to 'regular'
    
    # Validate duration
    if duration not in ['tiny', 'short', 'regular', 'long']:
        duration = 'regular'
    
    game_service = get_game_service()
    game_state = game_service.create_game(duration=duration)
    
    return jsonify({
        'success': True,
        'game_id': game_state.game_id,
        'max_score': game_state.max_score,
        'max_player_actions': game_state.max_player_actions,
        'max_actions': game_state.max_actions,
        'total_action_count': game_state.total_action_count,
        'duration': game_state.duration
    }), 201


@game_bp.route('/state/<game_id>', methods=['GET'])
def get_game_state(game_id):
    """Get current game state"""
    game_service = get_game_service()
    game_state = game_service.get_game(game_id)
    
    if not game_state:
        return jsonify({'success': False, 'error': 'Game not found'}), 404
    
    return jsonify({
        'success': True,
        'game': game_state.to_dict()
    }), 200


@game_bp.route('/action', methods=['POST'])
def execute_action():
    """Execute a player action"""
    data = request.get_json()
    game_id = data.get('game_id')
    action = data.get('action')  # 'pass', 'dribble', 'shoot', 'tackle'
    question_correct = data.get('question_correct', False)
    
    if not game_id or not action:
        return jsonify({'success': False, 'error': 'Missing game_id or action'}), 400
    
    game_service = get_game_service()
    game_state = game_service.get_game(game_id)
    
    if not game_state:
        return jsonify({'success': False, 'error': 'Game not found'}), 404
    
    if game_state.is_game_over:
        return jsonify({
            'success': False,
            'error': 'Game is over',
            'reason': game_state.game_over_reason
        }), 400
    
    # Adjust probability based on question result (temporary for this action only)
    game_state.adjust_probability(action, question_correct)
    
    # Get current probability for this action (includes temporary adjustment)
    probability = game_state.get_current_probability('player', action)
    
    # Increment player action count
    game_state.increment_player_action()
    
    # Check if action succeeds (using the adjusted probability)
    success = False
    if question_correct:
        import random
        random_value = random.random()
        success = random_value < probability
        # Debug logging
        print(f"[BACKEND] Action: {action}, Correct: {question_correct}, Probability: {probability:.2f}, Random: {random_value:.3f}, Success: {success}")
    else:
        print(f"[BACKEND] Action: {action}, Correct: {question_correct}, Success: False (question wrong)")
    
    # Reset probability adjustment after using it (so it doesn't accumulate)
    # Clear the temporary adjustment so next action starts from base
    game_state.current_probabilities['player'][action] = None
    
    return jsonify({
        'success': True,
        'action_success': success,
        'probability': probability,
        'game': game_state.to_dict()
    }), 200


@game_bp.route('/score', methods=['POST'])
def update_score():
    """Update game score"""
    data = request.get_json()
    game_id = data.get('game_id')
    team = data.get('team')  # 'blue' or 'red'
    points = data.get('points', 1)
    
    if not game_id or not team:
        return jsonify({'success': False, 'error': 'Missing game_id or team'}), 400
    
    game_service = get_game_service()
    game_state = game_service.get_game(game_id)
    
    if not game_state:
        return jsonify({'success': False, 'error': 'Game not found'}), 404
    
    game_state.update_score(team, points)
    
    return jsonify({
        'success': True,
        'game': game_state.to_dict()
    }), 200


@game_bp.route('/probability/<game_id>/<actor>/<action>', methods=['GET'])
def get_probability(game_id, actor, action):
    """Get current probability for an action"""
    game_service = get_game_service()
    game_state = game_service.get_game(game_id)
    
    if not game_state:
        return jsonify({'success': False, 'error': 'Game not found'}), 404
    
    try:
        probability = game_state.get_current_probability(actor, action)
        return jsonify({
            'success': True,
            'probability': probability,
            'actor': actor,
            'action': action
        }), 200
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@game_bp.route('/settings/duration', methods=['GET'])
def get_duration_settings():
    """Get game duration settings"""
    config_service = get_config_service()
    duration_config = config_service.get_game_duration()
    
    return jsonify({
        'success': True,
        'duration_settings': duration_config
    }), 200
