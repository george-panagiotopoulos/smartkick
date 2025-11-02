# Database Setup

## Overview

The Football Edu Game uses SQLite database to store questions. Questions are organized by categories (e.g., `math_1`, `math_2`, `geography_1`, etc.).

## Database Schema

### Questions Table

The `questions` table stores all questions with multilingual support:

- `id`: Primary key (auto-increment)
- `category`: Question category (e.g., 'math_1', 'math_2', 'geography_1')
- `question_en`: Question text in English
- `question_el`: Question text in Greek (optional)
- `question_de`: Question text in German (optional)
- `answers`: JSON array of answer strings
- `correct_answer_index`: Index of correct answer in answers array (0-based)
- `created_at`: Timestamp when question was created
- `updated_at`: Timestamp when question was last updated

### Indexes

- `idx_questions_category`: Index on category for faster category lookups
- `idx_questions_category_id`: Composite index for faster random selection

## Initialization

To initialize the database schema:

```python
from database.db import init_database
init_database()
```

Or run the migration script (which also loads questions from JSON):

```bash
python3 database/migrate_questions.py
```

## Migration from JSON

The `migrate_questions.py` script loads questions from `config/questions.json` into the database:

```bash
cd backend
python3 database/migrate_questions.py
```

This script will:
1. Initialize the database schema if it doesn't exist
2. Load questions from JSON file
3. Insert questions into the database
4. Verify the migration

## Adding New Questions

### Method 1: Add to JSON and Migrate

1. Add questions to `config/questions.json`
2. Run migration script: `python3 database/migrate_questions.py`

### Method 2: Direct Database Insert

```python
from database.db import get_db
import json

db = get_db()
answers = json.dumps(["Option 1", "Option 2", "Option 3", "Option 4"])

db.execute_update(
    """
    INSERT INTO questions 
    (category, question_en, question_el, question_de, answers, correct_answer_index)
    VALUES (?, ?, ?, ?, ?, ?)
    """,
    ("math_1", "English question", "Greek question", "German question", answers, 0)
)
```

## Database Location

The database file is located at: `backend/database/football_edu.db`

## Usage in Code

```python
from services.question_service import get_question_service

service = get_question_service()

# Get random question
question = service.get_random_question('math_1', language='en')

# Get categories
categories = service.get_categories()

# Get question count
count = service.get_question_count('math_1')
```

