#!/bin/bash
set -e

# Orchestr8 Intelligence Database Setup Script
# This script initializes the PostgreSQL + pgvector database for code intelligence

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTAINER_NAME="orchestr8-intelligence-db"
ENV_FILE="${SCRIPT_DIR}/.env"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Orchestr8 Intelligence Database Setup                  ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi
echo -e "${GREEN}✓ Docker is installed${NC}"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed${NC}"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose is installed${NC}"

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo -e "${RED}✗ Docker daemon is not running${NC}"
    echo "Please start Docker and try again"
    exit 1
fi
echo -e "${GREEN}✓ Docker daemon is running${NC}"
echo ""

# Check if container already exists
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${YELLOW}⚠ Container '${CONTAINER_NAME}' already exists${NC}"

    # Check if it's running
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo -e "${GREEN}✓ Container is already running${NC}"
        echo ""
        echo -e "${BLUE}Database Connection Information:${NC}"

        # Load environment variables
        if [ -f "$ENV_FILE" ]; then
            source "$ENV_FILE"
        else
            POSTGRES_PORT=5433
            POSTGRES_DB=orchestr8_intelligence
            POSTGRES_USER=orchestr8
        fi

        echo "  Host:     localhost"
        echo "  Port:     ${POSTGRES_PORT}"
        echo "  Database: ${POSTGRES_DB}"
        echo "  User:     ${POSTGRES_USER}"
        echo ""
        echo -e "${GREEN}Connection String:${NC}"
        echo "  postgresql://${POSTGRES_USER}:****@localhost:${POSTGRES_PORT}/${POSTGRES_DB}"
        echo ""
        echo -e "${BLUE}To view logs:${NC} docker logs ${CONTAINER_NAME} -f"
        echo -e "${BLUE}To stop:${NC}      docker stop ${CONTAINER_NAME}"
        echo -e "${BLUE}To restart:${NC}   docker restart ${CONTAINER_NAME}"
        exit 0
    else
        echo -e "${YELLOW}Container exists but is not running. Starting...${NC}"
        docker start "${CONTAINER_NAME}"

        # Wait for database to be ready
        echo -n "Waiting for database to be ready"
        for i in {1..30}; do
            if docker exec "${CONTAINER_NAME}" pg_isready -U orchestr8 &> /dev/null; then
                echo -e " ${GREEN}✓${NC}"
                break
            fi
            echo -n "."
            sleep 1
        done
        echo ""
        echo -e "${GREEN}✓ Database is ready${NC}"
        exit 0
    fi
fi

# Create .env file if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠ .env file not found. Creating from .env.example...${NC}"
    if [ -f "${SCRIPT_DIR}/.env.example" ]; then
        cp "${SCRIPT_DIR}/.env.example" "$ENV_FILE"
        echo -e "${GREEN}✓ Created .env file${NC}"
        echo -e "${YELLOW}⚠ Please update the .env file with your configuration (especially OPENAI_API_KEY)${NC}"
        echo ""
    else
        echo -e "${YELLOW}⚠ .env.example not found. Using default configuration${NC}"
    fi
fi

# Start the database container
echo -e "${BLUE}Starting PostgreSQL + pgvector container...${NC}"
cd "$SCRIPT_DIR"

if command -v docker-compose &> /dev/null; then
    docker-compose up -d
else
    docker compose up -d
fi

# Wait for the database to be ready
echo -n "Waiting for database to initialize"
for i in {1..60}; do
    if docker exec "${CONTAINER_NAME}" pg_isready -U orchestr8 &> /dev/null; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

# Verify database connection
echo -e "${BLUE}Verifying database connection...${NC}"
if docker exec "${CONTAINER_NAME}" psql -U orchestr8 -d orchestr8_intelligence -c "SELECT version();" &> /dev/null; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${RED}✗ Database connection failed${NC}"
    echo "Please check Docker logs: docker logs ${CONTAINER_NAME}"
    exit 1
fi

# Verify pgvector extension
echo -e "${BLUE}Verifying pgvector extension...${NC}"
if docker exec "${CONTAINER_NAME}" psql -U orchestr8 -d orchestr8_intelligence -c "SELECT * FROM pg_extension WHERE extname = 'vector';" | grep -q "vector"; then
    echo -e "${GREEN}✓ pgvector extension is installed${NC}"
else
    echo -e "${RED}✗ pgvector extension is not installed${NC}"
    exit 1
fi

# Verify schema tables
echo -e "${BLUE}Verifying database schema...${NC}"
TABLE_COUNT=$(docker exec "${CONTAINER_NAME}" psql -U orchestr8 -d orchestr8_intelligence -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Schema initialized successfully (${TABLE_COUNT} tables created)${NC}"
else
    echo -e "${RED}✗ Schema initialization failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Database Setup Complete!                                ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Load environment variables for display
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
else
    POSTGRES_PORT=5433
    POSTGRES_DB=orchestr8_intelligence
    POSTGRES_USER=orchestr8
fi

echo -e "${BLUE}Database Connection Information:${NC}"
echo "  Host:     localhost"
echo "  Port:     ${POSTGRES_PORT}"
echo "  Database: ${POSTGRES_DB}"
echo "  User:     ${POSTGRES_USER}"
echo ""
echo -e "${GREEN}Connection String:${NC}"
echo "  postgresql://${POSTGRES_USER}:****@localhost:${POSTGRES_PORT}/${POSTGRES_DB}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Update OPENAI_API_KEY in .env file for semantic search"
echo "  2. Run /index-codebase to index your project"
echo "  3. Use code-query agent for JIT context loading"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  View logs:    docker logs ${CONTAINER_NAME} -f"
echo "  Stop:         docker stop ${CONTAINER_NAME}"
echo "  Start:        docker start ${CONTAINER_NAME}"
echo "  Restart:      docker restart ${CONTAINER_NAME}"
echo "  Connect CLI:  docker exec -it ${CONTAINER_NAME} psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}"
echo "  Remove:       docker-compose -f ${SCRIPT_DIR}/docker-compose.yml down -v"
echo ""
