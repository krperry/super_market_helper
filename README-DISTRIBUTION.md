# Store Inventory Manager - Standalone Distribution

## For End Users

### Running the Application

1. Double-click `StoreInventory.exe`
2. The application will start and automatically open in your default web browser
3. You'll see the Store Inventory Manager interface at http://localhost:3000

### First Time Setup

The application will automatically create a `database` folder in the same location as the .exe file. This is where your inventory data is stored.

### Features

- **All Inventory**: View and manage all items in your store
- **Shopping List**: See what items need to be restocked
- **Add Item**: Add new products to your inventory
- **Manage Locations**: Organize items by location in your store
- **Manage Stores**: Track inventory for multiple stores

### Data Backup

Your inventory data is stored in the `database/inventory.db` file. To backup your data:
1. Close the application
2. Copy the entire `database` folder to a safe location
3. To restore, replace the `database` folder with your backup

### Stopping the Application

Simply close the browser window and the command prompt window that opened.

---

## For Developers

### Building the Executable

To build the standalone executable:

```powershell
npm install
npm run build
```

The executable will be created in the `dist` folder as `StoreInventory.exe`.

### Distribution Package

Include these files when distributing:
- `StoreInventory.exe` - The main application
- `README-USERS.md` - User instructions (optional)

The database folder will be created automatically on first run.

### Build Options

- **Windows 64-bit**: `npm run build` (default)
- **Windows 32-bit**: Change target to `node18-win-x86` in package.json
- **Linux**: Change target to `node18-linux-x64`
- **macOS**: Change target to `node18-macos-x64`

### File Size

The executable is approximately 50-60MB because it includes:
- Node.js runtime
- All dependencies
- Application code and assets
