"""Main Flask application"""
from flask import Flask
from flask_cors import CORS
from routes.game import game_bp
from routes.questions import questions_bp

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Register blueprints
app.register_blueprint(game_bp, url_prefix='/api/game')
app.register_blueprint(questions_bp, url_prefix='/api/questions')


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
