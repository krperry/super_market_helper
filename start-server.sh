#!/bin/bash
# Start the Store Inventory Manager server on Linux
# Usage: ./start-server.sh [port]

PORT=${1:-3000}

echo "Starting Store Inventory Manager on port $PORT..."

# Start server with nohup to keep it running in background
nohup node server.js $PORT --no-browser > server.log 2>&1 &

# Get the PID
PID=$!

# Wait a moment for startup
sleep 2

# Check if it started successfully
if ps -p $PID > /dev/null; then
    echo "✓ Server started successfully!"
    echo "  Process ID: $PID"
    echo "  Port: $PORT"
    echo "  Log file: server.log"
    echo ""
    echo "To stop: pkill -f 'node server.js' or npm stop"
    echo "To view logs: tail -f server.log"
else
    echo "✗ Server failed to start. Check server.log for errors."
    exit 1
fi
