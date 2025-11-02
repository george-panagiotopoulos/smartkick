"""Main Flask application"""
import os
from flask import Flask
from flask_cors import CORS
from routes.game import game_bp
from routes.questions import questions_bp

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Register blueprints
app.register_blueprint(game_bp, url_prefix='/api/game')
app.register_blueprint(questions_bp, url_prefix='/api/questions')


def ensure_database_initialized():
    """Ensure database is initialized with schema and questions."""
    from database.db import get_db, init_database
    
    db = get_db()
    db_path = db.db_path
    
    # Check if database file exists
    if not os.path.exists(db_path):
        print("Database not found. Initializing database...")
        init_database()
        # Load questions from JSON
        _load_questions_from_json()
    else:
        # Check if database has questions
        count_result = db.execute_one("SELECT COUNT(*) as count FROM questions")
        if not count_result or count_result['count'] == 0:
            print("Database exists but has no questions. Loading questions...")
            init_database()  # Ensure schema exists
            _load_questions_from_json()


def _load_questions_from_json():
    """Load questions from JSON file into database."""
    import json
    from database.db import get_db
    
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    json_file = os.path.join(backend_dir, 'config', 'questions.json')
    
    if not os.path.exists(json_file):
        print(f"Warning: Questions JSON file not found: {json_file}")
        return
    
    # Load questions from JSON
    with open(json_file, 'r', encoding='utf-8') as f:
        questions_data = json.load(f)
    
    db = get_db()
    
    # Insert questions
    total_inserted = 0
    for category, questions in questions_data.items():
        for question_data in questions:
            question_id = question_data.get('id')
            question_obj = question_data.get('question', {})
            answers = question_data.get('answers', [])
            correct_answer_index = question_data.get('correct_answer', 0)
            
            # Extract question text in each language
            question_en = question_obj.get('en', '')
            question_el = question_obj.get('el', '')
            question_de = question_obj.get('de', '')
            
            # Convert answers to JSON string
            answers_json = json.dumps(answers)
            
            # Insert into database
            query = """
                INSERT INTO questions 
                (category, question_en, question_el, question_de, answers, correct_answer_index)
                VALUES (?, ?, ?, ?, ?, ?)
            """
            
            db.execute_update(
                query,
                (category, question_en, question_el, question_de, answers_json, correct_answer_index)
            )
            
            total_inserted += 1
    
    print(f"✅ Loaded {total_inserted} questions into database")


# Initialize database on app startup
ensure_database_initialized()


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return {'status': 'ok'}, 200


@app.route('/api/config', methods=['GET'])
def get_config():
    """Get game configuration"""
    from services.config_service import get_config_service
    config_service = get_config_service()
    config = config_service.get_config()
    
    # Return probabilities in format expected by frontend
    probabilities = config.get('probabilities', {})
    return {
        'success': True,
        'probabilities': {
            'pass': probabilities.get('player', {}).get('pass', 0.80),
            'dribble': probabilities.get('player', {}).get('dribble', 0.60),
            'shoot': probabilities.get('player', {}).get('shoot', 0.50),
            'tackle': probabilities.get('player', {}).get('tackle', 0.75)
        },
        'goalkeeper_save': probabilities.get('goalkeeper_save', 0.50)
    }, 200


if __name__ == '__main__':
    app.run(debug=True, port=8000, host='0.0.0.0')
