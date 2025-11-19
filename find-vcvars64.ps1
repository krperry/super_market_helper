# PowerShell script to find all vcvars64.bat files on the system
# Usage: Run this script in PowerShell

$results = Get-ChildItem -Path C:\ -Recurse -Filter vcvars64.bat -ErrorAction SilentlyContinue | Select-Object FullName
if ($results) {
    Write-Host "Found the following vcvars64.bat files:"
    $results | ForEach-Object { Write-Host $_.FullName }
} else {
    Write-Host "No vcvars64.bat files found on this system."
}