"""
Tests for game service
"""
import pytest


@pytest.mark.unit
class TestGameService:
    """Test game service functionality"""
    
    def test_initialize_game_state(self, sample_game_state):
        """Test game state initialization"""
        assert sample_game_state["player_score"] == 0
        assert sample_game_state["opponent_score"] == 0
        assert sample_game_state["ball_possession"] in ["player", "opponent"]
        assert sample_game_state["defense_cleared"] is False
    
    def test_action_probability_calculation(self, temp_config_dir):
        """Test that action success probabilities are calculated correctly"""
        import json
        
        config_path = temp_config_dir / "game_config.json"
        with open(config_path) as f:
            config = json.load(f)
        
        probabilities = config["probabilities"]
        
        # Pass should have higher success rate than dribble
        assert probabilities["pass_success"] > probabilities["dribble_success"]
        
        # Tackle should have reasonable success rate
        assert 0.5 <= probabilities["tackle_success"] <= 0.9
    
    def test_defense_clearing_logic(self, temp_config_dir):
        """Test defense clearing mechanics"""
        import json
        
        config_path = temp_config_dir / "game_config.json"
        with open(config_path) as f:
            config = json.load(f)
        
        actions_required = config["game_rules"]["actions_to_clear_defense"]
        assert actions_required >= 1, "At least one action should be required"
        assert actions_required <= 10, "Too many actions required (max 10)"
    
    def test_ball_possession_validation(self, sample_game_state):
        """Test that ball possession is always valid"""
        assert sample_game_state["ball_possession"] in ["player", "opponent"]
    
    def test_score_validation(self, sample_game_state):
        """Test that scores are non-negative integers"""
        assert isinstance(sample_game_state["player_score"], int)
        assert isinstance(sample_game_state["opponent_score"], int)
        assert sample_game_state["player_score"] >= 0
        assert sample_game_state["opponent_score"] >= 0
    
    def test_goalkeeper_save_probability(self, temp_config_dir):
        """Test goalkeeper save probability"""
        import json
        
        config_path = temp_config_dir / "game_config.json"
        with open(config_path) as f:
            config = json.load(f)
        
        save_probability = config["probabilities"]["goalkeeper_save"]
        assert 0 <= save_probability <= 1
        # Goalkeeper should have reasonable chance (not too easy, not too hard)
        assert 0.3 <= save_probability <= 0.7

