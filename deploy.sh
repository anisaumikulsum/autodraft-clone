#!/bin/bash
set -e

echo "=== Autodraft Clone Deploy Script ==="
echo ""

# Check docker installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo "Docker installed. Please logout and login again, then re-run this script."
    exit 1
fi

# Check docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo "Installing docker-compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Check .env exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    echo "Copy .env.example to .env and fill in your real API keys."
    exit 1
fi

# Pull latest code
echo "Pulling latest code..."
git pull origin main

# Build and start
echo "Building and starting containers..."
docker-compose down
docker-compose up --build -d

# Run prisma migration
echo "Running database migration..."
docker-compose exec backend npx prisma migrate deploy

echo ""
echo "=== Deploy Complete ==="
echo "Frontend: http://$(curl -s ifconfig.me):3000"
echo "Backend API: http://$(curl -s ifconfig.me):4000"
echo "Minio Console: http://$(curl -s ifconfig.me):9001"
echo ""
echo "Check logs: docker-compose logs -f"
