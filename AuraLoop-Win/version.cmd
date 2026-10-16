@echo off
setlocal enabledelayedexpansion

set SCRIPT_DIR=%~dp0
set VERSION_FILE=%SCRIPT_DIR%VERSION
set CSPROJ_FILE=%SCRIPT_DIR%AuraLoop-Win\AuraLoop-Win.csproj
set SETTINGS_FILE=%SCRIPT_DIR%AuraLoop-Win\Views\SettingsView.xaml

if "%~1"=="" (
    if exist "%VERSION_FILE%" (
        for /f "tokens=1,2 delims==" %%a in (%VERSION_FILE%) do (
            if "%%a"=="VERSION" set NEW_VERSION=%%b
            if "%%a"=="BUILD" set NEW_BUILD=%%b
        )
    ) else (
        echo Usage: version.cmd [version] [build]
        exit /b 1
    )
) else (
    set NEW_VERSION=%~1
    if "%~2"=="" (
        set NEW_BUILD=1
    ) else (
        set NEW_BUILD=%~2
    )
)

echo Updating AuraLoop-Win to %NEW_VERSION% (Build %NEW_BUILD%)...

(
echo VERSION=%NEW_VERSION%
echo BUILD=%NEW_BUILD%
) > "%VERSION_FILE%"

powershell -Command "(Get-Content '%CSPROJ_FILE%') -replace '<Version>.*</Version>', '<Version>%NEW_VERSION%</Version>' -replace '<AssemblyVersion>.*</AssemblyVersion>', '<AssemblyVersion>%NEW_VERSION%.%NEW_BUILD%</AssemblyVersion>' -replace '<FileVersion>.*</FileVersion>', '<FileVersion>%NEW_VERSION%.%NEW_BUILD%</FileVersion>' | Set-Content '%CSPROJ_FILE%'"
powershell -Command "(Get-Content '%SETTINGS_FILE%') -replace 'Version [0-9.]+ \(Build [0-9]+\)', 'Version %NEW_VERSION% (Build %NEW_BUILD%)' | Set-Content '%SETTINGS_FILE%'"

echo Updated AuraLoop-Win successfully!
