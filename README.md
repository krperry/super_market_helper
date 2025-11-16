# Store Inventory Manager

A web-based inventory management system for retail stores that helps track stock levels, manage inventory, and generate shopping lists.

## Features

- **Inventory Management**: Track brand, item name, location, current count, and target amounts
- **Real-time Updates**: Update quantities and view current stock levels
- **Shopping Lists**: Automatically generate shopping lists for items that need restocking
- **Location Filtering**: Filter inventory and shopping lists by store location
- **Web Interface**: Clean, responsive web interface accessible from any device on the network

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: SQLite for local data storage
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **API**: RESTful API for all operations

## Installation

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Import Your CSV Data** (if you have a Supermarket.csv file):
   ```bash
   npm run import-csv
   ```

3. **Start the Server**:
   ```bash
   npm start
   ```

4. **Development Mode** (with auto-restart):
   ```bash
   npm  dev
   ```

The application will be available at `http://localhost:3000`

## Usage

### Adding Items
1. Click the "Add Item" tab
2. Fill in the item details:
   - Brand name
   - Item name
   - Location in store
   - Current count on shelf
   - Target amount needed
3. Click "Save Item"

### Viewing Inventory
1. Click the "All Inventory" tab
2. Use the location filter to view items from specific locations
3. The status column shows:
   - **In Stock**: Current count matches target
   - **Low Stock**: Current count is below target
   - **Out of Stock**: Current count is zero
   - **Overstocked**: Current count exceeds target

### Managing Stock Levels
- **Quick Update via Dropdown**: In the "All Inventory" tab, use the dropdown in the "Current Count" column to instantly change stock levels (0 to target amount +10)
- **Edit Item**: Click "Edit" to modify all item details including brand, name, location, and target amounts
- **Delete**: Click "Delete" to remove items (with confirmation)

### Shopping Lists
1. Click the "Shopping List" tab
2. View all items that need restocking (current count < target amount)
3. Use location filter to see shopping needs by store area
4. The "Need to Buy" column shows exactly how many of each item to purchase
5. **Check Off Purchases**: 
   - Enter the amount purchased in the "Purchased" column
   - Check the checkbox to automatically add that quantity to your inventory
   - The item will be removed from the shopping list if you've met the target

### Location-Based Organization
The system automatically tracks all locations you enter and provides filtering options. This helps you:
- Organize shopping by store sections (e.g., "Aisle 1", "Electronics", "Frozen Foods")
- Generate location-specific shopping lists
- Track inventory distribution across different areas

## API Endpoints

### Inventory Operations
- `GET /api/inventory` - Get all inventory items
- `GET /api/inventory/location/:location` - Get inventory by location
- `POST /api/inventory` - Add new inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `PATCH /api/inventory/:id/quantity` - Update only quantities
- `DELETE /api/inventory/:id` - Delete inventory item

### Shopping List
- `GET /api/shopping-list` - Get items needing restocking
- `GET /api/shopping-list/location/:location` - Get shopping list by location

### Locations
- `GET /api/locations` - Get all unique locations

## Database Schema

The SQLite database contains a single `inventory` table with the following structure:

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Unique identifier |
| brand | TEXT | Brand name |
| item | TEXT | Item name |
| location | TEXT | Store location/section |
| currentCount | INTEGER | Current quantity on shelf |
| targetAmount | INTEGER | Target quantity to maintain |
| created_at | DATETIME | Record creation timestamp |
| updated_at | DATETIME | Last update timestamp |

## Network Access

The application runs on your local network and can be accessed by any device connected to the same network:

1. Find your computer's IP address
2. Access the application at `http://[YOUR-IP-ADDRESS]:3000`
3. All devices on the network can now view and update inventory

## File Structure

```
store-inventory-manager/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── database/              # SQLite database location
│   └── inventory.db       # Created automatically
├── public/                # Frontend files
│   ├── index.html         # Main HTML page
│   ├── styles.css         # Styling
│   └── script.js          # Frontend JavaScript
└── README.md              # This documentation
```

## Customization

### Adding New Fields
To add new fields to inventory items:
1. Update the database schema in `server.js`
2. Add form fields in `index.html`
3. Update the API endpoints to handle new fields
4. Modify the frontend JavaScript to display new data

### Styling
Modify `public/styles.css` to customize the appearance. The design is fully responsive and works on desktop and mobile devices.

### Business Logic
Update `server.js` to modify business rules, such as:
- Automatic reorder points
- Different stock level calculations
- Integration with external systems

## Troubleshooting

### Port Already in Use
If port 3000 is already in use, set a different port:
```bash
PORT=3001 npm start
```

### Database Issues
The SQLite database is created automatically. If you encounter issues:
1. Delete the `database/inventory.db` file
2. Restart the server to recreate the database

### Network Access Issues
Ensure your firewall allows connections on the chosen port and that all devices are on the same network.

## Contributing

This is a standalone application designed for small retail stores. Feel free to modify and extend it according to your specific needs.

## License

MIT License - feel free to use and modify as needed.