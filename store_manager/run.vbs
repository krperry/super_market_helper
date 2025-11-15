Set objShell = CreateObject("WScript.Shell")
Set objWMIService = GetObject("winmgmts:\\.\root\cimv2")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Function to check if process is running
Function IsProcessRunning(processName)
    Set colProcesses = objWMIService.ExecQuery("SELECT * FROM Win32_Process WHERE Name = '" & processName & "'")
    IsProcessRunning = (colProcesses.Count > 0)
End Function

' Get the path to the executable
Dim exePath
exePath = objFSO.GetParentFolderName(WScript.ScriptFullName) & "\StoreInventory.exe"

' Check if executable exists
If Not objFSO.FileExists(exePath) Then
    MsgBox "StoreInventory.exe not found in: " & objFSO.GetParentFolderName(WScript.ScriptFullName), vbCritical, "Error"
    WScript.Quit
End If

' Check if StoreInventory.exe is already running
If IsProcessRunning("StoreInventory.exe") Then
    ' Just open the browser to the existing instance
    objShell.Run "http://localhost:3000", 1
Else
    ' Start the executable
    objShell.Run """" & exePath & """", 0
    
    ' Wait for server to start (longer timeout)
    WScript.Sleep 3000
    
    ' Open browser
    objShell.Run "http://localhost:3000", 1
End If
