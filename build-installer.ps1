# Build Installer for Store Inventory Manager
# This script builds the application and creates an installer using Inno Setup

Write-Host "Building Store Inventory Manager Installer..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Build the executable
Write-Host "Step 1: Building executable with pkg..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Executable built successfully!" -ForegroundColor Green
Write-Host ""

# Step 2: Compile installer
Write-Host "Step 2: Creating installer with Inno Setup..." -ForegroundColor Yellow
"C:\tools\Inno Setup 6\iscc.exe installer.iss"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Installer creation failed!" -ForegroundColor Red
    Write-Host "Make sure Inno Setup is installed and ISCC.exe is in your PATH" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SUCCESS! Installer created in dist folder" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "File: dist\StoreInventoryManager-Setup.exe" -ForegroundColor White
Write-Host ""
