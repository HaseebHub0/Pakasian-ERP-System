@echo off
REM ERP System Development Startup Script

echo 🚀 Starting ERP System Development Environment...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

echo 📦 Building and starting development containers...
docker-compose -f docker-compose.dev.yml up --build

echo ✅ Development environment started!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:3001
echo 🗄️  PostgreSQL: localhost:5432
echo.
echo 📝 Default admin credentials:
echo    Email: admin@erp.com
echo    Password: admin123
echo.
echo 🛑 To stop the environment, press Ctrl+C or run:
echo    docker-compose -f docker-compose.dev.yml down
pause
