#!/usr/bin/env python3
"""
Migration script to load questions from JSON file into database.
"""
import json
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db import get_db, init_database


def migrate_questions_from_json(json_file: str = None):
    """
    Migrate questions from JSON file to database.
    
    Args:
        json_file: Path to questions.json file. Defaults to config/questions.json
    """
    if json_file is None:
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        json_file = os.path.join(backend_dir, 'config', 'questions.json')
    
    if not os.path.exists(json_file):
        raise FileNotFoundError(f"Questions JSON file not found: {json_file}")
    
    # Load questions from JSON
    print(f"Loading questions from {json_file}...")
    with open(json_file, 'r', encoding='utf-8') as f:
        questions_data = json.load(f)
    
    # Initialize database
    print("Initializing database...")
    init_database()
    
    db = get_db()
    
    # Clear existing questions (optional - comment out if you want to keep existing)
    print("Clearing existing questions...")
    db.execute_update("DELETE FROM questions")
    
    # Insert questions
    total_inserted = 0
    for category, questions in questions_data.items():
        print(f"\nProcessing category: {category}")
        category_count = 0
        
        for question_data in questions:
            question_id = question_data.get('id')
            question_obj = question_data.get('question', {})
            answers = question_data.get('answers', [])
            correct_answer_index = question_data.get('correct_answer', 0)
            
            # Extract question text in each language
            question_en = question_obj.get('en', '')
            question_el = question_obj.get('el', '')
            question_de = question_obj.get('de', '')
            
            # Convert answers to JSON string
            answers_json = json.dumps(answers)
            
            # Insert into database
            query = """
                INSERT INTO questions 
                (category, question_en, question_el, question_de, answers, correct_answer_index)
                VALUES (?, ?, ?, ?, ?, ?)
            """
            
            db.execute_update(
                query,
                (category, question_en, question_el, question_de, answers_json, correct_answer_index)
            )
            
            category_count += 1
            total_inserted += 1
        
        print(f"  Inserted {category_count} questions")
    
    print(f"\n✅ Migration complete! Total questions inserted: {total_inserted}")
    
    # Verify migration
    print("\nVerifying migration...")
    for category in questions_data.keys():
        count = db.execute_one(
            "SELECT COUNT(*) as count FROM questions WHERE category = ?",
            (category,)
        )
        print(f"  {category}: {count['count']} questions")


if __name__ == '__main__':
    try:
        migrate_questions_from_json()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

