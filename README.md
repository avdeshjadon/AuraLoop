<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/png/icon-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="assets/png/icon.png">
  <img src="assets/png/icon-dark.png" width="124" alt="AuraLoop Icon">
</picture>

<br><br>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/svg/auraloop-wordmark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/svg/auraloop-wordmark-dark.svg">
  <img src="assets/svg/auraloop-wordmark.svg" width="320" alt="AuraLoop">
</picture>

### High-Performance Native Live Wallpapers & Screensavers for macOS & Windows

[![macOS](https://img.shields.io/badge/macOS-14%2B-black?logo=apple)](https://apple.com/macos)
[![Universal](https://img.shields.io/badge/Universal-Apple_Silicon_%2B_Intel-black?logo=apple)](https://apple.com)
[![Windows](https://img.shields.io/badge/Windows-10%2F11%20x64-0078D4?logo=windows&logoColor=white)](https://microsoft.com/windows)
[![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com)
[![WinUI 3](https://img.shields.io/badge/WinUI-3.0-0078D4?logo=windows&logoColor=white)](https://microsoft.com)
[![Status](https://img.shields.io/badge/Source-Proprietary%20%2F%20Closed-critical)](#license)
[![License](https://img.shields.io/badge/License-All_Rights_Reserved-red)](#license)
[![Release](https://img.shields.io/github/v/release/avdeshjadon/AuraLoop?color=success&label=Release)](https://github.com/avdeshjadon/AuraLoop/releases)

</div>

---

## Overview

**AuraLoop** is a native, cross-platform live wallpaper and screen saver engine built specifically for **macOS** (Swift / SwiftUI) and **Windows** (C# / .NET 8 / WinUI 3). It renders stunning, ultra-smooth looping video wallpapers across all connected displays with near-zero CPU and memory overhead.

By utilizing hardware-accelerated media decoders on each operating system (AVFoundation on macOS and Media Foundation / DirectComposition on Windows), AuraLoop operates completely silently in the background and intelligently pauses during fullscreen applications, battery saver modes, and display sleep.

---

## Downloads & Installation

Pre-compiled, signed production packages are available on the [Releases](https://github.com/avdeshjadon/AuraLoop/releases) page:

### macOS
* **`AuraLoop-6.6.0.dmg`** — Drag-and-drop installer disk image. Universal binary compiled natively for both **Apple Silicon (M1/M2/M3/M4)** and **Intel** Macs.
  * *Installation:* Open the `.dmg`, drag `AuraLoop.app` to your `/Applications` folder, and launch from Spotlight or Launchpad.

### Windows
* **`AuraLoop-Win-x64-Setup.exe` (Recommended)** — Full Windows installer built with Inno Setup.
  * *Features:* Installs to `Program Files`, creates Desktop and Start Menu shortcuts, registers Windows startup integration, and provides a clean uninstaller in Windows Settings.
* **`AuraLoop-Win-x64.exe`** — Standalone, self-contained single-file portable executable (~65 MB).
  * *Features:* Zero-installation, fully portable. Double-click to launch directly from any directory or removable drive.
* **`AuraLoop-Windows-x64.zip`** — Portable archive containing the complete application bundle and assets.

---

## Key Features

- **Multi-Monitor Live Video Wallpapers** — Smooth, continuous playback spanning single or multiple displays with individual or synchronized configurations.
- **Lock Screen & Screen Saver Synchronization** — Display matching high-definition stills and videos on macOS lock screens and Windows login backgrounds.
- **Hardware-Decoded Efficiency** — Zero-copy GPU decoding (HEVC/H.265 & VP9) ensures negligible CPU impact and whisper-quiet fans.
- **Intelligent Power & Resource Monitor** — Automatically pauses playback when applications run fullscreen, when the desktop is occluded, or on battery-saver thresholds.
- **Curated 4K Apple Aerials** — Browse and download the complete catalog of Apple Aerial videos, landscape flyovers, underwater captures, and cosmic footage.
- **Dynamic Solar Engine** — Calculate astronomical solar elevation and automatically transition through 24-hour day/twilight/night dynamic keyframes.
- **Universal Importer** — Drag and drop your own MP4, MOV, or animated wallpaper files directly into your personal offline library.
- **System Tray & Menu Bar Controls** — Instant playback pausing, track changing, playlist shuffling, and settings management from the system menu bar (macOS) or taskbar notification area (Windows).

---

## System Requirements

| Platform | Minimum OS Version | Architecture | Required Frameworks |
| :--- | :--- | :--- | :--- |
| **macOS** | macOS 14.0 (Sonoma) or later | Apple Silicon (`arm64`) & Intel (`x86_64`) | None (Native App + ExtensionKit) |
| **Windows** | Windows 10 (1809+ / Build 17763) or Windows 11 | 64-bit (`x64`) | None (Self-contained .NET 8 & Windows App SDK) |

---

## Project Structure & Architecture

```
AuraLoop/
├── assets/                          # Shared branding, metadata, and media resources
│   ├── AppIcon.ico                  # Multi-resolution Windows application icon (16-256px)
│   ├── png/                         # High-resolution raster images & app icons
│   │   ├── icon.png
│   │   ├── icon-dark.png
│   │   └── dmg-background.png
│   ├── svg/                         # Scalable vector graphics and wordmarks
│   └── data/                        # Bundled catalog metadata & configuration files
│       └── FeaturedWallpapers.json
│
├── AuraLoop-Mac/                    # macOS Native Application (Swift 5.9 + SwiftUI)
│   ├── Package.swift                # Swift Package Manager manifest
│   ├── build-app.sh                 # Production compilation, signing & DMG builder
│   ├── version.sh                   # Version synchronization utility
│   ├── Icon/                        # macOS master icons and iconsets
│   ├── Sources/
│   │   ├── AuraLoopApp/             # Primary SwiftUI application (Views, Models, Controllers)
│   │   ├── AuraLoopKit/             # Shared framework (Aerials, Playback, Media, Engine)
│   │   └── AuraLoopWallpaperExtension/ # ExtensionKit desktop wallpaper service
│   └── Tests/                       # Comprehensive automated test suite (315+ unit tests)
│
├── AuraLoop-Win/                    # Windows Native Application (C# .NET 8 + WinUI 3)
│   ├── AuraLoop-Win.sln             # Visual Studio Solution
│   ├── AuraLoop-Win.csproj          # Windows App SDK project manifest (Single-File enabled)
│   ├── version.sh / version.cmd     # Windows version synchronization utilities
│   ├── Assets/                      # Embedded Windows application icons
│   ├── Installer/                   # Inno Setup wizard branding, images & installer script
│   ├── Native/                      # Win32 interop for WorkerW desktop injection
│   ├── Engine/                      # WallpaperEngine, PlaybackMonitor & DynamicSolarEngine
│   ├── Models/                      # Wallpaper, settings, and display geometry models
│   ├── Services/                    # Catalog, store, library, and settings services
│   ├── Views/                       # WinUI 3 Fluent Liquid Glass views (Home, Explore, Library, Settings)
│   └── Tests/                       # Automated xUnit test suite (18 unit tests)
│
├── .github/workflows/ci.yml         # Automated multi-platform CI/CD (DMG + Single-File EXE + Inno Setup)
├── LICENSE                          # Proprietary software license
└── README.md                        # Project documentation
```

---

## Internal Development & Verification (Authorized Maintainers Only)

> **Notice**: This software is **Proprietary & Closed Source**. Public or unauthorized compilation, redistribution, cloning, or usage is strictly forbidden.

### Building & Testing macOS (`AuraLoop-Mac`)

```bash
cd AuraLoop-Mac

# Run automated Swift test suite (315 tests):
swift test

# Build production Universal binary (.app) and signed disk image (.dmg):
./build-app.sh
./build-app.sh --dmg
```

### Building & Testing Windows (`AuraLoop-Win`)

```bash
cd AuraLoop-Win

# Run automated xUnit test suite:
dotnet test Tests/AuraLoop.Tests.csproj -c Release

# Publish self-contained single-file executable:
dotnet publish AuraLoop-Win.csproj -c Release -r win-x64 --self-contained true
```

---

## License & Ownership

**Copyright © 2026 Avdesh Jadon. All Rights Reserved.**

This software is strictly **Proprietary and Confidential**. All source code, design, artwork, trademarks, and associated materials are the exclusive property of Avdesh Jadon.

- **No Unauthorized Use**: Unauthorized copying, running, distribution, installation, or execution of this software—whether locally, on a server, or in any other environment—is strictly prohibited without prior express written permission from the copyright owner.
- **No Commercial Use**: Commercial exploitation, redistribution, sale, or sublicensing is strictly forbidden.
- **No Derivative Works**: Modification, adaptation, decompilation, or reverse engineering of any part of this software is prohibited.

For inquiries or written authorization, please contact [Avdesh Jadon](https://github.com/avdeshjadon).
