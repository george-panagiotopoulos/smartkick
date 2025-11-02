#!/bin/bash

# Run 20 test sequences to verify everything works

echo "=========================================="
echo "Running 20 Test Sequences"
echo "=========================================="
echo ""

PASSED=0
FAILED=0

for i in {1..20}; do
    echo -n "Test sequence $i/20: "
    
    if node testing/test_game_actions.js > /dev/null 2>&1; then
        echo "✅ PASSED"
        ((PASSED++))
    else
        echo "❌ FAILED"
        ((FAILED++))
    fi
done

echo ""
echo "=========================================="
echo "Results Summary"
echo "=========================================="
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ All 20 test sequences passed!"
    exit 0
else
    echo "❌ Some test sequences failed"
    exit 1
fi

