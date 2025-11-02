"""
Tests for configuration service
"""
import pytest
import json
from pathlib import Path


@pytest.mark.unit
class TestConfigService:
    """Test configuration service functionality"""
    
    def test_load_game_config(self, temp_config_dir):
        """Test loading game configuration from file"""
        # This test will work once config_service is implemented
        config_path = temp_config_dir / "game_config.json"
        
        with open(config_path) as f:
            config = json.load(f)
        
        assert "probabilities" in config
        assert "game_rules" in config
        assert config["probabilities"]["pass_success"] == 0.80
        assert config["game_rules"]["actions_to_clear_defense"] == 3
    
    def test_load_translations(self, temp_config_dir):
        """Test loading translations from file"""
        translations_path = temp_config_dir / "translations.json"
        
        with open(translations_path) as f:
            translations = json.load(f)
        
        assert "en" in translations
        assert "el" in translations
        assert "de" in translations
        assert translations["en"]["ui"]["pass"] == "Pass"
        assert translations["el"]["ui"]["pass"] == "Πάσα"
    
    def test_config_probabilities_range(self, temp_config_dir):
        """Test that probabilities are valid (0-1 range)"""
        config_path = temp_config_dir / "game_config.json"
        
        with open(config_path) as f:
            config = json.load(f)
        
        probabilities = config["probabilities"]
        for key, value in probabilities.items():
            assert 0 <= value <= 1, f"Probability {key} must be between 0 and 1, got {value}"

