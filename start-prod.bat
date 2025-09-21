@echo off
REM ERP System Production Startup Script

echo 🚀 Starting ERP System Production Environment...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

echo 📦 Building and starting production containers...
docker-compose up --build -d

echo ✅ Production environment started!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:3001
echo 🗄️  PostgreSQL: localhost:5432
echo.
echo 📝 Default admin credentials:
echo    Email: admin@erp.com
echo    Password: admin123
echo.
echo 📊 To view logs:
echo    docker-compose logs -f
echo.
echo 🛑 To stop the environment:
echo    docker-compose down
pause
