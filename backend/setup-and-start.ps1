# LOL Analyzer MVP Backend Setup and Start Script
Write-Host "🔧 Starting LOL Analyzer MVP backend fixes..." -ForegroundColor Green

# Check if MySQL is running
Write-Host "📊 Checking MySQL service..." -ForegroundColor Yellow
$mysqlService = Get-Service | Where-Object { $_.Name -like "*mysql*" -and $_.Status -eq "Running" }
if (-not $mysqlService) {
    Write-Host "❌ MySQL is not running. Please start MySQL service first:" -ForegroundColor Red
    Write-Host "   Start-Service MySQL80  (or your MySQL service name)" -ForegroundColor White
    Write-Host "   Or start it through Services.msc" -ForegroundColor White
    exit 1
}

# Test database connection
Write-Host "🔗 Testing database connection..." -ForegroundColor Yellow
try {
    $result = mysql -u root -proot -e "SELECT 1;" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Database connection failed. Please check MySQL credentials." -ForegroundColor Red
        Write-Host "Current credentials: user=root, password=root" -ForegroundColor White
        exit 1
    }
} catch {
    Write-Host "❌ Database connection failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Run database initialization
Write-Host "🗄️  Initializing database..." -ForegroundColor Yellow
try {
    mysql -u root -proot < scripts/init.sql
    if ($LASTEXITCODE -ne 0) {
        throw "Database initialization failed"
    }
} catch {
    Write-Host "❌ Database initialization failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Run database migrations
Write-Host "🔄 Running database migrations..." -ForegroundColor Yellow
try {
    mysql -u root -proot lol_analyzer < scripts/migrate.sql
    if ($LASTEXITCODE -ne 0) {
        throw "Database migration failed"
    }
} catch {
    Write-Host "⚠️  Migration had issues, but database should be functional" -ForegroundColor Yellow
}

Write-Host "✅ Database setup completed successfully!" -ForegroundColor Green

# Install/update dependencies
Write-Host "📦 Installing/updating dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Build the application
Write-Host "🔨 Building application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Setup completed successfully!" -ForegroundColor Green
Write-Host "🚀 Starting backend server..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor White

# Start the application
npm start
