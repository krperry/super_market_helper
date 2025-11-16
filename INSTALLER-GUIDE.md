# Creating the Installer

This guide shows you how to create a Windows installer for Store Inventory Manager.

## Prerequisites

1. **Inno Setup 6** - Download and install from https://jrsoftware.org/isdl.php
   - Install to the default location: `C:\Program Files (x86)\Inno Setup 6\`

2. **Node.js and dependencies** - Make sure you've run `npm install`

## Quick Build (Recommended)

Simply run the PowerShell script:

```powershell
.\build-installer.ps1
```

This will:
1. Build the executable using pkg
2. Copy launcher files to dist
3. Create the installer using Inno Setup
4. Output: `dist\StoreInventoryManager-Setup.exe`

## Manual Build

If you prefer to build manually:

1. Build the executable:
   ```bash
   npm run build
   ```

2. Compile the installer with Inno Setup:
   ```bash
   "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" installer.iss
   ```

## What Gets Installed

The installer creates:
- **Installation folder**: `C:\Program Files\Store Inventory Manager\`
- **Start Menu shortcuts**:
  - Store Inventory Manager (starts the server)
  - Stop Store Inventory Manager (stops the server)
  - Uninstall
- **Desktop shortcut** (optional)
- **Database folder** with proper write permissions

## Installer Features

✅ **Preserves database** - Existing databases are never overwritten during upgrades
✅ **Easy upgrades** - Just run new installer over old version
✅ **Clean uninstall** - Option to keep or delete data
✅ **No admin required** - Installs to user's Program Files
✅ **Professional installer** - Standard Windows installation wizard

## Distribution

After building, distribute this single file:
```
dist\StoreInventoryManager-Setup.exe
```

Users simply:
1. Double-click the installer
2. Click "Next" through the wizard
3. Launch from Start Menu or Desktop icon

## Customizing the Installer

Edit `installer.iss` to change:

```ini
#define MyAppName "Store Inventory Manager"
#define MyAppVersion "1.0"
#define MyAppPublisher "Your Company Name"
```

You can also:
- Add custom icons (replace SetupIconFile)
- Change default install directory
- Add file associations
- Include additional files

## Upgrading Users

When you release a new version:
1. Update version number in `installer.iss`
2. Run `.\build-installer.ps1`
3. Distribute the new installer

Users can install over the old version:
- Their database is automatically preserved
- All settings remain intact
- New features are added

## Uninstalling

When users uninstall:
- They're asked if they want to keep the database
- By default, the database is preserved (safe for reinstall)
- All application files are removed

## Troubleshooting

**"Inno Setup not found"**
- Install Inno Setup 6 from https://jrsoftware.org/isdl.php
- Make sure it's in the default location

**"Build failed"**
- Run `npm install` first
- Make sure all files are in the dist folder
- Check that launcher VBS files exist

**"Access denied" during install**
- Installer requires standard user permissions
- On locked-down systems, may need admin rights
