# PowerShell script to set up Visual Studio build environment and run Electron build
# Usage: Run this script in PowerShell

# Path to the preferred vcvars64.bat (choose the latest version if multiple found)
$vcvarsPath = "C:\Program Files\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvars64.bat"

# Path to your project directory
$projectDir = $PWD.Path

# Command to run Electron build (edit if your build command is different)
$electronBuildCmd = "npm run electron:build"



# Create a temporary batch file to set environment and run build
$batFile = Join-Path $projectDir 'run-electron-build.bat'
Remove-Item $batFile -ErrorAction SilentlyContinue
"call `"$vcvarsPath`"" | Out-File -FilePath $batFile -Encoding ASCII
"cd /d `"$projectDir`"" | Out-File -FilePath $batFile -Encoding ASCII -Append
"$electronBuildCmd" | Out-File -FilePath $batFile -Encoding ASCII -Append

Write-Host "Running Electron build with Visual Studio environment..."
Start-Process cmd.exe -ArgumentList "/c `"$batFile`"" -Wait

# Clean up temporary batch file
Remove-Item $batFile -Force

Write-Host "Build process complete."