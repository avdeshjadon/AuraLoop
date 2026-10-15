# Security Policy

## Supported versions

| Version | Supported     |
| ------- | ------------- |
| 6.0.x   | Yes           |
| < 6.0   | Please update |

Only the latest release receives security fixes. Updates are published on the
[Releases](https://github.com/avdeshjadon/AuraLoop/releases) page.

## Reporting a vulnerability

Please do not publish vulnerability details in a public issue.

Use GitHub's private reporting page:
[Report a vulnerability](https://github.com/avdeshjadon/AuraLoop/security/advisories/new)

If private reporting is unavailable, open a normal issue asking to be contacted
privately, without including details of the vulnerability.

AuraLoop is maintained by one person. The target is an initial reply within 7 days
and a fix, mitigation, or clear response within 30 days for a confirmed issue.
Credit will be given in the release notes unless you prefer otherwise.

## What AuraLoop can and cannot do

AuraLoop is a native macOS live-wallpaper app. This section documents the access it
uses so that you can make an informed decision before installing it.

### Permissions and system access

The current app does not request microphone, camera, Screen Recording,
Accessibility, Full Disk Access, or administrator permission. It does not run
as root.

The main app is signed with no entitlements and is not sandboxed. The embedded
wallpaper extension's only declared entitlement is the App Sandbox entitlement.
The main app uses normal user-level access to:

- Show wallpaper windows on connected displays
- Read videos that you explicitly choose to import
- Store downloaded wallpapers, imported videos, preferences, and playlists
- Observe display sleep, screen lock, its wallpaper windows' visibility, and
  power state
- Register AuraLoop as a login item only when you enable **Launch at Login**
- Set your Mac's screen saver, and how long it waits, when you ask it to
- Copy screen savers you import into `~/Library/Screen Savers`, and move ones you
  delete from there to the Trash
- Keep your downloaded wallpapers in a folder you choose, when you set
  **Download Folder**
- Set Apple's still pictures, its drawn wallpapers and your own screen savers
  through macOS's wallpaper store, when you pick one
- Read the position, size, layer and opacity of on-screen windows, never their
  names or contents, and only while **Play only on desktop** or **Replay on
  Clear Desktop** is on

Imported videos stay on your Mac and are not uploaded.

While AuraLoop's menu-bar panel is open, it temporarily observes global left-click
and right-click events so it can close the panel when you click elsewhere. It
handles the Escape key locally. It does not record or upload those events.

### Windows on your screen

Since 5.0, **Play only on desktop** and **Replay on Clear Desktop** need to know
whether a window is open on each screen. While either is on, AuraLoop asks macOS for
the window list about twice a second, and again straight after a click, an app
switch, a hide, a launch, a quit or a Space change. It reads each window's
position, size, layer and opacity, which macOS gives any app without a
permission prompt, and it never reads window titles or contents. AuraLoop has no
Screen Recording permission, so macOS does not hand it titles at all.

For the same reason, AuraLoop observes global mouse-up events while either switch is
on: a click is the earliest sign that a window is about to open, close or
minimise. Only the fact that a click happened is used, never where it landed or
on what, and key events are never observed. Nothing here is stored or uploaded,
and with both switches off, which is the default, none of it runs.

### Desktop picture

AuraLoop plays video in its own window seated under the desktop icons, which macOS
knows nothing about. So the desktop picture underneath stayed whatever it had
been, and quitting AuraLoop left you looking at a picture you replaced weeks ago,
or at nothing at all.

AuraLoop sets your desktop picture to a still frame of the wallpaper it is playing,
per display, and keeps it in step with every playlist and automation step. The
frames live in `~/Library/Application Support/AuraLoop/DesktopStills`.

This started on macOS 15 and earlier, where the menu bar takes its colour from
the desktop picture and was sampling the wrong image. It runs on every version
now, because a Mac with no picture behind the video has a black desktop the
moment AuraLoop is not running.

Your own desktop picture is read and recorded in
`~/Library/Application Support/AuraLoop/desktop-tint.json` before anything is
written, and put back when the wallpaper is removed. AuraLoop restores only its own
change: if you pick a new picture yourself in System Settings, that is your
choice and AuraLoop leaves it alone. It also skips any display whose wallpaper is
being driven by AuraLoop's lock-screen extension.

This is disclosed because the desktop picture is state outside AuraLoop's own data
directories.

### Quarantine removal on AuraLoop's own bundle

Since 3.0, AuraLoop removes the `com.apple.quarantine` extended attribute from its
own application bundle and the wallpaper extension inside it. It does this at
launch, and again before registering the extension, and only when the attribute
is actually present.

This is disclosed because it changes state outside AuraLoop's own data directories.
The reason: a DMG downloaded through a browser is quarantined, the flag is
inherited by the embedded extension, and macOS then refuses to load that
extension, so lock-screen wallpapers silently fail to apply. AuraLoop is not
sandboxed, so it can clear the flag on itself.

The scope is deliberately narrow. AuraLoop only ever touches paths inside its own
bundle, only that one attribute, and it removes rather than adds. It does not
alter Gatekeeper settings, system policy, or any other application. Removing
the attribute does not bypass the first-launch approval you already gave; it
only stops macOS treating the already-approved bundle's inner components as
untrusted downloads.

If macOS is running AuraLoop from a translocated read-only copy (Gatekeeper path
randomisation, which happens when an app is opened from inside a DMG rather
than from Applications), AuraLoop detects that, changes nothing, and tells you to
move it to Applications.

### Lock-screen integration

On macOS 26 or newer, AuraLoop can register its bundled, sandboxed wallpaper
extension. When you apply a lock-screen wallpaper, the main app:

- Copies the selected video and thumbnail into the extension's local container.
  A playlist or automation hard links each step's video there instead, so a
  step takes no extra disk space; a wallpaper kept on another drive is copied
- Backs up and updates the user-level macOS wallpaper stores, `Index.plist` and
  `Index2.plist`
- Registers the extension with `pluginkit`
- Restarts Apple's `WallpaperAgent` so the change takes effect

AuraLoop attempts to restore the previous wallpaper settings if applying fails and
when you remove its lock-screen wallpaper.

Since 6.0, AuraLoop also handles Macs set to **Use Screen Saver: Automatic** in
System Settings, Wallpaper, Screen Saver, which is how a new Mac starts. There
macOS keeps one wallpaper for the desktop, the lock screen and the screen saver.
Before AuraLoop sets one of those places on such a Mac, it switches it to **Custom**
in the same stores, keeping what is on screen, so each place keeps its own
wallpaper. AuraLoop does not switch it back to Automatic.

The extension also answers macOS when it asks what the lock wallpaper looks
like as a still picture. macOS keeps that picture on the Preboot volume and
draws it on the login screen, before anything of AuraLoop's is running. The image
is a frame of the wallpaper you chose and nothing else; AuraLoop hands it over and
macOS decides where it is stored. Answering was added because refusing left the
login screen showing a picture from whatever wallpaper had last been exported
successfully, which could be months old.

This feature depends on private macOS wallpaper interfaces, including
`WallpaperExtensionKit` and runtime-only wallpaper types. Apple can change these
interfaces without notice, so future macOS releases may require compatibility
fixes.

### Screen saver

Since 5.0, AuraLoop can be your screen saver as well as your desktop and lock
screen. macOS keeps all three in the same user-level wallpaper stores, and it
files the screen saver under a role it calls `idle`, so applying one writes the
same `Index.plist` and `Index2.plist` described above and takes the same backups
first. The screen saver is one setting for the whole Mac rather than one per
display, because macOS has no per-display screen saver.

AuraLoop checks at launch that it still holds the screen saver it recorded, and puts
it back if macOS has given it to something else. That check exists because
replacing **AuraLoop.app** while AuraLoop is running makes macOS drop the wallpaper
extension and hand the screen saver to Apple's aerials, and macOS does not hand
it back on its own.

Settings has a **Start Screen Saver** row that sets how long your Mac waits
before the screen saver begins. It writes the key `idleTime` in the
`com.apple.screensaver` preferences domain, for the current user and the current
host, which is the single place macOS keeps that setting and the same place
System Settings writes it. This is disclosed because that preference is state
outside AuraLoop's own data directories. AuraLoop writes only that one key, only when
you change that row, and it writes **Never** as `0`, which is how macOS itself
records it. No other key, domain, user or host is touched, and nothing is read
from or written to the preference unless you open Settings.

### Apple section

Since 6.0, the Apple section lists Apple's aerials, Dynamic Wallpapers and
screen savers. To build that list AuraLoop reads Apple's own catalogues on your Mac,
in `/Library/Application Support/com.apple.idleassetsd/Customer`,
`/System/Library/Desktop Pictures`, `/System/Library/AssetsV2`,
`/System/Library/Wallpapers` and `/System/Library/ExtensionKit/Extensions`, and
the screen savers in `/Library/Screen Savers` and `~/Library/Screen Savers`. It
only reads these folders and never writes into them. An aerial macOS has already
downloaded is played from where it is.

Aerials and still pictures download from Apple's servers, at the addresses
those catalogues give, and only when you choose **Download**, **Preview** or
**Set Wallpaper**. Before that, an aerial's card picture is read from Apple's
server: the video's index and one frame, never the whole file. The card pictures
of still pictures, drawn wallpapers and screen savers come from
`cdn.AuraLoopwallpaper.com`, and so do Apple's eight screen savers, which are AuraLoop's
own 4K recordings.

Still pictures and drawn wallpapers can only be shown by macOS, so
**Set Wallpaper** writes them into the user-level wallpaper stores described
under Lock-screen integration, as the same record System Settings writes. AuraLoop
keeps a list of what it set in
`~/Library/Application Support/AuraLoop/macos-wallpapers.json`, so **Remove** can
give the place back. Downloaded aerials and still pictures are kept beside your
other wallpapers, so they follow **Download Folder**.

### Screen savers you import

Since 6.0, the Library's import bar takes `.saver` screen savers, such as
XScreenSaver. AuraLoop copies the one you choose into `~/Library/Screen Savers`,
where macOS looks for screen savers, and leaves your original where it was.
Deleting one from the Library moves it to the Trash, as System Settings does.
Only screen savers in your own `~/Library/Screen Savers` can be deleted from
AuraLoop.

A `.saver` is code written by someone else, and AuraLoop never loads one into
itself. When an imported screen saver has no picture of its own, AuraLoop runs it
for about 20 seconds in a separate helper process, `AuraLoop-saver-picture`, in a
hidden window off every screen, and keeps one frame as its card picture in
`~/Library/Caches/AuraLoop/AppleAerials`. A screen saver that crashes or hangs takes
only the helper down. The helper is not sandboxed, and macOS runs the same code
whenever that screen saver is in use, so only import screen savers you trust.

### Download Folder

Since 6.0, Settings has a **Download Folder** row. If you choose a folder, AuraLoop
moves your downloaded wallpapers into a folder called `AuraLoop Wallpapers` inside
it, marks that folder with a small hidden `.AuraLoop-wallpapers` file so it is never
mistaken for someone else's, and puts a symbolic link to it in place of
`~/Library/Application Support/AuraLoop/Masters`. **Default** moves them back.

This is disclosed because that folder is outside AuraLoop's own data directories.
Uninstalling AuraLoop does not remove it: delete `AuraLoop Wallpapers` yourself if you
no longer want the videos.

### Network access

With its default catalog, the current app makes unauthenticated HTTPS requests
to:

- `cdn.AuraLoopwallpaper.com`, AuraLoop's own domain in front of Cloudflare R2, for the
  wallpaper catalog, thumbnails, previews, and wallpaper downloads, and since
  6.0 the Apple section's card pictures and its 4K screen saver recordings
- GitHub's Releases API to check for a newer AuraLoop version
- Since 6.0, Apple's own servers, only for the Apple section: an aerial's index
  and one frame for its card, and the aerials and still pictures you choose to
  download

Before 4.0 those requests went to a shared `pub-<id>.r2.dev` address. That
hostname is common to every Cloudflare R2 bucket, so networks that block it
block all of them at once, and Explore arrived empty for the people behind such
a filter. The old address still answers, so copies of AuraLoop older than 4.0 keep
working.

The catalog URL can be changed through macOS preferences. A custom catalog can
therefore provide wallpaper URLs on different hosts.

The catalog is checked when AuraLoop launches and when it returns to the foreground.
The update check runs at launch, when AuraLoop returns to the foreground and at
most once every six hours, and when you press **Check for Updates**. Since 3.0
it also reads the latest release's notes and asset list so **What's New** can
show what changed and offer the download.
Visible catalog thumbnails load automatically. An available preview downloads
for an undownloaded item the first time you open it or after its cached copy has
been removed. The full video downloads only when you choose **Preview** or
**Download**. AuraLoop does not install updates. When one is available, its
**Download** button opens the disk image from that GitHub release in your
browser, or the release page if that release has no disk image. You install it
yourself.

Cloudflare, GitHub and, when you use the Apple section, Apple receive normal
connection information such as your IP address. AuraLoop has no account system,
advertising, analytics, telemetry, or third-party crash-reporting service. It
sends no separate telemetry payload and does not intentionally upload imported
video contents, preferences, or diagnostic logs.

### Data stored on your Mac

AuraLoop stores local data in:

- `~/Library/Application Support/AuraLoop` for downloaded and imported wallpapers,
  thumbnails, configuration, playlists, lock-screen state, and wallpaper-store
  backups
- `~/Library/Caches/AuraLoop/Previews` for a preview cache capped at 200 MB
- `~/Library/Caches/AuraLoop/Thumbnails` for catalog thumbnails, kept so each loads
  only once
- `~/Library/Caches/AuraLoop/AppleAerials` for the Apple section's card pictures and
  the details read about each aerial
- `~/Library/Caches/AuraLoop/Share` for at most one hard link to the wallpaper you
  last shared, emptied at launch
- The folder you choose with **Download Folder**, if you choose one
- The `com.AvdeshJadon.AuraLoop` preferences domain for interface and catalog settings
- The wallpaper extension's container for staged lock-screen files and its
  local diagnostic log
- `~/Library/Application Support/AuraLoop/lockscreen-diagnostics.log`, written on
  every lock-screen apply

The extension log records technical lifecycle events such as process IDs,
wallpaper and display identifiers, requested dimensions, and errors. Since 3.0
it is size-capped rather than growing without limit.

The lock-screen diagnostics log records the macOS version, the wallpaper and
target identifiers, whether the extension was registered, whether the wallpaper
stores kept the change, and whether macOS acknowledged it. It exists so a
failure report can be answered. Since 4.0 it is written on every apply rather
than only on a failure, because an apply that reported success and did nothing
used to leave no record at all. It is capped at 32 KB and, like the extension
log, contains no video contents and is never uploaded.

The extension also writes a small `acquire-receipt.json` inside its own
container, holding the identifier of the wallpaper macOS last asked it for, the
time, and whether a frame was drawn. AuraLoop reads it to tell an apply that macOS
genuinely collected apart from one it only wrote down. It is a single record,
overwritten each time, and is never uploaded.

### Dependencies and release contents

The Swift package has no external package dependencies and otherwise uses Apple
system frameworks. Parts of the wallpaper extension are derived from the
MIT-licensed Phosphene project and are documented in
[`AuraLoop/THIRD_PARTY_NOTICES.md`](AuraLoop/THIRD_PARTY_NOTICES.md).

The source tree includes developer command-line tools for preparing and
publishing wallpapers. Those tools and the developer's Cloudflare credentials
are not included in the released **AuraLoop.app**.

## Verifying or building AuraLoop

You can inspect and compile the tagged source:

```bash
git clone https://github.com/avdeshjadon/AuraLoop.git
cd AuraLoop
git checkout v6.0.2
swift build -c release --package-path AuraLoop
```

You can verify the current app bundle's internal code seal:

```bash
codesign --verify --deep --strict --verbose=2 "/Applications/AuraLoop.app"
```

AuraLoop uses an ad-hoc signature. Anyone can modify and ad-hoc sign another copy,
so this check does not establish provenance or an Apple Developer ID identity.
Building the complete app and DMG also requires Xcode and the bundled wallpaper
assets expected by `AuraLoop/build-app.sh`.

## Known security-relevant limitations

- Releases are ad-hoc signed and are not notarized by Apple.
- Hardened Runtime is not enabled.
- Release builds are created manually and are not reproduced through CI.
- The main app is not sandboxed.
- Lock-screen support depends on private macOS interfaces.
- The Apple section reads Apple's own catalogues and writes Apple's own
  wallpaper records, which Apple can change without notice.
- Imported `.saver` screen savers are third-party code: macOS runs them as your
  screen saver, and AuraLoop's picture helper runs them briefly, without a sandbox.
- AuraLoop trusts the URLs and metadata supplied by the default HTTPS catalog.
  The catalog and wallpaper assets have no separate cryptographic signatures,
  hashes, or host pinning.
- A failed lock-screen operation could temporarily change wallpaper settings,
  although AuraLoop keeps backups and attempts rollback.
