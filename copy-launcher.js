const fs = require('fs');
const path = require('path');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Copy launcher files
const launcherDir = path.join(__dirname, 'launcher');
const files = fs.readdirSync(launcherDir);

files.forEach(file => {
    if (file.endsWith('.vbs')) {
        const source = path.join(launcherDir, file);
        const dest = path.join(distDir, file);
        fs.copyFileSync(source, dest);
        console.log(`Copied ${file} to dist/`);
    }
});

console.log('Launcher files copied successfully!');
