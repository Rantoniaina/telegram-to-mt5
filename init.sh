#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Initializing project...${NC}"

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo "Backend directory not found!"
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    echo "Frontend directory not found!"
    exit 1
fi

# Start backend
echo -e "${GREEN}Setting up backend...${NC}"
cd backend

# Check if virtual environment exists, if not create it
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
source venv/bin/activate
pip install -r requirements.txt

# Start backend server in background
echo -e "${GREEN}Starting backend server...${NC}"
python run.py &
BACKEND_PID=$!

# Go back to root directory
cd ..

# Start frontend
echo -e "${GREEN}Setting up frontend...${NC}"
cd frontend

# Install dependencies
echo "Installing frontend dependencies..."
npm install

# Start frontend development server in background
echo -e "${GREEN}Starting frontend development server...${NC}"
npm run dev &
FRONTEND_PID=$!

# Go back to root directory
cd ..

# Function to handle cleanup on script exit
cleanup() {
    echo -e "${BLUE}Cleaning up...${NC}"
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit
}

# Set up trap to catch script termination
trap cleanup SIGINT SIGTERM

echo -e "${GREEN}Project initialized successfully!${NC}"
echo -e "${BLUE}Backend and frontend servers are running.${NC}"
echo -e "${BLUE}Press Ctrl+C to stop both servers.${NC}"

# Keep the script running
wait 