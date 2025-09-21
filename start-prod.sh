#!/bin/bash

# ERP System Production Startup Script

echo "🚀 Starting ERP System Production Environment..."

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

echo "📦 Building and starting production containers..."
docker-compose up --build -d

echo "✅ Production environment started!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo "🗄️  PostgreSQL: localhost:5432"
echo ""
echo "📝 Default admin credentials:"
echo "   Email: admin@erp.com"
echo "   Password: admin123"
echo ""
echo "📊 To view logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 To stop the environment:"
echo "   docker-compose down"
