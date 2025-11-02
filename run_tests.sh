#!/bin/bash

# Test Runner Script for SmartKick
# Runs all tests for both frontend and backend

set -e

echo "=========================================="
echo "SmartKick - Test Suite"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Track test results
FRONTEND_PASSED=true
BACKEND_PASSED=true
INTEGRATION_PASSED=true

# Frontend Tests
echo -e "${BLUE}Running Frontend Tests...${NC}"
echo "----------------------------------------"
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

if npm test -- --run; then
    echo -e "${GREEN}✓ Frontend tests passed${NC}"
else
    echo -e "${RED}✗ Frontend tests failed${NC}"
    FRONTEND_PASSED=false
fi

cd ..

echo ""

# Backend Tests
echo -e "${BLUE}Running Backend Tests...${NC}"
echo "----------------------------------------"
cd backend

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null || true

if ! pip list | grep -q pytest; then
    echo "Installing backend dependencies..."
    pip install -r requirements.txt
fi

if pytest -v; then
    echo -e "${GREEN}✓ Backend tests passed${NC}"
else
    echo -e "${RED}✗ Backend tests failed${NC}"
    BACKEND_PASSED=false
fi

deactivate 2>/dev/null || true
cd ..

echo ""

# Integration Tests
echo -e "${BLUE}Running Integration Tests...${NC}"
echo "----------------------------------------"

if node testing/test_game_actions.js; then
    echo -e "${GREEN}✓ Game actions test passed${NC}"
else
    echo -e "${RED}✗ Game actions test failed${NC}"
    INTEGRATION_PASSED=false
fi

if node testing/test_integration.js; then
    echo -e "${GREEN}✓ Integration test passed${NC}"
else
    echo -e "${RED}✗ Integration test failed${NC}"
    INTEGRATION_PASSED=false
fi

echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="

if [ "$FRONTEND_PASSED" = true ] && [ "$BACKEND_PASSED" = true ] && [ "$INTEGRATION_PASSED" = true ]; then
    echo -e "${GREEN}All tests passed! ✓${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed ✗${NC}"
    [ "$FRONTEND_PASSED" = false ] && echo "  - Frontend tests failed"
    [ "$BACKEND_PASSED" = false ] && echo "  - Backend tests failed"
    [ "$INTEGRATION_PASSED" = false ] && echo "  - Integration tests failed"
    exit 1
fi

