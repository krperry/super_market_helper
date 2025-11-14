const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Create database directory if it doesn't exist
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('Created database directory');
}

const dbPath = path.join(dbDir, 'inventory.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
db.serialize(() => {
    // Create table if it doesn't exist
    db.run(`
        CREATE TABLE IF NOT EXISTS inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            brand TEXT NOT NULL,
            item TEXT NOT NULL,
            location TEXT NOT NULL,
            currentCount INTEGER DEFAULT 0,
            targetAmount INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Read and parse CSV file
    const csvPath = path.join(__dirname, 'Supermarket.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    // Skip header line
    const dataLines = lines.slice(1);
    
    let imported = 0;
    let skipped = 0;
    
    const stmt = db.prepare(`
        INSERT INTO inventory (brand, item, location, currentCount, targetAmount, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    dataLines.forEach((line, index) => {
        if (!line.trim()) {
            skipped++;
            return;
        }
        
        // Parse CSV line (handle commas in quotes)
        const columns = line.split(',').map(col => col.trim());
        
        if (columns.length < 7) {
            console.log(`Skipping line ${index + 2}: Not enough columns`);
            skipped++;
            return;
        }
        
        const brand = columns[1] || 'Unknown';
        const item = columns[2] || 'Unknown Item';
        const location = columns[4] || 'Unknown';
        const targetAmount = parseInt(columns[5]) || 0;
        const needed = parseInt(columns[6]) || 0;
        
        // Calculate current count (targetAmount - needed)
        // If no needed value, assume we're at target
        const currentCount = needed > 0 ? Math.max(0, targetAmount - needed) : targetAmount;
        
        // Skip if brand and item are empty
        if (!brand || brand === 'Unknown' || !item || item === 'Unknown Item') {
            console.log(`Skipping line ${index + 2}: Missing brand or item`);
            skipped++;
            return;
        }
        
        stmt.run(brand, item, location, currentCount, targetAmount, (err) => {
            if (err) {
                console.error(`Error importing line ${index + 2}:`, err.message);
                skipped++;
            } else {
                imported++;
            }
        });
    });
    
    stmt.finalize(() => {
        console.log('\n=== CSV Import Complete ===');
        console.log(`Successfully imported: ${imported} items`);
        console.log(`Skipped: ${skipped} items`);
        console.log(`\nDatabase location: ${dbPath}`);
        
        // Show some sample data
        db.all('SELECT * FROM inventory LIMIT 5', (err, rows) => {
            if (!err && rows.length > 0) {
                console.log('\nSample imported data:');
                rows.forEach(row => {
                    console.log(`  - ${row.brand} ${row.item} @ ${row.location} (${row.currentCount}/${row.targetAmount})`);
                });
            }
            
            // Get total count
            db.get('SELECT COUNT(*) as total FROM inventory', (err, row) => {
                if (!err) {
                    console.log(`\nTotal items in database: ${row.total}`);
                }
                db.close();
            });
        });
    });
});

console.log('Importing data from Supermarket.csv...');
