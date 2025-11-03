#!/usr/bin/env python3
"""
Import riddles from the edu-game-v2 repository into the database.
"""
import sys
import os
import re
import json

# Add backend directory to path for database imports
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
backend_dir = os.path.join(project_root, 'backend')
sys.path.insert(0, backend_dir)

from database.db import get_db, init_database

# Geography translations (capital cities and countries)
GEOGRAPHY_TRANSLATIONS = {
    # Questions
    "Ποια είναι η πρωτεύουσα των ΗΠΑ;": {
        "en": "What is the capital of the USA?",
        "de": "Was ist die Hauptstadt der USA?"
    },
    "Ποια είναι η πρωτεύουσα του Μεξικού;": {
        "en": "What is the capital of Mexico?",
        "de": "Was ist die Hauptstadt von Mexiko?"
    },
    "Ποια είναι η πρωτεύουσα της Κίνας;": {
        "en": "What is the capital of China?",
        "de": "Was ist die Hauptstadt von China?"
    },
    "Ποια είναι η πρωτεύουσα της Ινδίας;": {
        "en": "What is the capital of India?",
        "de": "Was ist die Hauptstadt von Indien?"
    },
    "Ποια είναι η πρωτεύουσα της Ρωσίας;": {
        "en": "What is the capital of Russia?",
        "de": "Was ist die Hauptstadt von Russland?"
    },
    "Ποια είναι η πρωτεύουσα του Καζακστάν;": {
        "en": "What is the capital of Kazakhstan?",
        "de": "Was ist die Hauptstadt von Kasachstan?"
    },
    "Ποια είναι η πρωτεύουσα της Αγγλίας;": {
        "en": "What is the capital of England?",
        "de": "Was ist die Hauptstadt von England?"
    },
    "Ποια είναι η πρωτεύουσα της Γαλλίας;": {
        "en": "What is the capital of France?",
        "de": "Was ist die Hauptstadt von Frankreich?"
    },
    "Ποια είναι η πρωτεύουσα της Ισπανίας;": {
        "en": "What is the capital of Spain?",
        "de": "Was ist die Hauptstadt von Spanien?"
    },
    "Ποια είναι η πρωτεύουσα της Ιταλίας;": {
        "en": "What is the capital of Italy?",
        "de": "Was ist die Hauptstadt von Italien?"
    },
    "Ποια είναι η πρωτεύουσα της Ελλάδας;": {
        "en": "What is the capital of Greece?",
        "de": "Was ist die Hauptstadt von Griechenland?"
    },
    "Ποια είναι η πρωτεύουσα της Ρουμανίας;": {
        "en": "What is the capital of Romania?",
        "de": "Was ist die Hauptstadt von Rumänien?"
    },
    "Ποια είναι η πρωτεύουσα της Βουλγαρίας;": {
        "en": "What is the capital of Bulgaria?",
        "de": "Was ist die Hauptstadt von Bulgarien?"
    },
    "Ποια είναι η πρωτεύουσα της Γερμανίας;": {
        "en": "What is the capital of Germany?",
        "de": "Was ist die Hauptstadt von Deutschland?"
    },
    "Ποια είναι η πρωτεύουσα της Ελβετίας;": {
        "en": "What is the capital of Switzerland?",
        "de": "Was ist die Hauptstadt der Schweiz?"
    },
    "Ποια είναι η πρωτεύουσα της Αυστρίας;": {
        "en": "What is the capital of Austria?",
        "de": "Was ist die Hauptstadt von Österreich?"
    },
    "Ποια χώρα είναι δίπλα στη Γαλλία;": {
        "en": "Which country is next to France?",
        "de": "Welches Land liegt neben Frankreich?"
    },
    "Ποια χώρα είναι δίπλα στη Βραζιλία;": {
        "en": "Which country is next to Brazil?",
        "de": "Welches Land liegt neben Brasilien?"
    },
    "Ποια χώρα είναι δίπλα στη Νέα Ζηλανδία;": {
        "en": "Which country is next to New Zealand?",
        "de": "Welches Land liegt neben Neuseeland?"
    },
    "Ποια χώρα είναι δίπλα στη Νότια Κορέα;": {
        "en": "Which country is next to South Korea?",
        "de": "Welches Land liegt neben Südkorea?"
    },
    "Ποια χώρα είναι δίπλα στις ΗΠΑ;": {
        "en": "Which country is next to the USA?",
        "de": "Welches Land liegt neben den USA?"
    },
    "Ποια χώρα είναι δίπλα στη Γερμανία;": {
        "en": "Which country is next to Germany?",
        "de": "Welches Land liegt neben Deutschland?"
    },
    "Ποια χώρα είναι δίπλα στην Ιταλία;": {
        "en": "Which country is next to Italy?",
        "de": "Welches Land liegt neben Italien?"
    },
    "Ποια χώρα είναι δίπλα στην Ισπανία;": {
        "en": "Which country is next to Spain?",
        "de": "Welches Land liegt neben Spanien?"
    },
    "Ποια χώρα είναι δίπλα στην Ελλάδα;": {
        "en": "Which country is next to Greece?",
        "de": "Welches Land liegt neben Griechenland?"
    },
}

