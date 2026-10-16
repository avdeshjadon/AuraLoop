# AuraLoop for Windows

High-Performance Native Live Wallpapers & Screensavers for Windows 10 & 11, built with **C# (.NET 8)** and **WinUI 3 (Windows App SDK)**.

## Architecture

- **Desktop WorkerW Engine**: Injects video viewport surfaces directly behind desktop icons via Win32 `WorkerW` / `Progman` parenting (`SetParent`).
- **Hardware-Accelerated Decoding**: Uses Windows Media Foundation and Direct3D 11/12 GPU decoding for 0-1% CPU consumption.
- **Intelligent Playback Monitor**: Automatically pauses playback during full-screen applications, games, and battery-saver mode.
- **Shared Aesthetic**: Faithful recreation of AuraLoop macOS Liquid Glass design tokens, midnight navigation, and card layouts.

## Building on Windows

### Prerequisites
- Windows 10 (version 1809+) or Windows 11
- Visual Studio 2022 with **.NET Desktop Development** and **Windows App SDK** workloads, or .NET 8.0 SDK.

### Build
```cmd
build.cmd
```
or via PowerShell:
```powershell
dotnet build AuraLoop-Win/AuraLoop-Win.csproj -c Release
```

## License
Copyright © 2026 Avdesh Jadon. All Rights Reserved. Strictly Proprietary.
