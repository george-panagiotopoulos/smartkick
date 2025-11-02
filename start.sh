#!/bin/bash

# SmartKick - Start Script
# Starts the frontend development server and backend API (if available)

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting SmartKick...${NC}"

# Check if we're in the project root
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Function to handle cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down servers...${NC}"
    kill $FRONTEND_PID 2>/dev/null || true
    kill $BACKEND_PID 2>/dev/null || true
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup SIGINT SIGTERM

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Error: npm is not installed. Please install npm first.${NC}"
    exit 1
fi

# Frontend setup and start
echo -e "${YELLOW}📦 Setting up frontend...${NC}"
cd frontend

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📥 Installing frontend dependencies...${NC}"
    npm install
fi

# Start frontend dev server
echo -e "${GREEN}🎮 Starting frontend development server...${NC}"
npm run dev &
FRONTEND_PID=$!
cd ..

# Backend setup (if Python backend is ready)
if [ -f "backend/app.py" ] && [ -s "backend/app.py" ]; then
    echo -e "${YELLOW}🐍 Checking backend...${NC}"
    
    # Check if Python is installed
    if command -v python3 &> /dev/null; then
        cd backend
        
        # Check if virtual environment exists
        if [ ! -d "venv" ]; then
            echo -e "${YELLOW}📦 Creating Python virtual environment...${NC}"
            python3 -m venv venv
        fi
        
        # Activate virtual environment
        source venv/bin/activate
        
        # Install/update dependencies
        if [ -f "requirements.txt" ]; then
            echo -e "${YELLOW}📥 Installing backend dependencies...${NC}"
            pip install -q -r requirements.txt
        fi
        
        # Load questions from JSON into database
        if [ -f "database/migrate_questions.py" ] && [ -f "config/questions.json" ]; then
            echo -e "${YELLOW}📚 Loading questions into database...${NC}"
            python3 database/migrate_questions.py || echo -e "${YELLOW}⚠️  Warning: Question migration failed, continuing anyway...${NC}"
        fi
        
        # Check if Flask or FastAPI is configured
        if grep -q "Flask\|FastAPI" app.py 2>/dev/null; then
            echo -e "${GREEN}🔧 Starting backend API server...${NC}"
            # Determine if it's Flask or FastAPI
            if grep -q "Flask" app.py 2>/dev/null; then
                python3 app.py &
            elif grep -q "FastAPI\|uvicorn" app.py 2>/dev/null; then
                uvicorn app:app --reload --port 8000 &
            fi
            BACKEND_PID=$!
        else
            echo -e "${YELLOW}⚠️  Backend not yet configured. Skipping backend startup.${NC}"
        fi
        
        cd ..
    else
        echo -e "${YELLOW}⚠️  Python3 not found. Skipping backend startup.${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Backend not yet implemented. Starting frontend only.${NC}"
fi

echo -e "\n${GREEN}✅ Game started successfully!${NC}"
echo -e "${GREEN}🌐 Frontend: http://localhost:3000${NC}"
if [ ! -z "$BACKEND_PID" ]; then
    echo -e "${GREEN}🔧 Backend API: http://localhost:8000${NC}"
fi
echo -e "\n${YELLOW}Press Ctrl+C to stop all servers${NC}\n"

# Wait for both processes
wait

