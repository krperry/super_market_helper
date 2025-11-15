const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'inventory.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking for default store...');

db.serialize(() => {
    // Check if any stores exist
    db.get('SELECT COUNT(*) as count FROM stores', [], (err, row) => {
        if (err) {
            console.error('Error checking stores:', err);
            db.close();
            return;
        }
        
        if (row.count === 0) {
            console.log('No stores found. Creating Default Store...');
            db.run('INSERT INTO stores (name) VALUES (?)', ['Default Store'], function(err) {
                if (err) {
                    console.error('Error creating default store:', err);
                } else {
                    console.log('Default Store created successfully with ID:', this.lastID);
                    
                    // Update any inventory items that have no store_id or store_id = 0
                    db.run('UPDATE inventory SET store_id = ? WHERE store_id IS NULL OR store_id = 0 OR store_id NOT IN (SELECT id FROM stores)', [this.lastID], function(err) {
                        if (err) {
                            console.error('Error updating inventory:', err);
                        } else {
                            console.log('Updated', this.changes, 'inventory items to Default Store');
                        }
                        db.close(() => {
                            console.log('Done! Please restart the server.');
                        });
                    });
                }
            });
        } else {
            console.log('Found', row.count, 'store(s) in database');
            
            // Show all stores
            db.all('SELECT * FROM stores ORDER BY id', [], (err, stores) => {
                if (err) {
                    console.error('Error listing stores:', err);
                } else {
                    console.log('Existing stores:');
                    stores.forEach(store => {
                        console.log(`  - ID: ${store.id}, Name: ${store.name}`);
                    });
                }
                db.close(() => {
                    console.log('No changes needed.');
                });
            });
        }
    });
});
