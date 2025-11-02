"""
Question model for representing questions from the JSON database.
"""
from typing import Dict, List, Optional


class Question:
    """Model representing a question with multilingual support."""
    
    def __init__(self, question_id: int, category: str, question_text: str,
                 answers: List[str], correct_answer: int):
        """
        Initialize a Question.
        
        Args:
            question_id: Unique identifier for the question
            category: Category name (e.g., 'math_1', 'math_2')
            question_text: Question text in the current language
            answers: List of answer options (already randomized)
            correct_answer: Index of correct answer in the answers list
        """
        self.id = question_id
        self.category = category
        self.question_text = question_text
        self.answers = answers
        self.correct_answer = correct_answer
    
    def to_dict(self) -> Dict:
        """Convert question to dictionary format."""
        return {
            'id': self.id,
            'category': self.category,
            'question': self.question_text,
            'answers': self.answers,
            'correct_answer': self.correct_answer
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'Question':
        """
        Create Question instance from dictionary.
        
        Args:
            data: Dictionary with question data
        """
        return cls(
            question_id=data['id'],
            category=data['category'],
            question_text=data['question'],
            answers=data['answers'],
            correct_answer=data['correct_answer']
        )
    
    def is_correct(self, answer_index: int) -> bool:
        """
        Check if the provided answer index is correct.
        
        Args:
            answer_index: Index of the selected answer
        
        Returns:
            True if answer is correct, False otherwise
        """
        return self.correct_answer == answer_index
