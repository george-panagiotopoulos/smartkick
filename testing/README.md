# Testing Documentation

This directory contains tests for the Football Edu Game project.

## Test Structure

### Frontend Tests

Frontend tests are located in `frontend/src/test/` and use Vitest as the testing framework.

**Run frontend tests:**
```bash
cd frontend
npm install  # Install dependencies including test tools
npm test    # Run tests in watch mode
npm run test:ui  # Run tests with UI
npm run test:coverage  # Run tests with coverage report
```

**Test Files:**
- `gameStore.test.js` - Tests for Pinia game store (game state management)
- `gameLogic.test.js` - Tests for game logic utilities

### Backend Tests

Backend tests are located in `backend/tests/` and use pytest as the testing framework.

**Run backend tests:**
```bash
cd backend
pip install -r requirements.txt  # Install dependencies including pytest
pytest                    # Run all tests
pytest -v                # Verbose output
pytest --cov=.           # With coverage
pytest -m unit            # Run only unit tests
pytest -m integration    # Run only integration tests
```

**Test Files:**
- `test_config_service.py` - Tests for configuration service
- `test_question_service.py` - Tests for question service
- `test_game_service.py` - Tests for game service
- `test_integration.py` - Integration tests for complete game flow

### Integration Tests

**Game Actions Test (`test_game_actions.js`):**
```bash
node testing/test_game_actions.js
```

This script tests that the game can run through many actions without breaking or losing state consistency.

**Integration Test Suite (`test_integration.js`):**
```bash
node testing/test_integration.js
```

This script tests complete game flows and component interactions.

## Test Coverage Goals

- **Unit Tests**: Test individual functions and methods in isolation
- **Integration Tests**: Test complete workflows and component interactions
- **Game Flow Tests**: Test that game can run for extended periods without errors

## Running All Tests

From the project root:

```bash
# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && pytest

# Integration tests
node testing/test_game_actions.js
node testing/test_integration.js
```

## Writing New Tests

### Frontend Test Example

```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../store/gameStore'

describe('MyFeature', () => {
  it('should do something', () => {
    const store = useGameStore()
    // Test code
    expect(store.someValue).toBe(expected)
  })
})
```

### Backend Test Example

```python
import pytest

@pytest.mark.unit
def test_my_feature():
    # Test code
    assert result == expected
```

## Test Guidelines

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Clarity**: Test names should clearly describe what is being tested
3. **Coverage**: Aim for high code coverage, especially for critical game logic
4. **Speed**: Keep unit tests fast; use mocks for slow operations
5. **Maintainability**: Update tests when code changes

## Continuous Integration

Tests should pass before merging code. Consider setting up CI/CD to run tests automatically on commits and pull requests.

