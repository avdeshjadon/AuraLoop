; AuraLoop Windows Inno Setup Script
; Proprietary & Closed Source - Copyright (C) 2026 Avdesh Jadon

#define MyAppName "AuraLoop"
#define MyAppVersion "6.6.0"
#define MyAppPublisher "Avdesh Jadon"
#define MyAppURL "https://github.com/avdeshjadon/AuraLoop"
#define MyAppExeName "AuraLoop.exe"

#ifndef SourceDir
  #define SourceDir "..\..\dist-win"
#endif

[Setup]
AppId={{5E61C8B4-D28E-4E57-B9C3-2895CD1A96EF}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DisableProgramGroupPage=yes
OutputBaseFilename=AuraLoop-Win-x64-Setup
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=lowest

; Branding, Icons & Visual Customization
SetupIconFile=AppIcon.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
WizardImageFile=WizardImage.bmp
WizardSmallImageFile=WizardSmallImage.bmp
DisableWelcomePage=no

; Version & Metadata
VersionInfoVersion={#MyAppVersion}.113
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription=AuraLoop Live Wallpaper & Screensaver Installer
VersionInfoCopyright=Copyright (C) 2026 Avdesh Jadon. All Rights Reserved.
VersionInfoProductName={#MyAppName}
VersionInfoProductVersion={#MyAppVersion}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: checkedonce
Name: "startupicon"; Description: "Start AuraLoop automatically on Windows login"; GroupDescription: "Windows Integration:"; Flags: checkedonce

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\Assets\AppIcon.ico"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\Assets\AppIcon.ico"; Tasks: desktopicon
Name: "{userstartup}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Parameters: "--background"; IconFilename: "{app}\Assets\AppIcon.ico"; Tasks: startupicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
