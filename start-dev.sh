#!/bin/bash

# ERP System Development Startup Script

echo "🚀 Starting ERP System Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

echo "📦 Building and starting development containers..."
docker-compose -f docker-compose.dev.yml up --build

echo "✅ Development environment started!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo "🗄️  PostgreSQL: localhost:5432"
echo ""
echo "📝 Default admin credentials:"
echo "   Email: admin@erp.com"
echo "   Password: admin123"
echo ""
echo "🛑 To stop the environment, press Ctrl+C or run:"
echo "   docker-compose -f docker-compose.dev.yml down"