# Answer translations for geography
GEOGRAPHY_ANSWER_TRANSLATIONS = {
    "Ουάσιγκτον": {"en": "Washington", "de": "Washington"},
    "Πόλη του Μεξικού": {"en": "Mexico City", "de": "Mexiko-Stadt"},
    "Πεκίνο": {"en": "Beijing", "de": "Peking"},
    "Νέο Δελχί": {"en": "New Delhi", "de": "Neu-Delhi"},
    "Μόσχα": {"en": "Moscow", "de": "Moskau"},
    "Νουρ-Σουλτάν": {"en": "Nur-Sultan", "de": "Nur-Sultan"},
    "Λονδίνο": {"en": "London", "de": "London"},
    "Παρίσι": {"en": "Paris", "de": "Paris"},
    "Μαδρίτη": {"en": "Madrid", "de": "Madrid"},
    "Ρώμη": {"en": "Rome", "de": "Rom"},
    "Αθήνα": {"en": "Athens", "de": "Athen"},
    "Βουκουρέστι": {"en": "Bucharest", "de": "Bukarest"},
    "Σόφια": {"en": "Sofia", "de": "Sofia"},
    "Βερολίνο": {"en": "Berlin", "de": "Berlin"},
    "Βέρνη": {"en": "Bern", "de": "Bern"},
    "Βιέννη": {"en": "Vienna", "de": "Wien"},
    "Ισπανία": {"en": "Spain", "de": "Spanien"},
    "Αργεντινή": {"en": "Argentina", "de": "Argentinien"},
    "Αυστραλία": {"en": "Australia", "de": "Australien"},
    "Βόρεια Κορέα": {"en": "North Korea", "de": "Nordkorea"},
    "Κίνα": {"en": "China", "de": "China"},
    "Καναδάς": {"en": "Canada", "de": "Kanada"},
    "Γαλλία": {"en": "France", "de": "Frankreich"},
    "Πορτογαλία": {"en": "Portugal", "de": "Portugal"},
    "Τουρκία": {"en": "Turkey", "de": "Türkei"},
    # Additional options
    "Νέα Υόρκη": {"en": "New York", "de": "New York"},
    "Λος Άντζελες": {"en": "Los Angeles", "de": "Los Angeles"},
    "Γκουανταλαχάρα": {"en": "Guadalajara", "de": "Guadalajara"},
    "Μοντερέι": {"en": "Monterrey", "de": "Monterrey"},
    "Σαγκάη": {"en": "Shanghai", "de": "Shanghai"},
    "Χονγκ Κονγκ": {"en": "Hong Kong", "de": "Hongkong"},
    "Μουμπάι": {"en": "Mumbai", "de": "Mumbai"},
    "Καλκούτα": {"en": "Kolkata", "de": "Kolkata"},
    "Αλμάτι": {"en": "Almaty", "de": "Almaty"},
    "Αγία Πετρούπολη": {"en": "Saint Petersburg", "de": "Sankt Petersburg"},
    "Νοβοσιμπίρσκ": {"en": "Novosibirsk", "de": "Nowosibirsk"},
    "Καραγκάντα": {"en": "Karaganda", "de": "Karaganda"},
    "Σιμκέντ": {"en": "Shymkent", "de": "Schymkent"},
    "Μάντσεστερ": {"en": "Manchester", "de": "Manchester"},
    "Λίβερπουλ": {"en": "Liverpool", "de": "Liverpool"},
    "Μπέρμιγχαμ": {"en": "Birmingham", "de": "Birmingham"},
    "Λυών": {"en": "Lyon", "de": "Lyon"},
    "Μασσαλία": {"en": "Marseille", "de": "Marseille"},
    "Τουλούζη": {"en": "Toulouse", "de": "Toulouse"},
    "Βαρκελώνη": {"en": "Barcelona", "de": "Barcelona"},
    "Σεβίλλη": {"en": "Seville", "de": "Sevilla"},
    "Βαλένθια": {"en": "Valencia", "de": "Valencia"},
    "Μιλάνο": {"en": "Milan", "de": "Mailand"},
    "Νάπολη": {"en": "Naples", "de": "Neapel"},
    "Φλωρεντία": {"en": "Florence", "de": "Florenz"},
    "Θεσσαλονίκη": {"en": "Thessaloniki", "de": "Thessaloniki"},
    "Πάτρα": {"en": "Patras", "de": "Patras"},
    "Ηράκλειο": {"en": "Heraklion", "de": "Heraklion"},
    "Κλουζ-Ναπόκα": {"en": "Cluj-Napoca", "de": "Cluj-Napoca"},
    "Τιμισοάρα": {"en": "Timisoara", "de": "Timisoara"},
    "Ιάσιο": {"en": "Iasi", "de": "Iasi"},
    "Πλόβντιβ": {"en": "Plovdiv", "de": "Plowdiw"},
    "Βάρνα": {"en": "Varna", "de": "Warna"},
    "Μπουργκάς": {"en": "Burgas", "de": "Burgas"},
    "Μόναχο": {"en": "Munich", "de": "München"},
    "Αμβούργο": {"en": "Hamburg", "de": "Hamburg"},
    "Φρανκφούρτη": {"en": "Frankfurt", "de": "Frankfurt"},
    "Ζυρίχη": {"en": "Zurich", "de": "Zürich"},
    "Γενεύη": {"en": "Geneva", "de": "Genf"},
    "Βασιλεία": {"en": "Basel", "de": "Basel"},
    "Γκρατς": {"en": "Graz", "de": "Graz"},
    "Λιντς": {"en": "Linz", "de": "Linz"},
    "Σάλτσμπουργκ": {"en": "Salzburg", "de": "Salzburg"},
}


