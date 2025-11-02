-- Database schema for Football Edu Game

-- Questions table
-- Stores questions with multilingual support using JSON columns
CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    question_en TEXT NOT NULL,
    question_el TEXT,
    question_de TEXT,
    answers TEXT NOT NULL,  -- JSON array of answer strings
    correct_answer_index INTEGER NOT NULL,  -- Index in answers array (0-based)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster category lookups
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);

-- Index for faster random selection within category
CREATE INDEX IF NOT EXISTS idx_questions_category_id ON questions(category, id);

-- Game states table (for future use)
CREATE TABLE IF NOT EXISTS game_states (
    id TEXT PRIMARY KEY,
    player_score INTEGER DEFAULT 0,
    opponent_score INTEGER DEFAULT 0,
    ball_possession TEXT DEFAULT 'player',
    defense_cleared INTEGER DEFAULT 0,
    current_action TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
