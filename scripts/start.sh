#!/bin/bash

# BotCRUD Startup Script
# Usage: ./scripts/start.sh [init|run]
#   init - Initialize Docker, seed data, and start all services
#   run  - Start backend and frontend (assumes Docker is already running)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the root directory of the project
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Function to print colored messages
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."

    local missing=()

    if ! command_exists node; then
        missing+=("node")
    fi

    if ! command_exists npm; then
        missing+=("npm")
    fi

    if ! command_exists docker; then
        missing+=("docker")
    fi

    if ! command_exists docker-compose; then
        # Check for docker compose (v2)
        if ! docker compose version >/dev/null 2>&1; then
            missing+=("docker-compose")
        fi
    fi

    if [ ${#missing[@]} -ne 0 ]; then
        print_error "Missing prerequisites: ${missing[*]}"
        print_error "Please install the missing tools and try again."
        exit 1
    fi

    print_success "All prerequisites found"
}

# Function to check if Docker is running
check_docker_running() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to start MongoDB with Docker
start_mongodb() {
    print_info "Starting MongoDB with Docker..."

    cd "$ROOT_DIR/backend/data"

    # Check if docker-compose or docker compose should be used
    if command_exists docker-compose; then
        docker-compose up -d
    else
        docker compose up -d
    fi

    print_info "Waiting for MongoDB to be ready..."

    # Wait for MongoDB to be healthy (max 60 seconds)
    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if docker exec botcrud-mongodb mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
            print_success "MongoDB is ready"
            return 0
        fi

        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done

    echo ""
    print_error "MongoDB failed to start within 60 seconds"
    exit 1
}

# Function to check if MongoDB is running
check_mongodb_running() {
    if docker ps --format '{{.Names}}' | grep -q "botcrud-mongodb"; then
        if docker exec botcrud-mongodb mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

# Function to install backend dependencies
install_backend() {
    print_info "Installing backend dependencies..."
    cd "$ROOT_DIR/backend"
    npm install
    print_success "Backend dependencies installed"
}

# Function to install frontend dependencies
install_frontend() {
    print_info "Installing frontend dependencies..."
    cd "$ROOT_DIR/frontend"
    npm install
    print_success "Frontend dependencies installed"
}

# Function to start the backend
start_backend() {
    print_info "Starting backend server..."
    cd "$ROOT_DIR/backend"

    # Start backend in background
    npm run dev &
    BACKEND_PID=$!

    # Wait for backend to be ready
    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:3000/health >/dev/null 2>&1; then
            print_success "Backend is running at http://localhost:3000"
            print_info "API Documentation: http://localhost:3000/docs"
            return 0
        fi

        attempt=$((attempt + 1))
        sleep 1
    done

    print_warning "Backend may still be starting..."
}

# Function to start the frontend
start_frontend() {
    print_info "Starting frontend server..."
    cd "$ROOT_DIR/frontend"

    # Start frontend in background
    npm run dev &
    FRONTEND_PID=$!

    # Wait a moment for it to start
    sleep 5

    print_success "Frontend is starting at http://localhost:9000"
}

# Function to show usage
show_usage() {
    echo ""
    echo "BotCRUD Startup Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  init    Initialize Docker, install dependencies, and start all services"
    echo "  run     Start backend and frontend (assumes Docker is already running)"
    echo "  stop    Stop all services and Docker containers"
    echo "  help    Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 init    # First time setup"
    echo "  $0 run     # Quick start (Docker already running)"
    echo "  $0 stop    # Stop everything"
    echo ""
}

# Function to stop all services
stop_services() {
    print_info "Stopping services..."

    # Kill any node processes for this project
    pkill -f "node.*botcrud" 2>/dev/null || true
    pkill -f "quasar dev" 2>/dev/null || true

    # Stop Docker containers
    cd "$ROOT_DIR/backend/data"
    if command_exists docker-compose; then
        docker-compose down
    else
        docker compose down
    fi

    print_success "All services stopped"
}

# Function to handle init command
do_init() {
    print_info "=== BotCRUD Initialization ==="
    echo ""

    check_prerequisites
    check_docker_running

    # Start MongoDB
    start_mongodb

    # Install dependencies
    install_backend
    install_frontend

    echo ""
    print_info "=== Starting Services ==="
    echo ""

    # Start services
    start_backend
    start_frontend

    echo ""
    print_success "=== BotCRUD is ready! ==="
    echo ""
    echo "  Frontend:          http://localhost:9000"
    echo "  Backend API:       http://localhost:3000"
    echo "  API Documentation: http://localhost:3000/docs"
    echo "  Mongo Express:     http://localhost:8081"
    echo ""
    echo "Press Ctrl+C to stop all services"
    echo ""

    # Wait for user interrupt
    wait
}

# Function to handle run command
do_run() {
    print_info "=== BotCRUD Quick Start ==="
    echo ""

    check_prerequisites
    check_docker_running

    # Check if MongoDB is running, if not start it
    if ! check_mongodb_running; then
        print_warning "MongoDB is not running, starting it..."
        start_mongodb
    else
        print_success "MongoDB is already running"
    fi

    echo ""
    print_info "=== Starting Services ==="
    echo ""

    # Start services
    start_backend
    start_frontend

    echo ""
    print_success "=== BotCRUD is ready! ==="
    echo ""
    echo "  Frontend:          http://localhost:9000"
    echo "  Backend API:       http://localhost:3000"
    echo "  API Documentation: http://localhost:3000/docs"
    echo "  Mongo Express:     http://localhost:8081"
    echo ""
    echo "Press Ctrl+C to stop all services"
    echo ""

    # Wait for user interrupt
    wait
}

# Trap Ctrl+C to cleanup
cleanup() {
    echo ""
    print_info "Shutting down..."

    # Kill background processes
    jobs -p | xargs -r kill 2>/dev/null || true

    print_success "Services stopped. Docker containers are still running."
    print_info "Run '$0 stop' to also stop Docker containers."
    exit 0
}

trap cleanup SIGINT SIGTERM

# Main script
case "${1:-}" in
    init)
        do_init
        ;;
    run)
        do_run
        ;;
    stop)
        stop_services
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        if [ -n "${1:-}" ]; then
            print_error "Unknown command: $1"
        fi
        show_usage
        exit 1
        ;;
esac
