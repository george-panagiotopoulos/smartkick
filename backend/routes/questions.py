"""
API routes for question management.
"""
from flask import Blueprint, request, jsonify
from services.question_service import get_question_service
from models.question import Question

questions_bp = Blueprint('questions', __name__)


@questions_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get list of all available question categories."""
    try:
        question_service = get_question_service()
        categories = question_service.get_categories()
        return jsonify({
            'success': True,
            'categories': categories
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@questions_bp.route('/random/<category>', methods=['GET'])
def get_random_question(category: str):
    """
    Get a random question from the specified category.
    
    Query parameters:
        language: Language code ('en', 'el', 'de'). Defaults to 'en'.
    
    Returns:
        Question with randomized answer order.
    """
    try:
        language = request.args.get('language', 'en')
        
        if language not in ['en', 'el', 'de']:
            return jsonify({
                'success': False,
                'error': f"Invalid language code: {language}. Must be 'en', 'el', or 'de'."
            }), 400
        
        question_service = get_question_service()
        question_data = question_service.get_random_question(category, language)
        
        if question_data is None:
            return jsonify({
                'success': False,
                'error': f"Category '{category}' not found or empty."
            }), 404
        
        return jsonify({
            'success': True,
            'question': question_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@questions_bp.route('/validate', methods=['POST'])
def validate_answer():
    """
    Validate an answer for a question.
    
    Request body:
        {
            'category': str,
            'question_id': int,
            'answer_index': int,
            'language': str (optional, defaults to 'en')
        }
    
    Note: In practice, validation should use the correct_answer index
    returned when the question was retrieved, since answers are randomized.
    This endpoint is provided for completeness but may not work correctly
    with randomized answers.
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body is required'
            }), 400
        
        category = data.get('category')
        question_id = data.get('question_id')
        answer_index = data.get('answer_index')
        language = data.get('language', 'en')
        
        if category is None or question_id is None or answer_index is None:
            return jsonify({
                'success': False,
                'error': 'Missing required fields: category, question_id, answer_index'
            }), 400
        
        question_service = get_question_service()
        is_correct = question_service.validate_answer(
            category, question_id, answer_index, language
        )
        
        return jsonify({
            'success': True,
            'correct': is_correct
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

