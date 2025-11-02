#!/bin/bash

# SmartKick - Stop Script
# Stops the frontend development server and backend API

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 Stopping SmartKick...${NC}"

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    local process_name=$2
    
    # Find processes using the port
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    
    if [ -z "$pids" ]; then
        echo -e "${YELLOW}  ℹ️  No $process_name process found on port $port${NC}"
    else
        for pid in $pids; do
            echo -e "${YELLOW}  🔪 Killing $process_name (PID: $pid) on port $port...${NC}"
            kill -9 $pid 2>/dev/null || true
        done
        echo -e "${GREEN}  ✅ $process_name stopped${NC}"
    fi
}

# Stop frontend (usually on port 3000 or 5173 for Vite)
echo -e "${YELLOW}🎮 Stopping frontend...${NC}"
kill_port 3000 "Frontend"
kill_port 5173 "Frontend (Vite)"

# Stop backend (usually on port 8000)
echo -e "${YELLOW}🐍 Stopping backend...${NC}"
kill_port 8000 "Backend API"

# Also kill any Python app.py processes
echo -e "${YELLOW}🐍 Killing Python backend processes...${NC}"
PYTHON_PIDS=$(pgrep -f "python.*app.py" 2>/dev/null || true)
if [ -z "$PYTHON_PIDS" ]; then
    echo -e "${YELLOW}  ℹ️  No Python app.py processes found${NC}"
else
    for pid in $PYTHON_PIDS; do
        echo -e "${YELLOW}  🔪 Killing Python backend process (PID: $pid)...${NC}"
        kill -9 $pid 2>/dev/null || true
    done
    echo -e "${GREEN}  ✅ Python backend processes stopped${NC}"
fi

# Also kill any Node.js dev server processes
echo -e "${YELLOW}📦 Killing Node.js dev server processes...${NC}"
NODE_PIDS=$(pgrep -f "node.*dev\|vite" 2>/dev/null || true)
if [ -z "$NODE_PIDS" ]; then
    echo -e "${YELLOW}  ℹ️  No Node.js dev server processes found${NC}"
else
    for pid in $NODE_PIDS; do
        echo -e "${YELLOW}  🔪 Killing Node.js process (PID: $pid)...${NC}"
        kill -9 $pid 2>/dev/null || true
    done
    echo -e "${GREEN}  ✅ Node.js processes stopped${NC}"
fi

echo -e "\n${GREEN}✅ All SmartKick processes stopped${NC}"

