const sqlite3 = require('sqlite3').verbose();

const path = require('path');

const dbPath = path.join(__dirname, 'database', 'inventory.db');
const db = new sqlite3.Database(dbPath);

console.log('Starting database migration to add stores support...');

db.serialize(() => {
    // Check if store_id column exists
    db.all("PRAGMA table_info(inventory)", [], (err, columns) => {
        if (err) {
            console.error('Error checking table schema:', err);
            return;
        }
        
        const hasStoreId = columns.some(col => col.name === 'store_id');
        
        if (!hasStoreId) {
            console.log('Adding store_id column to inventory table...');
            
            // Add store_id column with default value of 1 (default store)
            db.run('ALTER TABLE inventory ADD COLUMN store_id INTEGER NOT NULL DEFAULT 1', (err) => {
                if (err) {
                    console.error('Error adding store_id column:', err);
                } else {
                    console.log('Successfully added store_id column');
                    console.log('All existing inventory items have been assigned to store_id 1 (Default Store)');
                }
                
                db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err);
                    } else {
                        console.log('Migration complete!');
                        console.log('You can now restart the server with: npm start');
                    }
                });
            });
        } else {
            console.log('store_id column already exists, no migration needed');
            db.close();
        }
    });
});
