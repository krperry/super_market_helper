const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
// Allow port to be passed as command line argument: node server.js 3045
// Use --no-browser flag to disable auto-opening browser: node server.js 3045 --no-browser
const args = process.argv.slice(2);
const portArg = args.find(arg => !arg.startsWith('--'));
const noBrowser = args.includes('--no-browser');
const PORT = portArg || process.env.PORT || 3000;

// Write PID file for stop script - use process.cwd() for PKG compatibility
const pidFile = path.join(process.cwd(), '.server.pid');
fs.writeFileSync(pidFile, process.pid.toString());
console.log(`Server PID: ${process.pid}`);

// Clean up PID file on exit
process.on('exit', () => {
    if (fs.existsSync(pidFile)) {
        fs.unlinkSync(pidFile);
    }
});

process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nShutting down server...');
    process.exit(0);
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database setup - create directory if it doesn't exist
// Use process.cwd() for PKG compatibility (works outside the snapshot)
const dbDir = path.join(process.cwd(), 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('Created database directory at:', dbDir);
}

const dbPath = path.join(dbDir, 'inventory.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database at:', dbPath);
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    // Create stores table
    const createStoresTable = `
        CREATE TABLE IF NOT EXISTS stores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    // Create inventory table with store_id
    const createInventoryTable = `
        CREATE TABLE IF NOT EXISTS inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            store_id INTEGER NOT NULL,
            brand TEXT NOT NULL,
            item TEXT NOT NULL,
            location TEXT NOT NULL,
            currentCount INTEGER DEFAULT 0,
            targetAmount INTEGER DEFAULT 0,
            extra INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
        )
    `;
    
    db.run(createStoresTable, (err) => {
        if (err) {
            console.error('Error creating stores table:', err);
        } else {
            console.log('Stores table initialized');
            
            // Create default store if none exists
            db.get('SELECT COUNT(*) as count FROM stores', [], (err, row) => {
                if (!err && row.count === 0) {
                    db.run('INSERT INTO stores (name) VALUES (?)', ['Default Store'], (err) => {
                        if (err) {
                            console.error('Error creating default store:', err);
                        } else {
                            console.log('Default store created');
                            // Migrate existing inventory to default store
                            db.run('UPDATE inventory SET store_id = 1 WHERE store_id IS NULL OR store_id = 0', (err) => {
                                if (err) {
                                    console.log('No existing inventory to migrate');
                                } else {
                                    console.log('Migrated existing inventory to default store');
                                }
                            });
                        }
                    });
                }
            });
        }
    });
    
    db.run(createInventoryTable, (err) => {
        if (err) {
            console.error('Error creating inventory table:', err);
        } else {
            console.log('Inventory table initialized');
            // Migrate database: add active and extra columns if they don't exist
            db.all("PRAGMA table_info(inventory)", [], (err, columns) => {
                if (!err) {
                    const hasActiveColumn = columns.some(col => col.name === 'active');
                    const hasExtraColumn = columns.some(col => col.name === 'extra');
                    
                    if (!hasActiveColumn) {
                        db.run('ALTER TABLE inventory ADD COLUMN active INTEGER DEFAULT 1', (err) => {
                            if (err) {
                                console.error('Error adding active column:', err);
                            } else {
                                console.log('Added active column to inventory table (migration completed)');
                            }
                        });
                    }
                    
                    if (!hasExtraColumn) {
                        db.run('ALTER TABLE inventory ADD COLUMN extra INTEGER DEFAULT 0', (err) => {
                            if (err) {
                                console.error('Error adding extra column:', err);
                            } else {
                                console.log('Added extra column to inventory table (migration completed)');
                            }
                        });
                    }
                }
            });
        }
    });
}

// API Routes

// Store Management Routes

// Get all stores
app.get('/api/stores', (req, res) => {
    const query = 'SELECT * FROM stores ORDER BY name';
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Add new store
app.post('/api/stores', (req, res) => {
    const { name, copyFromStoreId } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Store name is required' });
    }
    
    const insertStoreQuery = 'INSERT INTO stores (name) VALUES (?)';
    
    db.run(insertStoreQuery, [name], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                res.status(400).json({ error: 'Store name already exists' });
            } else {
                res.status(500).json({ error: err.message });
            }
        } else {
            const newStoreId = this.lastID;
            
            // If copyFromStoreId is provided, copy all items
            if (copyFromStoreId) {
                const copyQuery = `
                    INSERT INTO inventory (store_id, brand, item, location, currentCount, targetAmount)
                    SELECT ?, brand, item, location, 0, 0
                    FROM inventory
                    WHERE store_id = ?
                `;
                
                db.run(copyQuery, [newStoreId, copyFromStoreId], (err) => {
                    if (err) {
                        res.status(500).json({ error: 'Store created but failed to copy items: ' + err.message });
                    } else {
                        res.json({ id: newStoreId, message: 'Store created and items copied successfully' });
                    }
                });
            } else {
                res.json({ id: newStoreId, message: 'Empty store created successfully' });
            }
        }
    });
});

// Update store name
app.put('/api/stores/:id', (req, res) => {
    const id = req.params.id;
    const { name } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Store name is required' });
    }
    
    const query = 'UPDATE stores SET name = ? WHERE id = ?';
    
    db.run(query, [name, id], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                res.status(400).json({ error: 'Store name already exists' });
            } else {
                res.status(500).json({ error: err.message });
            }
        } else {
            res.json({ message: 'Store renamed successfully', changes: this.changes });
        }
    });
});

// Delete store
app.delete('/api/stores/:id', (req, res) => {
    const id = req.params.id;
    
    // Check if it's the last store
    db.get('SELECT COUNT(*) as count FROM stores', [], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (row.count <= 1) {
            return res.status(400).json({ error: 'Cannot delete the last store' });
        }
        
        // First delete all inventory items for this store
        db.run('DELETE FROM inventory WHERE store_id = ?', [id], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error deleting inventory: ' + err.message });
            }
            
            // Then delete the store
            const query = 'DELETE FROM stores WHERE id = ?';
            
            db.run(query, [id], function(err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                } else {
                    res.json({ 
                        message: 'Store and associated inventory deleted successfully', 
                        changes: this.changes 
                    });
                }
            });
        });
    });
});

// Inventory Management Routes (updated to include store_id)

// Get all inventory items for a store
app.get('/api/inventory', (req, res) => {
    const storeId = req.query.store_id || 1;
    const query = 'SELECT * FROM inventory WHERE store_id = ? AND (active = 1 OR active IS NULL) ORDER BY location, brand, item';
    
    db.all(query, [storeId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Get all inactive inventory items for a store
app.get('/api/inventory/inactive', (req, res) => {
    const storeId = req.query.store_id || 1;
    const query = 'SELECT * FROM inventory WHERE store_id = ? AND active = 0 ORDER BY location, brand, item';
    
    db.all(query, [storeId], (err, rows) => {
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
    const storeId = req.query.store_id || 1;
    const query = 'SELECT * FROM inventory WHERE location = ? AND store_id = ? AND (active = 1 OR active IS NULL) ORDER BY brand, item';
    
    db.all(query, [location, storeId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Get shopping list (items where currentCount < targetAmount)
app.get('/api/shopping-list', (req, res) => {
    const storeId = req.query.store_id || 1;
    const query = `
        SELECT *, (targetAmount - currentCount + COALESCE(extra, 0)) as needed 
        FROM inventory 
        WHERE currentCount < (targetAmount + COALESCE(extra, 0)) AND store_id = ? AND (active = 1 OR active IS NULL)
        ORDER BY location, brand, item
    `;
    
    db.all(query, [storeId], (err, rows) => {
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
    const storeId = req.query.store_id || 1;
    const query = `
        SELECT *, (targetAmount - currentCount + COALESCE(extra, 0)) as needed 
        FROM inventory 
        WHERE currentCount < (targetAmount + COALESCE(extra, 0)) AND location = ? AND store_id = ? AND (active = 1 OR active IS NULL)
        ORDER BY brand, item
    `;
    
    db.all(query, [location, storeId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Add new inventory item
app.post('/api/inventory', (req, res) => {
    const { brand, item, location, currentCount, targetAmount, extra, store_id } = req.body;
    const storeId = store_id || 1;
    
    if (!brand || !item || !location) {
        return res.status(400).json({ error: 'Brand, item, and location are required' });
    }
    
    const query = `
        INSERT INTO inventory (store_id, brand, item, location, currentCount, targetAmount, extra, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    
    db.run(query, [storeId, brand, item, location, currentCount || 0, targetAmount || 0, extra || 0], function(err) {
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
    const { brand, item, location, currentCount, targetAmount, extra } = req.body;
    
    const query = `
        UPDATE inventory 
        SET brand = ?, item = ?, location = ?, currentCount = ?, targetAmount = ?, extra = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
    
    db.run(query, [brand, item, location, currentCount, targetAmount, extra || 0, id], function(err) {
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

// Update extra amount for inventory item
app.patch('/api/inventory/:id/extra', (req, res) => {
    const id = req.params.id;
    const { extra } = req.body;
    
    const query = `
        UPDATE inventory 
        SET extra = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
    
    db.run(query, [extra || 0, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: 'Extra amount updated successfully', changes: this.changes });
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

// Toggle item active/inactive status
app.patch('/api/inventory/:id/toggle-active', (req, res) => {
    const id = req.params.id;
    const { active } = req.body;
    
    if (active === undefined) {
        return res.status(400).json({ error: 'active status is required' });
    }
    
    const query = 'UPDATE inventory SET active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    
    db.run(query, [active ? 1 : 0, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: 'Item status updated successfully', changes: this.changes });
        }
    });
});

// Get all unique locations
app.get('/api/locations', (req, res) => {
    const storeId = req.query.store_id || 1;
    // Return all locations for the store, regardless of item active status
    const query = 'SELECT DISTINCT location FROM inventory WHERE store_id = ? ORDER BY location';
    db.all(query, [storeId], (err, rows) => {
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

// Start server - bind to 0.0.0.0 to allow network access
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Store Inventory Manager running on http://localhost:${PORT}`);
    console.log(`Network access: http://<your-ip>:${PORT}`);
    
    // Auto-open browser unless --no-browser flag is set
    if (!noBrowser) {
        console.log('Opening browser...');
        const url = `http://localhost:${PORT}`;
        const start = process.platform === 'win32' ? 'start' : 
                      process.platform === 'darwin' ? 'open' : 'xdg-open';
        exec(`${start} ${url}`);
    } else {
        console.log('Browser auto-open disabled');
    }
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