"""
Pytest configuration and fixtures for backend tests
"""
import pytest
import os
import sys
import tempfile
import json
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


@pytest.fixture
def temp_config_dir(tmp_path):
    """Create a temporary directory with test configuration files"""
    config_dir = tmp_path / "config"
    config_dir.mkdir()
    
    # Create test game_config.json
    game_config = {
        "probabilities": {
            "pass_success": 0.80,
            "dribble_success": 0.60,
            "shot_on_target": 0.50,
            "goalkeeper_save": 0.50,
            "tackle_success": 0.75
        },
        "game_rules": {
            "actions_to_clear_defense": 3,
            "match_duration_minutes": 5,
            "max_score": None
        },
        "foul_penalty": "free_kick"
    }
    
    with open(config_dir / "game_config.json", "w") as f:
        json.dump(game_config, f)
    
    # Create test translations.json
    translations = {
        "en": {
            "ui": {
                "pass": "Pass",
                "dribble": "Dribble",
                "shoot": "Shoot",
                "tackle": "Tackle"
            }
        },
        "el": {
            "ui": {
                "pass": "Πάσα",
                "dribble": "Ντρίμπλα",
                "shoot": "Σουτ",
                "tackle": "Μαρκάρισμα"
            }
        },
        "de": {
            "ui": {
                "pass": "Pass",
                "dribble": "Dribbling",
                "shoot": "Schießen",
                "tackle": "Tackling"
            }
        }
    }
    
    with open(config_dir / "translations.json", "w") as f:
        json.dump(translations, f)
    
    return config_dir


@pytest.fixture
def temp_db(tmp_path):
    """Create a temporary SQLite database for testing"""
    db_path = tmp_path / "test.db"
    return str(db_path)


@pytest.fixture
def sample_question():
    """Sample question data for testing"""
    return {
        "id": 1,
        "pool_id": 1,
        "question_text": {
            "en": "What is 2 + 2?",
            "el": "Πόσο κάνει 2 + 2;",
            "de": "Was ist 2 + 2?"
        },
        "options": [
            {"en": "3", "el": "3", "de": "3"},
            {"en": "4", "el": "4", "de": "4"},
            {"en": "5", "el": "5", "de": "5"},
            {"en": "6", "el": "6", "de": "6"}
        ],
        "correct_answer": 1,
        "difficulty": "easy",
        "subject": "math"
    }


@pytest.fixture
def sample_question_pool():
    """Sample question pool data for testing"""
    return {
        "id": 1,
        "name": "Math Basics",
        "description": {
            "en": "Basic math questions for ages 7-8",
            "el": "Βασικές μαθηματικές ερωτήσεις για ηλικίες 7-8",
            "de": "Grundlegende Mathematikfragen für 7-8 Jahre"
        },
        "active": True
    }


@pytest.fixture
def sample_game_state():
    """Sample game state for testing"""
    return {
        "game_id": "test-game-123",
        "player_score": 0,
        "opponent_score": 0,
        "ball_possession": "player",
        "defense_cleared": False,
        "current_action": None
    }

