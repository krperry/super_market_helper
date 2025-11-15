# Store Inventory Manager - Launcher Build Instructions

## Current Solution: VBScript (Works but Deprecated)

The VBScript launcher (`Store Inventory Manager.vbs`) works now but Microsoft is phasing out VBScript.

## Future-Proof Solutions:

### Option A: .NET Launcher (Included - Ready to Build)

I've created a C# launcher in the `launcher` folder that's modern and future-proof.

**Requirements:**
- .NET 6.0 Runtime (most Windows 10/11 already have it)
- Download from: https://dotnet.microsoft.com/download/dotnet/6.0

**To Build:**
```powershell
cd launcher
dotnet publish -c Release -r win-x64 --self-contained false
```

**Result:**
- Creates `bin/Release/net6.0-windows/win-x64/publish/Store Inventory Manager.exe`
- Copy this launcher alongside `StoreInventory.exe`
- Users double-click the launcher, it handles everything

**Pros:**
✅ Future-proof (modern .NET)
✅ Small file size (~200KB)
✅ No console window
✅ Professional

**Cons:**
❌ Requires .NET 6.0 runtime (but most PCs have it)

---

### Option B: Electron (Most Professional)

Convert to full desktop app like VS Code, Slack, Discord.

**Setup Time:** ~2 hours
**Result:** Professional installer, auto-updates, system tray icon

**To implement:**
```powershell
npm install --save-dev electron electron-builder
```

I can set this up if you want the most professional solution.

---

### Option C: Keep VBScript for Now

VBScript still works on all current Windows versions and will for years. Microsoft deprecated it but hasn't removed it.

**Current distribution:**
- `StoreInventory.exe` - The server
- `Store Inventory Manager.vbs` - The launcher
- `USER-GUIDE.txt` - Instructions

This works perfectly for now. You can upgrade later if needed.

---

## My Recommendation:

**For immediate distribution:** Use the VBScript launcher - it works great and will continue to work.

**For professional product:** Let me set up Electron (2 hours) - you'll get:
- Real Windows installer (.msi)
- App icon in Start Menu
- Proper Windows app appearance
- No browser URL bar showing
- Auto-updates

Which would you prefer?
