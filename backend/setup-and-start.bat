#!/bin/bash

echo "🔧 Starting LOL Analyzer MVP backend fixes..."

# Check if MySQL is running
echo "📊 Checking MySQL service..."
net start | findstr /i mysql
if %ERRORLEVEL% NEQ 0 (
    echo "❌ MySQL is not running. Please start MySQL service first:"
    echo "   net start mysql80  (or your MySQL service name)"
    echo "   Or start it through Services.msc"
    exit /b 1
)

# Run database migrations
echo "🗄️  Running database migrations..."
mysql -u root -proot lol_analyzer < scripts/migrate.sql
if %ERRORLEVEL% NEQ 0 (
    echo "❌ Database migration failed. Trying to create database first..."
    mysql -u root -proot < scripts/init.sql
    if %ERRORLEVEL% NEQ 0 (
        echo "❌ Failed to initialize database. Please check MySQL credentials and permissions."
        exit /b 1
    fi
fi

echo "✅ Database setup completed successfully!"

# Install/update dependencies
echo "📦 Installing/updating dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Start the application
echo "🚀 Starting backend server..."
npm start