def parse_js_riddles(file_path):
    """Parse JavaScript riddles file and extract riddles."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    riddles = []
    
    # Pattern to match riddle objects
    # Look for patterns like: { question: "...", options: shuffleArray([...]), answer: "...", category: "..." }
    # We'll match each field separately
    
    # Split content by riddle objects (they start with {)
    # Find all question: "..." patterns first
    question_pattern = r'question:\s*"([^"]+)"'
    answer_pattern = r'answer:\s*"([^"]+)"'
    
    # Find all question matches with their positions
    question_matches = list(re.finditer(question_pattern, content))
    
    for q_match in question_matches:
        start_pos = q_match.start()
        # Find the opening brace before this question
        brace_pos = content.rfind('{', 0, start_pos)
        if brace_pos == -1:
            continue
        
        # Find the closing brace after this question
        # We need to find the matching brace
        brace_count = 0
        end_pos = start_pos
        for i in range(brace_pos, len(content)):
            if content[i] == '{':
                brace_count += 1
            elif content[i] == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_pos = i + 1
                    break
        
        riddle_block = content[brace_pos:end_pos]
        
        # Extract question, answer, and options
        question_match = re.search(question_pattern, riddle_block)
        answer_match = re.search(answer_pattern, riddle_block)
        options_match = re.search(r'options:\s*shuffleArray\(\[([^\]]+)\]\)', riddle_block)
        
        if question_match and answer_match and options_match:
            question = question_match.group(1)
            answer = answer_match.group(1)
            options_str = options_match.group(1)
            
            # Parse options
            options = []
            # Split by comma, but be careful with nested quotes
            current_opt = ""
            in_quotes = False
            for char in options_str:
                if char == '"' and (not current_opt or current_opt[-1] != '\\'):
                    in_quotes = not in_quotes
                    if not in_quotes:
                        options.append(current_opt)
                        current_opt = ""
                elif in_quotes:
                    current_opt += char
            
            # Clean up options
            options = [opt.strip() for opt in options if opt.strip()]
            
            if len(options) >= 4:
                riddles.append({
                    'question': question,
                    'options': options,
                    'answer': answer
                })
    
    return riddles


def insert_riddles(db, category, riddles, question_en=None, question_el=None, question_de=None):
    """Insert riddles into database."""
    inserted = 0
    
    for riddle in riddles:
        question_text = riddle['question']
        options = riddle['options']
        answer = riddle['answer']
        
        # Find correct answer index
        try:
            correct_index = options.index(answer)
        except ValueError:
            print(f"Warning: Answer '{answer}' not found in options for question: {question_text[:50]}...")
            continue
        
        # Use provided translations or defaults
        q_en = question_en if question_en else question_text
        q_el = question_el if question_el else question_text
        q_de = question_de if question_de else question_text
        
        # Convert options to JSON
        options_json = json.dumps(options)
        
        query = """
            INSERT INTO questions 
            (category, question_en, question_el, question_de, answers, correct_answer_index)
            VALUES (?, ?, ?, ?, ?, ?)
        """
        
        try:
            db.execute_update(query, (category, q_en, q_el, q_de, options_json, correct_index))
            inserted += 1
        except Exception as e:
            print(f"Error inserting riddle: {e}")
            print(f"  Question: {question_text[:50]}...")
    
    return inserted


def main():
    repo_path = '/tmp/edu-game-v2/src/riddles'
    
    if not os.path.exists(repo_path):
        print(f"Error: Repository path not found: {repo_path}")
        print("Please clone the repository first:")
        print("  git clone https://github.com/george-panagiotopoulos/edu-game-v2.git /tmp/edu-game-v2")
        return
    
    # Initialize database
    print("Initializing database...")
    init_database()
    db = get_db()
    
    total_inserted = 0
    
    # 1. English riddles -> english_1 (only English questions, not Greek ones)
    print("\n1. Processing English riddles...")
    english_file = os.path.join(repo_path, 'englishRiddles.js')
    if os.path.exists(english_file):
        riddles = parse_js_riddles(english_file)
        # Filter for English questions (not starting with Greek characters)
        english_riddles = [r for r in riddles if not r['question'].startswith('Π')]
        inserted = insert_riddles(db, 'english_1', english_riddles)
        print(f"   Inserted {inserted} English riddles")
        total_inserted += inserted
    
    # 2. German riddles -> german_1
    print("\n2. Processing German riddles...")
    german_file = os.path.join(repo_path, 'germanRiddles.js')
    if os.path.exists(german_file):
        riddles = parse_js_riddles(german_file)
        inserted = insert_riddles(db, 'german_1', riddles)
        print(f"   Inserted {inserted} German riddles")
        total_inserted += inserted
    
    # 3. Spelling riddles -> greek_1
    print("\n3. Processing Spelling riddles (converting to greek_1)...")
    spelling_file = os.path.join(repo_path, 'spellingRiddles.js')
    if os.path.exists(spelling_file):
        riddles = parse_js_riddles(spelling_file)
        inserted = insert_riddles(db, 'greek_1', riddles)
        print(f"   Inserted {inserted} Greek spelling riddles")
        total_inserted += inserted
    
    # 4. Geography riddles -> geography_1 (with translations)
    print("\n4. Processing Geography riddles (with translations)...")
    geography_file = os.path.join(repo_path, 'geographyRiddles.js')
    if os.path.exists(geography_file):
        riddles = parse_js_riddles(geography_file)
        
        for riddle in riddles:
            question_el = riddle['question']
            options = riddle['options']
            answer = riddle['answer']
            
            # Get translations
            question_en = GEOGRAPHY_TRANSLATIONS.get(question_el, {}).get('en', '')
            question_de = GEOGRAPHY_TRANSLATIONS.get(question_el, {}).get('de', '')
            
            if not question_en or not question_de:
                print(f"Warning: No translation found for: {question_el[:50]}...")
                continue
            
            # Translate options
            translated_options_en = []
            translated_options_de = []
            translated_answer_en = None
            translated_answer_de = None
            
            for opt in options:
                trans_en = GEOGRAPHY_ANSWER_TRANSLATIONS.get(opt, {}).get('en', opt)
                trans_de = GEOGRAPHY_ANSWER_TRANSLATIONS.get(opt, {}).get('de', opt)
                translated_options_en.append(trans_en)
                translated_options_de.append(trans_de)
            
            translated_answer_en = GEOGRAPHY_ANSWER_TRANSLATIONS.get(answer, {}).get('en', answer)
            translated_answer_de = GEOGRAPHY_ANSWER_TRANSLATIONS.get(answer, {}).get('de', answer)
            
            # Find correct indices
            try:
                correct_index_el = options.index(answer)
                correct_index_en = translated_options_en.index(translated_answer_en)
                correct_index_de = translated_options_de.index(translated_answer_de)
            except ValueError as e:
                print(f"Warning: Could not find correct answer index: {e}")
                continue
            
            # Insert for each language - all questions have all 3 languages
            options_json_en = json.dumps(translated_options_en)
            options_json_el = json.dumps(options)
            options_json_de = json.dumps(translated_options_de)
            
            query = """
                INSERT INTO questions 
                (category, question_en, question_el, question_de, answers, correct_answer_index)
                VALUES (?, ?, ?, ?, ?, ?)
            """
            
            # Insert with all languages set
            try:
                db.execute_update(query, ('geography_1', question_en, question_el, question_de, 
                                         options_json_en, correct_index_en))
                total_inserted += 1
            except Exception as e:
                print(f"Error inserting geography riddle: {e}")
    
    print(f"\n✅ Import complete! Total riddles inserted: {total_inserted}")
    
    # Verify
    print("\nVerifying import...")
    for category in ['english_1', 'german_1', 'greek_1', 'geography_1']:
        count = db.execute_one(
            "SELECT COUNT(*) as count FROM questions WHERE category = ?",
            (category,)
        )
        print(f"  {category}: {count['count']} questions")


if __name__ == '__main__':
    main()
