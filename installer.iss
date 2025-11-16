; Store Inventory Manager - Inno Setup Script
; This script creates an installer for the Store Inventory Manager application

#define MyAppName "Store Inventory Manager"
#define MyAppVersion "1.0"
#define MyAppPublisher "Your Company Name"
#define MyAppURL "https://yourwebsite.com"
#define MyAppExeName "Store Inventory Manager.vbs"
#define MyAppStopExeName "Stop Store Inventory.vbs"

[Setup]
; NOTE: The value of AppId uniquely identifies this application.
; Do not use the same AppId value in installers for other applications.
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=dist
OutputBaseFilename=StoreInventoryManager-Setup
SetupIconFile=
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
DisableProgramGroupPage=yes
UninstallDisplayIcon={app}\{#MyAppExeName}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Main executable and launcher files
Source: "dist\StoreInventory.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "launcher\Store Inventory Manager.vbs"; DestDir: "{app}"; Flags: ignoreversion
Source: "launcher\Stop Store Inventory.vbs"; DestDir: "{app}"; Flags: ignoreversion

; Database folder - only install if it doesn't exist (preserve user data)
; This allows you to include a default/template database
Source: "dist\database\*"; DestDir: "{app}\database"; Flags: onlyifdoesntexist uninsneveruninstall recursesubdirs createallsubdirs external skipifsourcedoesntexist

[Dirs]
; Ensure database directory exists and user has write permissions
Name: "{app}\database"; Permissions: users-full

[Icons]
; Start Menu icons
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\StoreInventory.exe"
Name: "{group}\Stop {#MyAppName}"; Filename: "{app}\{#MyAppStopExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"

; Desktop icons (if selected)
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon; IconFilename: "{app}\StoreInventory.exe"

[Run]
; Option to launch application after installation
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
; Clean up any runtime files but preserve database
Type: files; Name: "{app}\.server.pid"

[Code]
// Custom code to check for running instance before install/uninstall
function InitializeSetup(): Boolean;
var
  ResultCode: Integer;
  PidFile: String;
begin
  Result := True;
  PidFile := ExpandConstant('{app}\.server.pid');
  
  // Check if server is running
  if FileExists(PidFile) then
  begin
    if MsgBox('Store Inventory Manager appears to be running. Please stop it before continuing with the installation.' + #13#10#13#10 + 'Do you want to continue anyway?', mbConfirmation, MB_YESNO) = IDNO then
    begin
      Result := False;
    end;
  end;
end;

function InitializeUninstall(): Boolean;
var
  ResultCode: Integer;
  PidFile: String;
begin
  Result := True;
  PidFile := ExpandConstant('{app}\.server.pid');
  
  // Check if server is running
  if FileExists(PidFile) then
  begin
    if MsgBox('Store Inventory Manager appears to be running. Please stop it before uninstalling.' + #13#10#13#10 + 'Do you want to continue anyway?', mbConfirmation, MB_YESNO) = IDNO then
    begin
      Result := False;
    end;
  end;
  
  // Confirm database deletion
  if Result then
  begin
    if MsgBox('Do you want to keep your inventory database?' + #13#10#13#10 + 'Click YES to keep your data (recommended if reinstalling)' + #13#10 + 'Click NO to delete everything', mbConfirmation, MB_YESNO) = IDYES then
    begin
      // Database is already marked as uninsneveruninstall, so it will be kept
    end;
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    // Any post-installation tasks can go here
  end;
end;
