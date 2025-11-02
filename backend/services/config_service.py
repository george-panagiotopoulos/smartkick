"""Configuration management service"""
import json
import os
from typing import Dict, Optional


class ConfigService:
    """Service for loading and managing game configuration"""
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize config service with path to config file"""
        if config_path is None:
            # Default to config directory relative to this file
            current_dir = os.path.dirname(os.path.abspath(__file__))
            config_path = os.path.join(current_dir, '..', 'config', 'game_config.json')
        self.config_path = config_path
        self._config = None
        self._load_config()
    
    def _load_config(self):
        """Load configuration from JSON file"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                self._config = json.load(f)
        except FileNotFoundError:
            raise FileNotFoundError(f"Config file not found: {self.config_path}")
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in config file: {e}")
    
    def get_probability(self, actor: str, action: str) -> float:
        """
        Get probability for a specific actor and action.
        Checks variables first, then falls back to default probabilities.
        
        Args:
            actor: 'player' or 'opponent'
            action: 'pass', 'dribble', 'shoot', or 'tackle'
        
        Returns:
            Probability value (0.0 to 1.0)
        """
        if actor not in ['player', 'opponent']:
            raise ValueError(f"Invalid actor: {actor}. Must be 'player' or 'opponent'")
        
        if action not in ['pass', 'dribble', 'shoot', 'tackle']:
            raise ValueError(f"Invalid action: {action}")
        
        # Check if variable is set
        variable_key = f"{actor}_{action}"
        variables = self._config.get('variables', {})
        variable_value = variables.get(variable_key)
        
        if variable_value is not None:
            return float(variable_value)
        
        # Fall back to default probability
        probabilities = self._config.get('probabilities', {})
        actor_probs = probabilities.get(actor, {})
        default_prob = actor_probs.get(action, 0.5)
        
        return float(default_prob)
    
    def set_variable(self, actor: str, action: str, value: Optional[float]):
        """
        Set a variable value in the config.
        
        Args:
            actor: 'player' or 'opponent'
            action: 'pass', 'dribble', 'shoot', or 'tackle'
            value: Probability value (0.0 to 1.0) or None to clear variable
        """
        if actor not in ['player', 'opponent']:
            raise ValueError(f"Invalid actor: {actor}")
        
        if action not in ['pass', 'dribble', 'shoot', 'tackle']:
            raise ValueError(f"Invalid action: {action}")
        
        if value is not None:
            value = float(value)
            if not 0.0 <= value <= 1.0:
                raise ValueError(f"Probability must be between 0.0 and 1.0, got {value}")
        
        variable_key = f"{actor}_{action}"
        
        if 'variables' not in self._config:
            self._config['variables'] = {}
        
        self._config['variables'][variable_key] = value
        
        # Save to file
        self._save_config()
    
    def _save_config(self):
        """Save configuration to JSON file"""
        try:
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(self._config, f, indent=2)
        except Exception as e:
            raise IOError(f"Failed to save config: {e}")
    
    def get_goalkeeper_save_probability(self) -> float:
        """Get goalkeeper save probability"""
        probabilities = self._config.get('probabilities', {})
        return float(probabilities.get('goalkeeper_save', 0.5))
    
    def get_game_rules(self) -> Dict:
        """Get game rules configuration"""
        return self._config.get('game_rules', {})
    
    def get_config(self) -> Dict:
        """Get full configuration"""
        return self._config.copy()


# Singleton instance
_config_service = None


def get_config_service() -> ConfigService:
    """Get singleton config service instance"""
    global _config_service
    if _config_service is None:
        _config_service = ConfigService()
    return _config_service
