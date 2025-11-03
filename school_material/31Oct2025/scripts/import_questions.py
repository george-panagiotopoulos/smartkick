#!/usr/bin/env python3
"""
Import new questions from questions_for_review.json into the database.
"""
import json
import os
import sys

# Add backend directory to path for database imports
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
backend_dir = os.path.join(project_root, 'backend')
sys.path.insert(0, backend_dir)

from database.db import get_db, init_database


def import_questions_from_json(json_file: str):
    """
    Import questions from JSON file to database without clearing existing questions.
    
    Args:
        json_file: Path to questions JSON file
    """
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
    
    # Insert questions
    total_inserted = 0
    skipped = 0
    
    for category, questions in questions_data.items():
        print(f"\nProcessing category: {category}")
        category_count = 0
        
        for question_data in questions:
            question_obj = question_data.get('question', {})
            answers = question_data.get('answers', [])
            correct_answer_index = question_data.get('correct_answer', 0)
            
            # Extract question text in each language
            question_en = question_obj.get('en', '')
            question_el = question_obj.get('el', '')
            question_de = question_obj.get('de', '')
            
            # Check if question already exists (same category, same English text)
            existing = db.execute_one(
                "SELECT id FROM questions WHERE category = ? AND question_en = ?",
                (category, question_en)
            )
            
            if existing:
                print(f"  ⚠️  Skipping duplicate: {question_en[:50]}...")
                skipped += 1
                continue
            
            # Convert answers to JSON string
            answers_json = json.dumps(answers, ensure_ascii=False)
            
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
        
        print(f"  ✅ Inserted {category_count} questions")
        if skipped > 0:
            print(f"  ⚠️  Skipped {skipped} duplicate questions")
    
    print(f"\n✅ Import complete!")
    print(f"   Total questions inserted: {total_inserted}")
    if skipped > 0:
        print(f"   Duplicates skipped: {skipped}")
    
    # Verify import
    print("\n📊 Verification by category:")
    for category in questions_data.keys():
        count = db.execute_one(
            "SELECT COUNT(*) as count FROM questions WHERE category = ?",
            (category,)
        )
        print(f"   {category}: {count['count']} questions")


if __name__ == '__main__':
    # Path to the questions_for_review.json file (in the parent directory of scripts/)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    material_dir = os.path.dirname(script_dir)
    questions_file = os.path.join(material_dir, 'questions_for_review.json')
    
    try:
        import_questions_from_json(questions_file)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

