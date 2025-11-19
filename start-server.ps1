# Start the inventory server on a custom port
# Usage: .\start-server.ps1 3045

param(
    [int]$Port = 3000
)

Write-Host "Starting Store Inventory Manager on port $Port..." -ForegroundColor Cyan
Write-Host "Server will run in the background (no browser window)" -ForegroundColor Yellow

# Start the server process in a hidden window
$process = Start-Process -FilePath "node" `
    -ArgumentList "server.js", $Port, "--no-browser" `
    -WindowStyle Hidden `
    -PassThru

Write-Host "`nServer started successfully!" -ForegroundColor Green
Write-Host "  Process ID: $($process.Id)" -ForegroundColor White
Write-Host "  Port: $Port" -ForegroundColor White
Write-Host "  Access URL: http://localhost:$Port" -ForegroundColor Cyan
Write-Host "`nTo stop the server, run: npm stop" -ForegroundColor Yellow
