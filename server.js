const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database setup - create directory if it doesn't exist
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('Created database directory');
}

const dbPath = path.join(dbDir, 'inventory.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    const createTableQuery = `
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
    `;
    
    db.run(createTableQuery, (err) => {
        if (err) {
            console.error('Error creating table:', err);
        } else {
            console.log('Database table initialized');
        }
    });
}

// API Routes

// Get all inventory items
app.get('/api/inventory', (req, res) => {
    const query = 'SELECT * FROM inventory ORDER BY location, brand, item';
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Get inventory by location
app.get('/api/inventory/location/:location', (req, res) => {
    const location = req.params.location;
    const query = 'SELECT * FROM inventory WHERE location = ? ORDER BY brand, item';
    
    db.all(query, [location], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Get shopping list (items where currentCount < targetAmount)
app.get('/api/shopping-list', (req, res) => {
    const query = `
        SELECT *, (targetAmount - currentCount) as needed 
        FROM inventory 
        WHERE currentCount < targetAmount 
        ORDER BY location, brand, item
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Get shopping list by location
app.get('/api/shopping-list/location/:location', (req, res) => {
    const location = req.params.location;
    const query = `
        SELECT *, (targetAmount - currentCount) as needed 
        FROM inventory 
        WHERE currentCount < targetAmount AND location = ?
        ORDER BY brand, item
    `;
    
    db.all(query, [location], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Add new inventory item
app.post('/api/inventory', (req, res) => {
    const { brand, item, location, currentCount, targetAmount } = req.body;
    
    if (!brand || !item || !location) {
        return res.status(400).json({ error: 'Brand, item, and location are required' });
    }
    
    const query = `
        INSERT INTO inventory (brand, item, location, currentCount, targetAmount, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    
    db.run(query, [brand, item, location, currentCount || 0, targetAmount || 0], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ id: this.lastID, message: 'Item added successfully' });
        }
    });
});

// Update inventory item
app.put('/api/inventory/:id', (req, res) => {
    const id = req.params.id;
    const { brand, item, location, currentCount, targetAmount } = req.body;
    
    const query = `
        UPDATE inventory 
        SET brand = ?, item = ?, location = ?, currentCount = ?, targetAmount = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
    
    db.run(query, [brand, item, location, currentCount, targetAmount, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: 'Item updated successfully', changes: this.changes });
        }
    });
});

// Update only quantities
app.patch('/api/inventory/:id/quantity', (req, res) => {
    const id = req.params.id;
    const { currentCount, targetAmount } = req.body;
    
    const query = `
        UPDATE inventory 
        SET currentCount = ?, targetAmount = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
    
    db.run(query, [currentCount, targetAmount, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: 'Quantities updated successfully', changes: this.changes });
        }
    });
});

// Delete inventory item
app.delete('/api/inventory/:id', (req, res) => {
    const id = req.params.id;
    const query = 'DELETE FROM inventory WHERE id = ?';
    
    db.run(query, [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: 'Item deleted successfully', changes: this.changes });
        }
    });
});

// Get all unique locations
app.get('/api/locations', (req, res) => {
    const query = 'SELECT DISTINCT location FROM inventory ORDER BY location';
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows.map(row => row.location));
        }
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Store Inventory Manager running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});