# 31 October 2025 School Material

This folder contains questions and scripts based on school material from 31 October 2025.

## Contents

- **PDF files**: Original school material PDFs (Β' ΤΑΞΗ - 2nd Grade)
- **questions_for_review.json**: 30 questions created from the school material
- **scripts/**: Utility scripts for processing this material
  - **import_questions.py**: Script to import questions into the database (adds without clearing)
  - **extract_pdf_content.py**: Script to extract text from PDF files

## Question Categories

The questions from this material are organized into:
- **greek_2**: 10 questions - Greek language (spelling, grammar, vocabulary)
- **math_2**: 10 questions - Mathematics (addition, subtraction up to 100)
- **german_2**: 5 questions - German language (family members vocabulary)
- **english_2**: 3 questions - English language (Halloween vocabulary)
- **environment_1**: 2 questions - Environmental studies (basic concepts)

## Usage

### Import questions into database

```bash
cd backend
source venv/bin/activate
python3 ../school_material/31Oct2025/scripts/import_questions.py
```

This will:
1. Check for duplicate questions (same category + English text)
2. Add new questions to the database
3. Skip any duplicates
4. **NOT** clear existing questions

### Extract PDF content

To extract text from PDF files for analysis:

```bash
cd backend
source venv/bin/activate
python3 ../school_material/31Oct2025/scripts/extract_pdf_content.py
```

This creates `extracted_content.txt` with text from all PDFs in this folder.

## School Material Source

The PDFs contain homework assignments (καθήκοντα) for 2nd grade (Β' ΤΑΞΗ) covering:
- Greek Language (ΕΛΛΗΝΙΚΑ)
- Mathematics (ΜΑΘΗΜΑΤΙΚΑ)
- Environmental Studies (ΜΕΛΕΤΗ ΠΕΡΙΒΑΛΛΟΝΤΟΣ)
- German (DEUTSCH)
- English (ENGLISH)

