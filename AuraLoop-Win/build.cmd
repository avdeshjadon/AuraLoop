@echo off
echo ========================================================
echo Building AuraLoop for Windows (WinUI 3 + .NET 8)
echo ========================================================

where dotnet >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: .NET SDK 8.0+ is required to build AuraLoop-Win.
    echo Please install from https://dotnet.microsoft.com/download
    exit /b 1
)

cd /d "%~dp0"
if exist "version.cmd" call version.cmd
cd /d "%~dp0\AuraLoop-Win"
dotnet build AuraLoop-Win.csproj -c Release
if %ERRORLEVEL% neq 0 (
    echo Build failed!
    exit /b %ERRORLEVEL%
)

echo Build succeeded! Output binaries located at:
echo %~dp0AuraLoop-Win\bin\x64\Release\net8.0-windows10.0.19041.0\win-x64\
pause
