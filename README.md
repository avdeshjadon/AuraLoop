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

### High-Performance Native Live Wallpapers & Screensavers for macOS

[![macOS](https://img.shields.io/badge/macOS-14%2B-black?logo=apple)](https://apple.com/macos)
[![Universal](https://img.shields.io/badge/Universal-Apple_Silicon_%2B_Intel-black?logo=apple)](https://apple.com)
[![Status](https://img.shields.io/badge/Source-Proprietary%20%2F%20Closed-critical)](#license)
[![License](https://img.shields.io/badge/License-All_Rights_Reserved-red)](LICENSE)
[![Swift](https://img.shields.io/badge/Swift-5.9%2B-FA7343?logo=swift&logoColor=white)](https://swift.org)

</div>

---

## Overview

AuraLoop is a native macOS application engineered in Swift and SwiftUI that delivers smooth, looping video wallpapers and screen savers across all connected displays with near-zero CPU and memory footprint. By delegating video decoding directly to macOS hardware media engines, AuraLoop keeps system resource consumption minimal and automatically pauses during fullscreen apps, low power mode, or display sleep.

---

## Key Features

- **Seamless Video Wallpapers** — Smooth, continuous looping on every connected display simultaneously.
- **Lock Screen Support** — Play distinct or synchronized live wallpapers on your macOS lock screen.
- **Screen Saver Engine** — Run high-definition live video as your native macOS screen saver with customizable idle delays.
- **Curated Apple Aerials** — Browse and enjoy Apple's Aerials, Dynamic Wallpapers, and system aerial screen savers in 4K.
- **Hardware-Accelerated Efficiency** — Hardware-decoded HEVC/H.265 playback via AVFoundation ensures virtually zero CPU overhead.
- **Smart Power Management** — Automatically pauses during fullscreen applications, display sleep, low power mode, and battery thresholds.
- **Desktop Awareness** — Option to pause during active work and resume playback when the desktop is revealed.
- **Adaptive Frame Rates** — Switch between native high frame rate and energy-efficient 30 fps per wallpaper.
- **Explore & Preview Catalog** — Fullscreen interactive preview with on-demand download management.
- **Custom Playlists & Automation** — Timed rotations, randomized shuffling, and full 24-hour day/night schedules.
- **Universal Importer** — Drag-and-drop support for custom video files (auto-transcoded to optimized HEVC) and `.saver` bundles.
- **Menu Bar Controller** — Instant playback control, track skipping, and preset selection from the system menu bar.

> **System Requirements**: macOS 14.0 (Sonoma) or newer. Universal binary compiled for Apple Silicon and Intel architectures. Lock screen and screen saver features require macOS 15 / 26+.

---

## Project Structure & Architecture

The codebase follows a strictly organized, multi-platform architecture:

```
AuraLoop/
├── assets/                          # Shared branding and media assets
│   ├── png/                         # High-resolution raster images & app icons
│   │   ├── icon.png
│   │   ├── icon-dark.png
│   │   └── dmg-background.png
│   ├── svg/                         # Scalable vector graphics and wordmarks
│   │   ├── auraloop.svg
│   │   ├── auraloop-dark.svg
│   │   ├── auraloop-wordmark.svg
│   │   └── auraloop-wordmark-dark.svg
│   └── data/                        # Bundled catalog metadata & configurations
│       └── FeaturedWallpapers.json
│
├── AuraLoop-Mac/                    # macOS Native Application (Swift 5.9 + SwiftUI)
│   ├── Package.swift                # Swift Package Manager manifest
│   ├── build-app.sh                 # Production compilation, signing & DMG builder
│   ├── Icon/                        # macOS iconsets and icon generation
│   ├── Sources/
│   │   ├── AuraLoopApp/             # Primary SwiftUI application (Views, Models, Controllers)
│   │   ├── AuraLoopKit/             # Shared framework (Aerials, Playback, Media, Engine)
│   │   └── AuraLoopWallpaperExtension/ # System wallpaper app extension
│   └── Tests/                       # Comprehensive unit test suite (315+ automated tests)
│
├── AuraLoop-Win/                    # Windows Native Application (C# .NET 8 + WinUI 3)
│   ├── AuraLoop-Win.sln             # Visual Studio Solution
│   ├── build.cmd                    # Automated Windows build script
│   └── AuraLoop-Win/
│       ├── AuraLoop-Win.csproj      # Windows App SDK project manifest
│       ├── Native/                  # Win32 interop for WorkerW desktop injection
│       ├── Engine/                  # WallpaperEngine & auto-pause PlaybackMonitor
│       ├── Models/                  # Wallpaper and settings data models
│       ├── Services/                # Catalog, storage and settings services
│       └── Views/                   # WinUI 3 Liquid Glass views (Home, Explore, Library, Settings)
│
├── LICENSE                          # Proprietary software license
└── README.md                        # Documentation
```

---

## Development & Build Guide (Authorized / Internal Only)

> **Notice**: This software is **Proprietary & Closed Source**. Public or unauthorized compilation, redistribution, cloning, or usage is strictly forbidden. The instructions below are provided exclusively for authorized maintainers.

### macOS (AuraLoop-Mac)

```bash
cd AuraLoop-Mac
swift build
swift test
./build-app.sh
./build-app.sh --dmg
```

### Windows (AuraLoop-Win)

```cmd
cd AuraLoop-Win
build.cmd
```
or via PowerShell:
```powershell
dotnet build AuraLoop-Win/AuraLoop-Win.csproj -c Release
```

The compiled macOS application bundle will be created at `AuraLoop-Mac/dist/AuraLoop.app` and the standalone installer at `AuraLoop-Mac/dist/AuraLoop-*.dmg`.

---

## License

**Copyright © 2026 Avdesh Jadon. All Rights Reserved.**

This software is strictly **Proprietary and Confidential**. All source code, design, artwork, trademarks, and associated materials are the exclusive property of Avdesh Jadon.

- **No Unauthorized Use**: Unauthorized copying, running, distribution, installation, or execution of this software—whether locally, on a server, or in any other environment—is strictly prohibited without prior express written permission from the copyright owner.
- **No Commercial Use**: Commercial exploitation, redistribution, sale, or sublicensing is strictly forbidden.
- **No Derivative Works**: Modification, adaptation, decompilation, or reverse engineering of any part of this software is prohibited.

For licensing inquiries or written authorization, please contact [Avdesh Jadon](https://github.com/avdeshjadon).
