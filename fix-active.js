const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'inventory.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking and fixing active column values...\n');

// Check current active values
db.all('SELECT active, COUNT(*) as count FROM inventory GROUP BY active', [], (err, rows) => {
    if (err) {
        console.error('Error:', err);
        db.close();
        return;
    }
    
    console.log('Current active status breakdown:');
    rows.forEach(row => {
        const status = row.active === 1 ? 'Active (1)' : row.active === 0 ? 'Inactive (0)' : 'NULL';
        console.log(`  ${status}: ${row.count} items`);
    });
    
    // Update NULL values to 1 (active)
    db.run('UPDATE inventory SET active = 1 WHERE active IS NULL', [], function(err) {
        if (err) {
            console.error('Error updating:', err);
        } else {
            console.log(`\nUpdated ${this.changes} rows from NULL to active (1)`);
        }
        
        // Show results after update
        db.all('SELECT active, COUNT(*) as count FROM inventory GROUP BY active', [], (err, rows) => {
            if (!err) {
                console.log('\nAfter update:');
                rows.forEach(row => {
                    const status = row.active === 1 ? 'Active (1)' : row.active === 0 ? 'Inactive (0)' : 'NULL';
                    console.log(`  ${status}: ${row.count} items`);
                });
            }
            db.close();
        });
    });
});
