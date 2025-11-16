const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'inventory.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking database at:', dbPath);
console.log('---');

db.all('SELECT COUNT(*) as count FROM inventory', [], (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Total items in inventory:', rows[0].count);
    }
});

db.all('SELECT COUNT(*) as count FROM inventory WHERE active = 1 OR active IS NULL', [], (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Active items:', rows[0].count);
    }
});

db.all('SELECT COUNT(*) as count FROM inventory WHERE active = 0', [], (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Inactive items:', rows[0].count);
    }
});

db.all('SELECT id, brand, item, active FROM inventory LIMIT 5', [], (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('\nFirst 5 items:');
        rows.forEach(row => {
            console.log(`  ID: ${row.id}, ${row.brand} ${row.item}, Active: ${row.active}`);
        });
    }
    db.close();
});
