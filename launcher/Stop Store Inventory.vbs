Set objShell = CreateObject("WScript.Shell")

' Kill the StoreInventory.exe process
objShell.Run "taskkill /F /IM StoreInventory.exe", 0, True

' Optional: Wait a moment
WScript.Sleep 500
