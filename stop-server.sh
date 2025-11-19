#!/bin/bash
# Stop the Store Inventory Manager server on Linux

echo "Stopping Store Inventory Manager..."

# Try using the PID file first
if [ -f .server.pid ]; then
    PID=$(cat .server.pid)
    if ps -p $PID > /dev/null 2>&1; then
        kill $PID
        echo "✓ Server stopped (PID: $PID)"
        rm -f .server.pid
        exit 0
    fi
fi

# If PID file doesn't work, kill by process name
if pkill -f 'node server.js'; then
    echo "✓ Server stopped"
    rm -f .server.pid
else
    echo "✗ No server process found"
    exit 1
fi
