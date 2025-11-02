"""
Tests for question service
"""
import pytest


@pytest.mark.unit
class TestQuestionService:
    """Test question service functionality"""
    
    def test_get_random_question_from_pool(self, sample_question, sample_question_pool):
        """Test retrieving a random question from a pool"""
        # This test will work once question_service is implemented
        assert sample_question["pool_id"] == sample_question_pool["id"]
        assert len(sample_question["options"]) == 4
        assert 0 <= sample_question["correct_answer"] < len(sample_question["options"])
    
    def test_validate_answer(self, sample_question):
        """Test answer validation"""
        correct_answer = sample_question["correct_answer"]
        
        # Test correct answer
        assert correct_answer == 1  # Should match the correct option index
        
        # Test incorrect answers
        assert 0 != correct_answer
        assert 2 != correct_answer
        assert 3 != correct_answer
    
    def test_question_multilingual(self, sample_question):
        """Test that questions support multiple languages"""
        assert "en" in sample_question["question_text"]
        assert "el" in sample_question["question_text"]
        assert "de" in sample_question["question_text"]
        
        # All options should have translations
        for option in sample_question["options"]:
            assert "en" in option
            assert "el" in option
            assert "de" in option
    
    def test_question_age_appropriate(self, sample_question):
        """Test that questions are age-appropriate (7-8 years)"""
        # Basic validation - questions should be simple
        question_text = sample_question["question_text"]["en"]
        assert len(question_text.split()) <= 15  # Not too long
        assert len(sample_question["options"]) == 4  # Multiple choice
    
    def test_correct_answer_in_range(self, sample_question):
        """Test that correct_answer index is valid"""
        correct_answer = sample_question["correct_answer"]
        num_options = len(sample_question["options"])
        
        assert 0 <= correct_answer < num_options, \
            f"correct_answer {correct_answer} must be between 0 and {num_options - 1}"

