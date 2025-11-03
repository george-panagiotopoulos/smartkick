# Original Questions and Migration Scripts

This folder contains the original questions database and migration scripts for the Football Edu game.

## Files

- **questions.json**: Original questions database in JSON format
- **migrate_questions.py**: Script to migrate questions from JSON to the SQLite database (clears existing questions)
- **import_riddles.py**: Script to import riddles from external sources

## Usage

### Running the migration manually

```bash
cd backend
source venv/bin/activate
python3 ../school_material/original/migrate_questions.py
```

This will:
1. Clear all existing questions in the database
2. Load all questions from `questions.json`
3. Verify the migration was successful

**Note**: This migration clears the database first! Use only for fresh installations or when you want to reset to the original question set.

## Question Format

Questions follow this structure:
```json
{
  "category_name": [
    {
      "question": {
        "en": "English question",
        "el": "Greek question",
        "de": "German question"
      },
      "answers": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correct_answer": 0
    }
  ]
}
```

## Categories

The original questions include:
- english_1
- geography_1
- german_1
- greek_1
- math_1, math_2, math_3

