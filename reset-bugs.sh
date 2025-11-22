#!/bin/bash

echo "🔄 Resetting bugs for demo..."
echo ""

# Copy buggy version back
echo "1️⃣  Restoring buggy tasks.ts..."
cp frontend/convex/tasks.buggy.ts frontend/convex/tasks.ts
echo "✅ Bugs restored!"
echo ""

# Clear Convex errors and fixes
echo "2️⃣  Clearing error and fix history..."
node agent/clear-history.js
echo "✅ History cleared!"
echo ""

echo "🎉 Ready to demo again!"
echo ""
echo "Now you can:"
echo "  1. Try to add a task → will fail (Bug #1)"
echo "  2. Try to toggle task → will fail (Bug #2)"
echo "  3. Try to delete task → will fail (Bug #3)"
echo ""
echo "Agent will fix them automatically! 🤖"
