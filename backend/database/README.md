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

Or run the migration scripts from the school_material folders:

```bash
cd backend
source venv/bin/activate
# Original questions (clears database first)
python3 ../school_material/original/migrate_questions.py
# Additional questions from 31Oct2025 (adds without clearing)
python3 ../school_material/31Oct2025/scripts/import_questions.py
```

## Migration from JSON

The migration scripts are now located in the `school_material/` folder:

- **Original questions**: `school_material/original/migrate_questions.py`
  - Loads questions from `school_material/original/questions.json`
  - **Clears the database first** - use only for fresh installs
  
- **Additional questions**: `school_material/31Oct2025/scripts/import_questions.py`
  - Loads questions from `school_material/31Oct2025/questions_for_review.json`
  - **Adds questions without clearing** - safe for adding new questions

### Running migrations manually

```bash
cd backend
source venv/bin/activate
python3 ../school_material/original/migrate_questions.py
python3 ../school_material/31Oct2025/scripts/import_questions.py
```

## Adding New Questions

### Method 1: Add to Existing Material Folder

1. Add questions to a JSON file in the appropriate `school_material/` folder
2. Run the import script for that folder (e.g., `school_material/31Oct2025/scripts/import_questions.py`)

### Method 2: Create New Material Folder

1. Create a new folder under `school_material/` (e.g., `school_material/2025-11-15/`)
2. Create a questions JSON file and import script
3. Update `start.sh` to run your new import script

### Method 3: Add to Original Questions

1. Add questions to `school_material/original/questions.json`
2. Run: `python3 ../school_material/original/migrate_questions.py`
   - **Warning**: This clears the database first!

### Method 4: Direct Database Insert

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

