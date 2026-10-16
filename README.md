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
[![Swift](https://img.shields.io/badge/Swift-5.9%2B-FA7343?logo=swift&logoColor=white)](https://swift.org)
[![Status](https://img.shields.io/badge/Source-Proprietary%20%2F%20Closed-critical)](#license)
[![License](https://img.shields.io/badge/License-All_Rights_Reserved-red)](#license)
[![Release](https://img.shields.io/github/v/release/avdeshjadon/AuraLoop?color=success&label=Release)](https://github.com/avdeshjadon/AuraLoop/releases)

</div>

---

## Overview

**AuraLoop** is a native macOS application engineered in Swift and SwiftUI that delivers smooth, looping video wallpapers and screen savers across all connected displays with near-zero CPU and memory footprint. 

By delegating video decoding directly to macOS hardware media engines via AVFoundation, AuraLoop keeps system resource consumption minimal and automatically pauses during fullscreen apps, low power mode, or display sleep.

---

## Downloads & Installation

Pre-compiled, production-ready disk images are available on the [Releases](https://github.com/avdeshjadon/AuraLoop/releases) page:

* **`AuraLoop-6.6.0.dmg`** — Drag-and-drop installer disk image. Universal binary compiled natively for both **Apple Silicon (M1/M2/M3/M4)** and **Intel** Macs.
  * *Installation:* Open the `.dmg`, drag `AuraLoop.app` to your `/Applications` folder, and launch from Spotlight or Launchpad.

---

## Key Features

- **Multi-Monitor Live Video Wallpapers** — Smooth, continuous playback spanning single or multiple displays with individual or synchronized configurations.
- **Lock Screen & Screen Saver Synchronization** — Display matching high-definition stills and videos on macOS lock screens and native screen savers via ExtensionKit.
- **Hardware-Decoded Efficiency** — Zero-copy GPU decoding (HEVC/H.265 & VP9) via AVFoundation ensures negligible CPU impact and whisper-quiet operation.
- **Intelligent Power & Resource Monitor** — Automatically pauses playback when applications run fullscreen, when the desktop is occluded, on low power mode, or battery thresholds.
- **Curated 4K Apple Aerials** — Browse and download the complete catalog of Apple Aerial videos, landscape flyovers, underwater captures, and cosmic footage.
- **Dynamic Solar Engine** — Calculate astronomical solar elevation and automatically transition through 24-hour day/twilight/night dynamic keyframes.
- **Universal Importer** — Drag and drop your own MP4, MOV, or animated wallpaper files directly into your personal offline library with automatic hardware transcoding.
- **Menu Bar Controls** — Instant playback pausing, track changing, playlist shuffling, and settings management from the system menu bar.

---

## System Requirements

| Platform | Minimum OS Version | Architecture | Required Frameworks |
| :--- | :--- | :--- | :--- |
| **macOS** | macOS 14.0 (Sonoma) or later | Apple Silicon (`arm64`) & Intel (`x86_64`) | None (Native App + ExtensionKit) |

*Note: Lock screen and ExtensionKit wallpaper features require macOS 15 / macOS 26+.*

---

## Project Structure & Architecture

The codebase follows a strictly organized, modular architecture:

```
AuraLoop/
├── assets/                          # Shared branding, metadata, and media resources
│   ├── png/                         # High-resolution raster images & app icons
│   │   ├── icon.png
│   │   ├── icon-dark.png
│   │   └── dmg-background.png
│   ├── svg/                         # Scalable vector graphics and wordmarks
│   │   ├── auraloop.svg
│   │   ├── auraloop-dark.svg
│   │   ├── auraloop-wordmark.svg
│   │   └── auraloop-wordmark-dark.svg
│   └── data/                        # Bundled catalog metadata & configuration files
│       └── FeaturedWallpapers.json
│
├── AuraLoop/                        # macOS Application Package & Core Modules
│   ├── Package.swift                # Swift Package Manager manifest
│   ├── build-app.sh                 # Production compilation, signing & DMG builder
│   ├── version.sh                   # Version synchronization utility
│   ├── VERSION                      # Single source of truth for version & build numbers
│   │
│   ├── Icon/                        # macOS iconsets and icon generation
│   │   ├── AuraLoopIcon.icon/       # Asset catalogs for macOS icon compiler (actool)
│   │   ├── InApp/                   # Multi-theme in-app icon variations
│   │   └── AppIcon.icns             # Standalone system application icon
│   │
│   ├── Sources/
│   │   ├── AuraLoopApp/             # Primary SwiftUI application
│   │   │   ├── AuraLoopApp.swift    # Application entry point & lifecycle
│   │   │   ├── Views/               # Screen layouts (Home, Explore, Library, Settings)
│   │   │   ├── Components/          # Design system, Liquid Glass UI, and controls
│   │   │   ├── Icons/               # Vector glyphs, status symbols, and branding marks
│   │   │   ├── Controllers/         # Menu bar, lock screen, and system observers
│   │   │   └── Models/              # Data stores, playback states, and cache engines
│   │   │
│   │   ├── AuraLoopKit/             # Shared framework & domain logic
│   │   │   ├── Core/                # Versioning, release metadata, and catalog parsers
│   │   │   ├── Aerials/             # Apple aerial catalogs and system store bindings
│   │   │   ├── Library/             # Wallpaper manifest, playlist manager, and importers
│   │   │   ├── Playback/            # Multi-monitor rendering logic and schedule rules
│   │   │   ├── Media/               # Hardware transcoders, thumbnailers, and preview cache
│   │   │   └── Engine/              # Desktop window monitors and hardware playback engine
│   │   │
│   │   ├── AuraLoopWallpaperExtension/ # System wallpaper ExtensionKit service
│   │   ├── AuraLoopEngine/          # Background helper process
│   │   ├── AuraLoopImport/          # CLI utility for batch importing video files
│   │   ├── AuraLoopSet/             # CLI utility for setting wallpaper/screensaver
│   │   ├── AuraLoopPrepare/         # Video asset optimization and pre-processing
│   │   ├── AuraLoopPublish/         # Cloudflare R2 / CDN catalog publisher
│   │   └── AuraLoopSaverPicture/    # Screensaver capture utility
│   │
│   └── Tests/                       # Comprehensive automated test suite
│       └── AuraLoopKitTests/        # 315+ automated unit test cases
│
├── .github/workflows/ci.yml         # Automated macOS CI/CD & DMG Release pipeline
├── LICENSE                          # Proprietary software license
└── README.md                        # Project documentation
```

---

## Internal Development & Verification (Authorized Maintainers Only)

> **Notice**: This software is **Proprietary & Closed Source**. Public or unauthorized compilation, redistribution, cloning, or usage is strictly forbidden.

### Prerequisites

- macOS 14.0 or newer
- Xcode 15+ / Command Line Tools with Swift 5.9+

### Build & Run Tests

```bash
cd AuraLoop

# Run automated Swift test suite (315 tests):
swift test

# Build debug binaries:
swift build
```

### Packaging Application & Installer DMG

```bash
cd AuraLoop

# Build standalone Universal application bundle:
./build-app.sh

# Build release application bundle and signed DMG:
./build-app.sh --dmg
```

The compiled application bundle will be created at `AuraLoop/dist/AuraLoop.app` and the standalone installer at `AuraLoop/dist/AuraLoop-*.dmg`.

---

## License & Ownership

**Copyright © 2026 Avdesh Jadon. All Rights Reserved.**

This software is strictly **Proprietary and Confidential**. All source code, design, artwork, trademarks, and associated materials are the exclusive property of Avdesh Jadon.

- **No Unauthorized Use**: Unauthorized copying, running, distribution, installation, or execution of this software—whether locally, on a server, or in any other environment—is strictly prohibited without prior express written permission from the copyright owner.
- **No Commercial Use**: Commercial exploitation, redistribution, sale, or sublicensing is strictly forbidden.
- **No Derivative Works**: Modification, adaptation, decompilation, or reverse engineering of any part of this software is prohibited.

For licensing inquiries or written authorization, please contact [Avdesh Jadon](https://github.com/avdeshjadon).
