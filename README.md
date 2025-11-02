# Football Edu Game

An educational football game web application for children aged 7-8 years old. The game combines educational questions with football gameplay mechanics, making learning fun and engaging.

## 🎮 Features

- **5v5 Mini Soccer**: Play with 4 outfield players + 1 goalkeeper per team
- **Educational Questions**: Answer math and language questions to succeed in game actions
- **Multiple Languages**: Support for English, Greek, and German
- **Multiple Teams**: Choose from 9 international teams
- **Action-Based Gameplay**: Pass, Dribble, Shoot, and Tackle with probability-based outcomes
- **Mobile-Friendly**: Responsive design optimized for touch devices

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download Node.js](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download Python](https://www.python.org/downloads/)
- **npm** (comes with Node.js)
- **pip** (comes with Python)

## 🚀 Quick Start

### Option 1: Using the Start Script (Recommended)

The easiest way to get started is using the provided start script:

```bash
# Make the script executable (if needed)
chmod +x start.sh

# Run the start script
./start.sh
```

This script will:
- Install frontend dependencies (if needed)
- Create Python virtual environment (if needed)
- Install backend dependencies
- Start the frontend development server at `http://localhost:3000`
- Start the backend API server at `http://localhost:8000`

Press `Ctrl+C` to stop all servers.

### Option 2: Manual Setup

#### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

#### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python3 -m venv venv
```

3. Activate the virtual environment:
   - **macOS/Linux**:
     ```bash
     source venv/bin/activate
     ```
   - **Windows**:
     ```bash
     venv\Scripts\activate
     ```

4. Install Python dependencies:
```bash
pip install -r requirements.txt
```

5. Initialize the database:
The database will be automatically created on first run. If you need to reset it:
```bash
python3 -c "from database.db import init_database; init_database()"
```

6. Start the Flask server:
```bash
python3 app.py
```

The backend API will be available at `http://localhost:8000`

## 📦 Project Structure

```
.
├── backend/              # Python Flask backend
│   ├── app.py           # Main Flask application
│   ├── config/          # Configuration files
│   │   ├── game_config.json
│   │   ├── questions.json
│   │   └── translations.json
│   ├── database/        # Database models and utilities
│   │   ├── db.py
│   │   ├── schema.sql
│   │   └── football_edu.db
│   ├── models/          # Data models
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic services
│   ├── tests/           # Backend tests
│   └── requirements.txt # Python dependencies
├── frontend/            # Vue.js 3 frontend
│   ├── src/
│   │   ├── components/  # Vue components
│   │   ├── views/       # Page views
│   │   ├── services/    # API and game logic services
│   │   ├── store/       # Pinia state management
│   │   └── utils/       # Utility functions
│   ├── public/          # Static assets
│   ├── package.json     # Node.js dependencies
│   └── vite.config.js   # Vite configuration
├── Game Design/         # Design documents
├── scripts/             # Utility scripts
├── testing/             # Integration tests
├── start.sh             # Quick start script
└── README.md            # This file
```

## 🧪 Testing

### Running All Tests

Run all tests (frontend + backend) with a single command:

```bash
./run_tests.sh
```

### Frontend Tests

```bash
cd frontend
npm test              # Run tests in watch mode
npm run test:ui       # Run tests with UI
npm run test:coverage # Run tests with coverage report
```

### Backend Tests

```bash
cd backend
# Activate virtual environment first
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate     # Windows

# Run tests
pytest                # Run all tests
pytest -v             # Verbose output
pytest --cov=.        # With coverage
pytest -m unit        # Run only unit tests
pytest -m integration # Run only integration tests
```

### Integration Tests

```bash
node testing/test_game_actions.js    # Game action flow tests
node testing/test_integration.js     # Complete game flow tests
```

For more details, see `testing/README.md`.

## 📚 Documentation

- **Game Design**: `Game Design/gameDesign.txt` - Complete game design specifications
- **Original Requirements**: `Game Design/prompts.txt` - Initial requirements and prompts
- **Backend README**: `backend/README.md` - Backend-specific documentation
- **Frontend README**: `frontend/README.md` - Frontend-specific documentation

## 🔧 Configuration

Game probabilities and settings can be configured in `backend/config/game_config.json`:

```json
{
  "probabilities": {
    "player": {
      "pass": 0.80,
      "dribble": 0.60,
      "shoot": 0.50,
      "tackle": 0.75
    },
    "goalkeeper_save": 0.50
  }
}
```

Language translations are stored in `backend/config/translations.json` and `frontend/public/translations.json`.

## 🌐 API Endpoints

### Game Endpoints
- `GET /api/game/state` - Get current game state
- `POST /api/game/start` - Start a new game
- `POST /api/game/action` - Perform a game action (pass, dribble, shoot, tackle)
- `POST /api/game/reset` - Reset the game

### Question Endpoints
- `GET /api/questions/categories` - Get available question categories
- `GET /api/questions/random?category=<category>&language=<lang>` - Get a random question

### Configuration Endpoints
- `GET /api/config` - Get game configuration
- `GET /api/health` - Health check endpoint

## 🛠️ Development

### Backend Development

The backend uses Flask with SQLite for data storage. Key components:

- **Models**: Data models in `backend/models/`
- **Routes**: API endpoints in `backend/routes/`
- **Services**: Business logic in `backend/services/`
- **Database**: SQLite database with schema in `backend/database/schema.sql`

### Frontend Development

The frontend uses Vue.js 3 with Vite. Key components:

- **Components**: Reusable Vue components in `frontend/src/components/`
- **Views**: Page views in `frontend/src/views/`
- **Store**: Pinia stores for state management in `frontend/src/store/`
- **Services**: API and game logic services in `frontend/src/services/`

## 📝 Requirements

### Python Dependencies

See `backend/requirements.txt`:
- Flask >= 2.0.0
- Flask-CORS >= 4.0.0
- pytest >= 7.4.0 (for testing)
- pytest-cov >= 4.1.0 (for test coverage)
- pytest-mock >= 3.12.0 (for mocking in tests)

### Node.js Dependencies

See `frontend/package.json`:
- Vue.js 3.4.0+
- Pinia 2.1.7+ (state management)
- Vite 5.0.0+ (build tool)
- Vitest 1.0.0+ (testing framework)

## 🐛 Troubleshooting

### Port Already in Use

If port 3000 or 8000 is already in use:

**Frontend (port 3000)**:
```bash
# Kill process on port 3000 (macOS/Linux)
lsof -ti:3000 | xargs kill -9

# Or change port in vite.config.js
```

**Backend (port 8000)**:
```bash
# Kill process on port 8000 (macOS/Linux)
lsof -ti:8000 | xargs kill -9

# Or change port in backend/app.py
```

### Database Issues

If you encounter database errors:

```bash
cd backend
# Remove existing database
rm database/football_edu.db

# Reinitialize database
python3 -c "from database.db import init_database; init_database()"
```

### Virtual Environment Issues

If Python packages aren't found:

```bash
cd backend
# Ensure virtual environment is activated
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

## 📄 License

This project is for educational purposes.

## 👥 Contributing

When contributing to this project:

1. Follow the game design document in `Game Design/gameDesign.txt`
2. Maintain code style and conventions
3. Write tests for new features
4. Update documentation as needed

## 🙏 Acknowledgments

- Design documents and requirements are located in `Game Design/`
- Graphics assets are stored in `frontend/public/assets/`
