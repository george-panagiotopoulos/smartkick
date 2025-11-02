"""Game state management service"""
import random
import uuid
from typing import Dict, Optional
from datetime import datetime
from services.config_service import get_config_service


class GameState:
    """Represents the current state of a game"""
    
    def __init__(self, game_id: Optional[str] = None, duration: str = 'regular'):
        self.game_id = game_id or str(uuid.uuid4())
        self.blue_score = 0
        self.red_score = 0
        self.player_action_count = 0
        self.total_action_count = 0  # Total actions from both player and opponent
        self.max_score = self._calculate_max_score()
        self.max_player_actions = 100
        self.duration = duration  # 'short', 'regular', or 'long'
        self.max_actions = self._calculate_max_actions(duration)  # Random max actions based on duration
        self.is_game_over = False
        self.game_over_reason = None
        self.created_at = datetime.now()
        
        # Dynamic probabilities (can be adjusted based on question results)
        self.current_probabilities = {
            'player': {
                'pass': None,  # None means use config default
                'dribble': None,
                'shoot': None,
                'tackle': None
            }
        }
    
    def _calculate_max_score(self) -> int:
        """
        Calculate random max score: 30% chance for 3, 4, or 5, 10% chance for 6
        """
        rand = random.random()
        if rand < 0.30:
            return 3
        elif rand < 0.60:
            return 4
        elif rand < 0.90:
            return 5
        else:
            return 6
    
    def _calculate_max_actions(self, duration: str) -> int:
        """
        Calculate random max actions based on duration setting
        
        Args:
            duration: 'short', 'regular', or 'long'
        
        Returns:
            Random integer between min and max for the duration
        """
        config_service = get_config_service()
        duration_config = config_service.get_game_duration()
        
        duration_type = duration_config.get(duration, duration_config.get('regular', {}))
        if isinstance(duration_type, dict):
            min_actions = duration_type.get('min', 60)
            max_actions = duration_type.get('max', 90)
        else:
            # Fallback if structure is different
            duration_type = duration_config.get('regular', {})
            min_actions = duration_type.get('min', 60)
            max_actions = duration_type.get('max', 90)
        
        return random.randint(min_actions, max_actions)
    
    def increment_player_action(self):
        """Increment player action count"""
        self.player_action_count += 1
        self.total_action_count += 1
        self._check_game_over()
    
    def increment_total_action(self):
        """Increment total action count (for opponent actions)"""
        self.total_action_count += 1
        self._check_game_over()
    
    def update_score(self, team: str, points: int = 1):
        """
        Update score for a team
        
        Args:
            team: 'blue' or 'red'
            points: Number of points to add (default 1)
        """
        if team == 'blue':
            self.blue_score += points
        elif team == 'red':
            self.red_score += points
        else:
            raise ValueError(f"Invalid team: {team}")
        
        self._check_game_over()
    
    def _check_game_over(self):
        """Check if game should end based on score or action count"""
        if self.is_game_over:
            return
        
        # Check max score
        if self.blue_score >= self.max_score:
            self.is_game_over = True
            self.game_over_reason = f"Blue team reached max score ({self.max_score})"
        elif self.red_score >= self.max_score:
            self.is_game_over = True
            self.game_over_reason = f"Red team reached max score ({self.max_score})"
        
        # Check max player actions (legacy)
        if self.player_action_count >= self.max_player_actions:
            self.is_game_over = True
            self.game_over_reason = f"Reached max player actions ({self.max_player_actions})"
        
        # Check total action count (new game ending mechanism)
        if self.total_action_count >= self.max_actions:
            self.is_game_over = True
            self.game_over_reason = f"Game ended after {self.max_actions} actions"
    
    def adjust_probability(self, action: str, correct: bool):
        """
        Adjust probability for an action based on question result.
        This adjustment is TEMPORARY - only applies to the current action attempt.
        Uses ADDITIVE adjustments: +15% for correct, -25% for wrong.
        
        Args:
            action: 'pass', 'dribble', 'shoot', or 'tackle'
            correct: True if question was answered correctly
        """
        config_service = get_config_service()
        base_prob = config_service.get_probability('player', action)
        
        # Always start from base probability (don't accumulate)
        current_prob = base_prob
        
        if correct:
            # Additive increase: +15% for all actions
            new_prob = min(1.0, current_prob + 0.15)
        else:
            # Additive decrease: -25% for all actions
            new_prob = max(0.0, current_prob - 0.25)
        
        # Store temporarily for this action
        self.current_probabilities['player'][action] = new_prob
    
    def get_current_probability(self, actor: str, action: str) -> float:
        """
        Get current probability for an action, using adjusted value if available
        
        Args:
            actor: 'player' or 'opponent'
            action: 'pass', 'dribble', 'shoot', or 'tackle'
        
        Returns:
            Probability value
        """
        config_service = get_config_service()
        
        if actor == 'player':
            # Check if we have an adjusted probability
            adjusted_prob = self.current_probabilities['player'].get(action)
            if adjusted_prob is not None:
                return adjusted_prob
        
        # Use config default
        return config_service.get_probability(actor, action)
    
    def to_dict(self) -> Dict:
        """Convert game state to dictionary"""
        return {
            'game_id': self.game_id,
            'blue_score': self.blue_score,
            'red_score': self.red_score,
            'player_action_count': self.player_action_count,
            'total_action_count': self.total_action_count,
            'max_score': self.max_score,
            'max_player_actions': self.max_player_actions,
            'max_actions': self.max_actions,
            'duration': self.duration,
            'is_game_over': self.is_game_over,
            'game_over_reason': self.game_over_reason,
            'created_at': self.created_at.isoformat()
        }


class GameService:
    """Service for managing game state"""
    
    def __init__(self):
        self._games: Dict[str, GameState] = {}
        self.config_service = get_config_service()
        
        # Load max_player_actions from config
        game_rules = self.config_service.get_game_rules()
        self.max_player_actions = game_rules.get('max_player_actions', 100)
    
    def create_game(self, duration: str = 'regular') -> GameState:
        """
        Create a new game
        
        Args:
            duration: 'short', 'regular', or 'long' (default: 'regular')
        
        Returns:
            New GameState instance
        """
        game_state = GameState(duration=duration)
        game_state.max_player_actions = self.max_player_actions
        self._games[game_state.game_id] = game_state
        return game_state
    
    def get_game(self, game_id: str) -> Optional[GameState]:
        """Get game state by ID"""
        return self._games.get(game_id)
    
    def update_game(self, game_id: str, **kwargs) -> Optional[GameState]:
        """Update game state"""
        game = self.get_game(game_id)
        if not game:
            return None
        
        for key, value in kwargs.items():
            if hasattr(game, key):
                setattr(game, key, value)
        
        return game


# Singleton instance
_game_service = None


def get_game_service() -> GameService:
    """Get singleton game service instance"""
    global _game_service
    if _game_service is None:
        _game_service = GameService()
    return _game_service
