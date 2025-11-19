
# Build Electron Installer Script



s
# This script builds the Electron app and creates an installer with Inno Setup

Write-Host "Building Electron app..." -ForegroundColor Cyan

# Step 1: Build the Electron application
npm run build-electron
if ($LASTEXITCODE -ne 0) {
    Write-Host "Electron build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`nElectron build complete!" -ForegroundColor Green

# Step 2: Copy database folder if it exists
if (Test-Path "database") {
    Write-Host "`nCopying database to build folder..." -ForegroundColor Cyan
    
    # For portable build, database goes next to the exe
    $destPath = "dist\database"
    
    # Create the folder if it doesn't exist
    if (-not (Test-Path $destPath)) {
        New-Item -ItemType Directory -Path $destPath -Force | Out-Null
    }
    
    # Copy database folder
    Copy-Item -Path "database\*" -Destination $destPath -Recurse -Force
    Write-Host "Database copied successfully!" -ForegroundColor Green
} else {
    Write-Host "`nWarning: No database folder found to copy" -ForegroundColor Yellow
}

# Step 3: Run Inno Setup to create installer
Write-Host "`nCreating installer with Inno Setup..." -ForegroundColor Cyan

# Check if iscc is in PATH, otherwise try common installation paths
$isccPath = Get-Command iscc -ErrorAction SilentlyContinue
if (-not $isccPath) {
    # Try common Inno Setup installation paths
    $commonPaths = @(
        "${env:ProgramFiles(x86)}\Inno Setup 6\iscc.exe",
        "${env:ProgramFiles}\Inno Setup 6\iscc.exe",
        "${env:ProgramFiles(x86)}\Inno Setup 5\iscc.exe",
        "${env:ProgramFiles}\Inno Setup 5\iscc.exe"
    )
    
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            $isccPath = $path
            break
        }
    }
}

if ($isccPath) {
    & $isccPath "installer-electron.iss"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nInstaller created successfully!" -ForegroundColor Green
        Write-Host "Location: dist\StoreInventoryManager-Electron-Setup.exe" -ForegroundColor Cyan
    } else {
        Write-Host "`nInno Setup compilation failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "`nWarning: Inno Setup (iscc) not found in PATH" -ForegroundColor Yellow
    Write-Host "Skipping installer creation. Please install Inno Setup or run manually:" -ForegroundColor Yellow
    Write-Host "  iscc installer-electron.iss" -ForegroundColor White
}

Write-Host "`nBuild process complete!" -ForegroundColor Green
