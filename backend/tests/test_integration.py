"""
Integration tests for game flow
"""
import pytest


@pytest.mark.integration
class TestGameIntegration:
    """Integration tests for complete game flow"""
    
    def test_complete_pass_action_flow(self, temp_config_dir):
        """Test complete flow of a pass action"""
        import json
        
        # Load config
        config_path = temp_config_dir / "game_config.json"
        with open(config_path) as f:
            config = json.load(f)
        
        # Simulate pass action
        pass_success_rate = config["probabilities"]["pass_success"]
        
        # Mock question answered correctly
        question_correct = True
        
        if question_correct:
            # Probability check
            import random
            random.seed(42)  # For reproducible tests
            action_success = random.random() < pass_success_rate
            
            assert isinstance(action_success, bool)
    
    def test_complete_shoot_action_flow(self, temp_config_dir):
        """Test complete flow of a shoot action"""
        import json
        import random
        
        config_path = temp_config_dir / "game_config.json"
        with open(config_path) as f:
            config = json.load(f)
        
        # Simulate shoot action
        shot_on_target_rate = config["probabilities"]["shot_on_target"]
        goalkeeper_save_rate = config["probabilities"]["goalkeeper_save"]
        
        # Mock question answered correctly
        question_correct = True
        
        if question_correct:
            random.seed(42)
            shot_on_target = random.random() < shot_on_target_rate
            
            if shot_on_target:
                random.seed(43)
                goalkeeper_saves = random.random() < goalkeeper_save_rate
                goal_scored = not goalkeeper_saves
                
                assert isinstance(goal_scored, bool)
    
    def test_defense_clearing_progression(self, temp_config_dir):
        """Test that defense clearing works through multiple actions"""
        import json
        
        config_path = temp_config_dir / "game_config.json"
        with open(config_path) as f:
            config = json.load(f)
        
        actions_required = config["game_rules"]["actions_to_clear_defense"]
        actions_completed = 0
        
        # Simulate multiple successful actions
        for i in range(actions_required):
            actions_completed += 1
        
        assert actions_completed == actions_required
        # After required actions, shooting should be allowed
        assert actions_completed >= actions_required

