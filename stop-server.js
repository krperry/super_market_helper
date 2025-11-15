const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const pidFile = path.join(process.cwd(), '.server.pid');

if (fs.existsSync(pidFile)) {
    const pid = fs.readFileSync(pidFile, 'utf8').trim();
    
    console.log(`Stopping server (PID: ${pid})...`);
    
    if (process.platform === 'win32') {
        exec(`taskkill /F /PID ${pid}`, (error) => {
            if (error) {
                console.error(`Error stopping server: ${error.message}`);
            } else {
                console.log('Server stopped successfully');
            }
            fs.unlinkSync(pidFile);
        });
    } else {
        exec(`kill ${pid}`, (error) => {
            if (error) {
                console.error(`Error stopping server: ${error.message}`);
            } else {
                console.log('Server stopped successfully');
            }
            fs.unlinkSync(pidFile);
        });
    }
} else {
    console.log('Server is not running (no PID file found)');
}
