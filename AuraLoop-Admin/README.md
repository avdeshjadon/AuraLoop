# AuraLoop Admin Dashboard

A state-of-the-art admin control center for **AuraLoop** 4K Live Wallpapers, designed to match the modern, minimalist Dribbble SaaS dashboard aesthetic with rich real-time Cloudflare R2 bucket management, live user tracking, and in-browser media processing.

## 🚀 Features

- **Exact Visual Design System**:
  - Crisp, modern SaaS aesthetic with rounded cards, pill navigation, subtle shadows, and vibrant orange accents (`#FF5B26`).
  - **Light & Dark Theme Toggle**: Sun / Moon switch pill in the sidebar with instant transition.
  - Left icon sidebar and top header bar with quick search, sync, and profile menu.

- **Ecosystem Overview Dashboard**:
  - **Active Users & Community Card**: Real-time counter of 12,480 active users (`+12% than last month`) with online (3,842) vs offline (8,638) breakdown.
  - **R2 Storage & Quota Limit**: Live progress bar tracking 35.1 GB / 100 GB R2 CDN storage.
  - **Featured Wallpapers**: Visual live preview cards with video playback modal.
  - **2x2 KPI Metric Cards**: Total Wallpapers (785 in orange gradient card), Active Users, Total Loops (84,210), and CDN Cache Hit Ratio (98.4%).
  - **Bandwidth & Downloads Bar Chart**: Dual-tone 12-month bar chart matching the reference screenshot.
  - **Recent Activities Table**: Searchable and filterable audit trail for uploads, deletions, renames, and user events.

- **Folders & CDN / R2 Bucket Manager**:
  - Direct folder browsing (`Abstract/`, `Anime/`, `Cars/`, `Nature/`, `Sci-fi/`, etc.).
  - **Drag & Drop**: Supports dropping individual video files as well as entire nested directory trees.
  - **File Operations**: Create new folder, rename videos, delete videos and folders.
  - **Mandatory Confirmation Modals**: Every single modifying or destructive action requires explicit confirmation via custom popup modals.

- **Client-Side Media Studio (4K Thumbnails & Compression)**:
  - **100% In-Browser 4K Frame Extractor**: Uses HTML5 video + Canvas to capture native resolution (3840x2160) thumbnails at any scrubbed timestamp. Works anywhere with zero server dependency or Vercel execution limits!
  - **Compression Engine**: Curated H.265/HEVC and H.264 presets with one-click terminal commands and automation scripts (`scripts/compress_wallpapers.mjs`).

- **User Management ("Users" tab)**:
  - Directory of 24,000+ accounts with search, filter, active/offline/suspended status toggles, and Pro Plan upgrades.

- **System Settings & R2 Connectivity**:
  - Configured with Cloudflare Account ID, R2 bucket (`auraloop-wallpapers`), and public CDN domain (`pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev`).
  - Live "Test Connection" API tester.

## 🛠️ Getting Started

```bash
cd AuraLoop-Admin
npm install
npm run dev
```

Open [http://localhost:5175](http://localhost:5175) to view the admin panel.
