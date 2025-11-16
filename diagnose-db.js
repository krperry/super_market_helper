const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'inventory.db');
const db = new sqlite3.Database(dbPath);

console.log('Database diagnostic:');
console.log('===================\n');

// Check stores
db.all('SELECT * FROM stores', [], (err, stores) => {
    if (err) {
        console.error('Error getting stores:', err);
        return;
    }
    console.log('STORES:');
    stores.forEach(store => {
        console.log(`  ID: ${store.id}, Name: ${store.name}`);
    });
    console.log('');
    
    // Check items per store
    stores.forEach(store => {
        db.all('SELECT COUNT(*) as count FROM inventory WHERE store_id = ?', [store.id], (err, rows) => {
            if (!err) {
                console.log(`Store "${store.name}" (ID ${store.id}): ${rows[0].count} items`);
            }
        });
    });
});

// Check active column
db.all('PRAGMA table_info(inventory)', [], (err, columns) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('\nINVENTORY TABLE COLUMNS:');
        columns.forEach(col => {
            console.log(`  ${col.name} (${col.type}), Default: ${col.dflt_value}`);
        });
    }
});

// Check sample data
setTimeout(() => {
    db.all('SELECT id, brand, item, store_id, active FROM inventory LIMIT 10', [], (err, rows) => {
        if (err) {
            console.error('Error:', err);
        } else {
            console.log('\nSAMPLE DATA (first 10 items):');
            rows.forEach(row => {
                console.log(`  ID: ${row.id}, Store: ${row.store_id}, Active: ${row.active}, Item: ${row.brand} ${row.item}`);
            });
        }
        
        // Check active/inactive counts
        db.all('SELECT active, COUNT(*) as count FROM inventory GROUP BY active', [], (err, rows) => {
            if (!err) {
                console.log('\nACTIVE STATUS BREAKDOWN:');
                rows.forEach(row => {
                    const status = row.active === 1 ? 'Active' : row.active === 0 ? 'Inactive' : 'NULL';
                    console.log(`  ${status}: ${row.count} items`);
                });
            }
            db.close();
        });
    });
}, 500);
