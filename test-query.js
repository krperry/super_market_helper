const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'inventory.db');
const db = new sqlite3.Database(dbPath);

console.log('Testing SQL queries:\n');

// Test the query we're using in the API
const query1 = 'SELECT * FROM inventory WHERE store_id = ? AND (active = 1 OR active IS NULL) ORDER BY location, brand, item';

db.all(query1, [1], (err, rows) => {
    if (err) {
        console.log('ERROR with query:', err.message);
    } else {
        console.log(`Query 1 (store_id=1, active=1 OR NULL): ${rows.length} items`);
        if (rows.length > 0) {
            console.log('  Sample:', rows[0].brand, rows[0].item, 'Active:', rows[0].active);
        }
    }
    
    // Test simpler query
    db.all('SELECT * FROM inventory WHERE store_id = 1 LIMIT 5', [], (err, rows) => {
        if (err) {
            console.log('ERROR:', err.message);
        } else {
            console.log(`\nAll items for store 1 (first 5):`);
            rows.forEach(r => {
                console.log(`  ${r.brand} ${r.item} - Active: ${r.active}, Store: ${r.store_id}`);
            });
        }
        db.close();
    });
});
