# Server Mode Configuration

## Overview
The Store Inventory Manager can run in two modes:

1. **Standalone Mode** (default) - For single-user desktop use via the executable
2. **Server Mode** - For multi-user shared server deployment

## Standalone Mode (Default)
- Used when running the `StoreInventory.exe` executable
- Shutdown button is visible in the web interface
- Users can exit the application cleanly via the "Exit Application" button

## Server Mode
When running as a shared server that multiple people access, set the `SERVER_MODE` environment variable:

### Windows (PowerShell)
```powershell
$env:SERVER_MODE="true"
npm start
```

### Windows (Command Prompt)
```cmd
set SERVER_MODE=true
npm start
```

### Linux/Mac
```bash
SERVER_MODE=true npm start
```

### What changes in Server Mode:
- **Shutdown button is hidden** - Users cannot see or access the exit button
- **Shutdown endpoint is disabled** - Returns 403 Forbidden if called
- **Server stays running** - Only admins with terminal access can stop the server

## Production Deployment
For a production server, set the environment variable permanently:

### Windows Service
Add `SERVER_MODE=true` to the service environment variables

### Linux systemd
Add to your service file:
```ini
[Service]
Environment="SERVER_MODE=true"
```

### Docker
```dockerfile
ENV SERVER_MODE=true
```

Or in docker-compose.yml:
```yaml
environment:
  - SERVER_MODE=true
```

## Stopping the Server in Server Mode
Since the shutdown button is disabled, stop the server using:
- `Ctrl+C` in the terminal
- Task Manager (Windows)
- `taskkill /F /IM node.exe` (Windows)
- `pkill -f "node.*server.js"` (Linux/Mac)
