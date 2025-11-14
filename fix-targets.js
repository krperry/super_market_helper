const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'inventory.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Update all items with targetAmount of 16 to 18
    db.run('UPDATE inventory SET targetAmount = 18 WHERE targetAmount = 16', function(err) {
        if (err) {
            console.error('Error updating database:', err);
        } else {
            console.log(`Successfully updated ${this.changes} items from target 16 to 18`);
        }
        
        // Show some updated items
        db.all('SELECT * FROM inventory WHERE targetAmount = 18 LIMIT 10', (err, rows) => {
            if (!err && rows.length > 0) {
                console.log('\nSample items with target amount 18:');
                rows.forEach(row => {
                    console.log(`  - ${row.brand} ${row.item} @ ${row.location} (${row.currentCount}/${row.targetAmount})`);
                });
            }
            db.close();
        });
    });
});

console.log('Updating target amounts from 16 to 18...');
