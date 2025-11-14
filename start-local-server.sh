#!/bin/bash
# Simple local web server for testing analytics.html
# This avoids CORS issues when accessing files via file:// protocol

PORT=${1:-8000}

echo "Starting local web server on http://localhost:$PORT"
echo "Open http://localhost:$PORT/analytics.html in your browser"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Try Python 3 first, then Python 2, then Node.js http-server
if command -v python3 &> /dev/null; then
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer $PORT
elif command -v npx &> /dev/null; then
    npx http-server -p $PORT
else
    echo "Error: No suitable web server found."
    echo "Please install Python 3, Python 2, or Node.js"
    exit 1
fi

