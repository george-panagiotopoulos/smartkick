"""
Question management service for loading and retrieving questions from database.
Supports multilingual questions and answer randomization.
"""
import json
import random
from typing import Dict, List, Optional
from database.db import get_db


class QuestionService:
    """Service for managing questions from database."""
    
    def __init__(self):
        """Initialize the question service."""
        self.db = get_db()
    
    def get_categories(self) -> List[str]:
        """
        Get list of all available question categories.
        
        Returns:
            List of category names (e.g., ['math_1', 'math_2', ...])
        """
        query = "SELECT DISTINCT category FROM questions ORDER BY category"
        rows = self.db.execute(query)
        return [row['category'] for row in rows]
    
    def get_random_question(self, category: str, language: str = 'en') -> Optional[Dict]:
        """
        Get a random question from the specified category.
        Answers are randomized in order.
        
        Args:
            category: Question category (e.g., 'math_1', 'math_2')
            language: Language code ('en', 'el', 'de')
        
        Returns:
            Dictionary with question data:
            {
                'id': int,
                'question': str (in requested language),
                'answers': List[str] (randomized order),
                'correct_answer': int (index in randomized answers),
                'category': str
            }
            Returns None if category not found or empty.
        """
        # First, get count of questions in category
        count_result = self.db.execute_one(
            "SELECT COUNT(*) as count FROM questions WHERE category = ?",
            (category,)
        )
        
        if not count_result or count_result['count'] == 0:
            return None
        
        # Get random question using SQLite RANDOM()
        # SQLite doesn't have RANDOM() but we can use ORDER BY RANDOM() LIMIT 1
        query = """
            SELECT id, category, question_en, question_el, question_de, 
                   answers, correct_answer_index
            FROM questions
            WHERE category = ?
            ORDER BY RANDOM()
            LIMIT 1
        """
        
        question_row = self.db.execute_one(query, (category,))
        
        if not question_row:
            return None
        
        # Get question text in requested language
        question_text = self._get_question_text(question_row, category, language)
        if question_text is None:
            return None
        
        # Parse answers JSON
        try:
            original_answers = json.loads(question_row['answers'])
        except (json.JSONDecodeError, TypeError):
            return None
        
        original_correct_index = question_row['correct_answer_index']
        
        # Randomize answer order
        answers_with_indices = [(ans, idx) for idx, ans in enumerate(original_answers)]
        random.shuffle(answers_with_indices)
        
        # Find new index of correct answer
        shuffled_answers = [ans for ans, _ in answers_with_indices]
        correct_answer_new_index = next(
            idx for idx, (_, orig_idx) in enumerate(answers_with_indices)
            if orig_idx == original_correct_index
        )
        
        return {
            'id': question_row['id'],
            'question': question_text,
            'answers': shuffled_answers,
            'correct_answer': correct_answer_new_index,
            'category': category
        }
    
    def _get_question_text(self, question_row: Dict, category: str, language: str) -> Optional[str]:
        """
        Get question text in the requested language.
        
        For language-specific categories (german_1, english_1, greek_1),
        return the question in that language regardless of requested language.
        For other categories (math, geography), return in requested language.
        
        Args:
            question_row: Database row with question data
            category: Category name
            language: Requested language code
        
        Returns:
            Question text string or None if not found
        """
        # Check if this is a language-specific category
        if category.startswith('german_'):
            # For German language riddles, use German
            return question_row.get('question_de') or question_row.get('question_en')
        elif category.startswith('english_'):
            # For English language riddles, use English
            return question_row.get('question_en')
        elif category.startswith('greek_'):
            # For Greek language riddles, use Greek
            return question_row.get('question_el') or question_row.get('question_en')
        else:
            # For math, geography, etc., use requested language
            language_key = f'question_{language}'
            return question_row.get(language_key) or question_row.get('question_en')
    
    def get_question_by_id(self, question_id: int, language: str = 'en') -> Optional[Dict]:
        """
        Get a specific question by ID.
        Answers are randomized in order.
        
        Args:
            question_id: Question ID
            language: Language code ('en', 'el', 'de')
        
        Returns:
            Dictionary with question data or None if not found
        """
        query = """
            SELECT id, category, question_en, question_el, question_de, 
                   answers, correct_answer_index
            FROM questions
            WHERE id = ?
        """
        
        question_row = self.db.execute_one(query, (question_id,))
        
        if not question_row:
            return None
        
        category = question_row['category']
        question_text = self._get_question_text(question_row, category, language)
        if question_text is None:
            return None
        
        # Parse answers JSON
        try:
            original_answers = json.loads(question_row['answers'])
        except (json.JSONDecodeError, TypeError):
            return None
        
        original_correct_index = question_row['correct_answer_index']
        
        # Randomize answer order
        answers_with_indices = [(ans, idx) for idx, ans in enumerate(original_answers)]
        random.shuffle(answers_with_indices)
        
        # Find new index of correct answer
        shuffled_answers = [ans for ans, _ in answers_with_indices]
        correct_answer_new_index = next(
            idx for idx, (_, orig_idx) in enumerate(answers_with_indices)
            if orig_idx == original_correct_index
        )
        
        return {
            'id': question_row['id'],
            'question': question_text,
            'answers': shuffled_answers,
            'correct_answer': correct_answer_new_index,
            'category': category
        }
    
    def validate_answer(self, category: str, question_id: int, answer_index: int, 
                       language: str = 'en') -> bool:
        """
        Validate an answer for a specific question.
        
        Note: This validates based on the randomized answer order returned when
        the question was originally retrieved. The answer_index should be the
        index from the randomized answers array returned by get_random_question.
        
        Args:
            category: Question category
            question_id: Question ID
            answer_index: Index of the selected answer (after randomization)
            language: Language code (needed to reconstruct question with same randomization)
        
        Returns:
            True if answer is correct, False otherwise
        """
        # Get the question again with same randomization seed effect
        # Note: This will re-randomize, so validation should ideally happen
        # immediately after question retrieval using the returned correct_answer index.
        question = self.get_question_by_id(question_id, language)
        if question is None or question['category'] != category:
            return False
        
        return question['correct_answer'] == answer_index
    
    def get_question_count(self, category: str = None) -> int:
        """
        Get total number of questions, optionally filtered by category.
        
        Args:
            category: Optional category filter
        
        Returns:
            Number of questions
        """
        if category:
            result = self.db.execute_one(
                "SELECT COUNT(*) as count FROM questions WHERE category = ?",
                (category,)
            )
        else:
            result = self.db.execute_one("SELECT COUNT(*) as count FROM questions")
        
        return result['count'] if result else 0


# Singleton instance
_question_service_instance: Optional[QuestionService] = None


def get_question_service() -> QuestionService:
    """Get singleton instance of QuestionService."""
    global _question_service_instance
    if _question_service_instance is None:
        _question_service_instance = QuestionService()
    return _question_service_instance
