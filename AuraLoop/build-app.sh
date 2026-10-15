#!/bin/zsh
# Builds AuraLoop in release mode and assembles a proper AuraLoop.app bundle.
# Usage: ./build-app.sh [--install] [--dmg]
#   --install : also copy the bundle to /Applications (replacing any old one)
#   --dmg     : also build dist/AuraLoop-<version>.dmg (drag-to-Applications layout)
set -e

# The one place AuraLoop's version is written. The app bundle, the wallpaper
# extension and the DMG name are all derived from these two lines, and the
# build fails below if the app and the extension ever disagree.
VERSION="6.2.0"
BUILD="109"

DIR="$(cd "$(dirname "$0")" && pwd)"
APP="$DIR/dist/AuraLoop.app"

# Universal, so every Mac that can run macOS 14 gets a native slice rather
# than only Apple Silicon. Both slices are the same source compiled twice,
# which is why nothing else in the project has to know about Intel: every
# later change reaches both without a second thought. The wallpaper
# extension carries the same two architectures, set in its Xcode project.
echo "==> swift build -c release (universal: arm64 + x86_64)"
SWIFT_BUILD_FLAGS=(-c release --package-path "$DIR" --arch arm64 --arch x86_64)
swift build "${SWIFT_BUILD_FLAGS[@]}"

# Ask SwiftPM where it put the binary rather than assuming `.build/release`.
#
# That name is a symlink SwiftPM maintains, and a universal build does not
# write through it: it builds into `.build/apple/Products/Release` while the
# symlink can still point at a scratch path some earlier build used. On
# 2026-09-10 this shipped a two day old app on top of a freshly built
# extension, silently, with the build reporting success throughout. A stale
# binary is the one build failure that looks exactly like a working build, so
# the path is asked for and the copy is checked.
BIN_PATH="$(swift build "${SWIFT_BUILD_FLAGS[@]}" --show-bin-path)"
if [[ ! -f "$BIN_PATH/AuraLoop-app" ]]; then
    echo "ERROR: no AuraLoop-app in $BIN_PATH" >&2
    exit 1
fi

echo "==> assembling $APP"
rm -rf "$DIR/dist"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"

cp "$BIN_PATH/AuraLoop-app" "$APP/Contents/MacOS/AuraLoop"
# Takes a picture of an imported screen saver that carries none of its own,
# in a process of its own so a broken screen saver cannot crash AuraLoop.
if [[ ! -f "$BIN_PATH/AuraLoop-saver-picture" ]]; then
    echo "ERROR: no AuraLoop-saver-picture in $BIN_PATH" >&2
    exit 1
fi
cp "$BIN_PATH/AuraLoop-saver-picture" "$APP/Contents/MacOS/AuraLoop-saver-picture"

# macOS 26+ lock-screen renderer. Build it as a real ExtensionKit target so
# ExtensionFoundation installs the correct entry point and actor isolation.
# The private wallpaper framework is loaded only at runtime.
EXT="$APP/Contents/Extensions/AuraLoopWallpaperExtension.appex"
echo "==> building macOS 26+ wallpaper extension"
EXT_DERIVED="$DIR/.build/AuraLoop-wallpaper-extension"
xcodebuild \
    -project "$DIR/AuraLoopWallpaperExtension.xcodeproj" \
    -scheme AuraLoopWallpaperExtension \
    -configuration Release \
    -destination 'generic/platform=macOS' \
    -derivedDataPath "$EXT_DERIVED" \
    MARKETING_VERSION="$VERSION" \
    CURRENT_PROJECT_VERSION="$BUILD" \
    build
mkdir -p "$APP/Contents/Extensions"
cp -R "$EXT_DERIVED/Build/Products/Release/AuraLoopWallpaperExtension.appex" "$EXT"

# App icon: the Glass Moon (owner, 2026-10-03), an Icon Composer file with a
# light picture and, for the dark icon, the art alone on macOS's own dark tile
# (system-dark), the same tile Apple's dark icons sit on; a black tile of our
# own looked too black beside them (owner, 2026-10-04). actool turns it into
# Assets.car, from which macOS 26 and later draws the light or the dark icon in
# the Dock and Finder, following System Settings > Appearance > Icon & widget
# style like every other app, and AuraLoopIcon.icns, the light one, for older
# macOS. Inside the app the icon follows AuraLoop's own Appearance setting instead:
# the three pictures in Icon/InApp, read by AuraLoopAppIcon.swift.
echo "==> compiling the app icon"
ICON_OUT="$DIR/.build/app-icon"
rm -rf "$ICON_OUT"
mkdir -p "$ICON_OUT"
xcrun actool --compile "$ICON_OUT" --platform macosx --minimum-deployment-target 14.0 \
    --app-icon AuraLoopIcon --output-partial-info-plist "$ICON_OUT/partial.plist" \
    --target-device mac "$DIR/Icon/AuraLoopIcon.icon" > /dev/null
# actool once dropped dark artwork without a word, so the dark icon is
# checked for rather than assumed.
if ! xcrun assetutil --info "$ICON_OUT/Assets.car" | grep -q NSAppearanceNameDarkAqua; then
    echo "ERROR: the compiled app icon has no dark version" >&2
    exit 1
fi
cp "$ICON_OUT/Assets.car" "$ICON_OUT/AuraLoopIcon.icns" "$APP/Contents/Resources/"
cp "$DIR/Icon/InApp/AuraLoopIcon-Default.png" "$DIR/Icon/InApp/AuraLoopIcon-Light.png" \
    "$DIR/Icon/InApp/AuraLoopIcon-Dark.png" "$APP/Contents/Resources/"
cp "$DIR/../assets/"*.svg "$APP/Contents/Resources/" 2>/dev/null || true
cp "$DIR/THIRD_PARTY_NOTICES.md" "$APP/Contents/Resources/THIRD_PARTY_NOTICES.md"

# Bundled wallpaper: "Snowfall in Forest" full 4K master + thumb, so a fresh
# install always has one wallpaper playing in the hero (owner decision — 4K
# over DMG size). Sourced from the local library; the id must match
# BundledWallpaper.id in Sources/AuraLoopApp/BundledWallpaper.swift.
BUNDLED_ID="c0b0484f-80b9-40f3-bf02-03cd0886ba82"
# Overridable, because tying the build to the developer's personal library
# means the DMG cannot be built whenever that library is wiped or partial —
# e.g. right after a fresh-install test. Point AuraLoop_LIB at any folder holding
# Masters/<id>.mov + Thumbnails/<id>.jpg.
AuraLoop_LIB="${AuraLoop_LIB:-$HOME/Library/Application Support/AuraLoop}"
if [[ -f "$AuraLoop_LIB/Masters/$BUNDLED_ID.mov" && -f "$AuraLoop_LIB/Thumbnails/$BUNDLED_ID.jpg" ]]; then
    cp "$AuraLoop_LIB/Masters/$BUNDLED_ID.mov"    "$APP/Contents/Resources/BundledWallpaper.mov"
    cp "$AuraLoop_LIB/Thumbnails/$BUNDLED_ID.jpg" "$APP/Contents/Resources/BundledWallpaper.jpg"
else
    echo "Notice: bundled wallpaper $BUNDLED_ID not found in $AuraLoop_LIB; building without pre-bundled master."
fi

cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>            <string>AuraLoop</string>
    <key>CFBundleDisplayName</key>     <string>AuraLoop</string>
    <key>CFBundleExecutable</key>      <string>AuraLoop</string>
    <key>CFBundleIconFile</key>        <string>AuraLoopIcon</string>
    <key>CFBundleIconName</key>        <string>AuraLoopIcon</string>
    <key>CFBundleIdentifier</key>      <string>com.AvdeshJadon.AuraLoop</string>
    <key>CFBundleVersion</key>         <string>$BUILD</string>
    <key>CFBundleShortVersionString</key> <string>$VERSION</string>
    <key>CFBundlePackageType</key>     <string>APPL</string>
    <key>CFBundleInfoDictionaryVersion</key> <string>6.0</string>
    <key>LSMinimumSystemVersion</key>  <string>14.0</string>
    <key>NSHighResolutionCapable</key> <true/>
    <key>LSApplicationCategoryType</key> <string>public.app-category.entertainment</string>
    <key>NSHumanReadableCopyright</key> <string>Designed &amp; developed by AvdeshJadon</string>
</dict>
</plist>
PLIST

# A mismatched app and appex is the kind of thing nobody notices until an
# install refuses to load the extension, so check it here rather than hope.
EXT_VERSION=$(/usr/libexec/PlistBuddy -c 'Print CFBundleShortVersionString' "$EXT/Contents/Info.plist")
EXT_BUILD=$(/usr/libexec/PlistBuddy -c 'Print CFBundleVersion' "$EXT/Contents/Info.plist")
if [[ "$EXT_VERSION" != "$VERSION" || "$EXT_BUILD" != "$BUILD" ]]; then
    echo "ERROR: extension is $EXT_VERSION ($EXT_BUILD), app is $VERSION ($BUILD)" >&2
    exit 1
fi
echo "==> version $VERSION ($BUILD), app and extension agree"

echo "==> ad-hoc codesign"
codesign --force --sign - \
    --entitlements "$DIR/Sources/AuraLoopWallpaperExtension/AuraLoopWallpaperExtension.entitlements" \
    "$EXT"
codesign --force --sign - "$APP/Contents/MacOS/AuraLoop-saver-picture"
codesign --force --sign - "$APP"

for arg in "$@"; do
    case "$arg" in
    --install)
        echo "==> installing to /Applications"
        rm -rf /Applications/AuraLoop.app
        cp -R "$APP" /Applications/AuraLoop.app
        echo "==> installed: /Applications/AuraLoop.app"
        ;;
    --dmg)
        DMG="$DIR/dist/AuraLoop-$VERSION.dmg"
        STAGING="$DIR/dist/dmg-staging"
        BG_IMG="$DIR/assets/dmg-background.png"
        VOL_ICON="$DIR/Icon/AppIcon.icns"
        echo "==> building custom $DMG"
        rm -rf "$STAGING" "$DMG"
        mkdir -p "$STAGING"
        cp -R "$APP" "$STAGING/AuraLoop.app"

        if command -v create-dmg >/dev/null 2>&1; then
            echo "==> creating stylized installer DMG with create-dmg"
            create-dmg \
                --volname "AuraLoop" \
                --volicon "$VOL_ICON" \
                --background "$BG_IMG" \
                --window-pos 200 120 \
                --window-size 660 440 \
                --icon-size 128 \
                --text-size 13 \
                --icon "AuraLoop.app" 160 250 \
                --app-drop-link 500 250 \
                --hide-extension "AuraLoop.app" \
                --format UDZO \
                --filesystem HFS+ \
                --overwrite \
                "$DMG" \
                "$STAGING" || true
        else
            echo "Notice: create-dmg not installed, creating standard DMG with custom volume icon"
            ln -s /Applications "$STAGING/Applications"
            cp "$VOL_ICON" "$STAGING/.VolumeIcon.icns" 2>/dev/null || true
            mkdir -p "$STAGING/.background"
            cp "$BG_IMG" "$STAGING/.background/background.png" 2>/dev/null || true
            SetFile -c icnC "$STAGING/.VolumeIcon.icns" 2>/dev/null || true
            SetFile -a C "$STAGING" 2>/dev/null || true
            SetFile -a V "$STAGING/.VolumeIcon.icns" 2>/dev/null || true
            SetFile -a V "$STAGING/.background" 2>/dev/null || true
            hdiutil create -volname "AuraLoop" -srcfolder "$STAGING" -format UDZO -quiet "$DMG"
        fi
        rm -rf "$STAGING"
        echo "==> dmg: $DMG"
        ;;
    esac
done
if [[ $# -eq 0 ]]; then
    echo "==> done: $APP  (--install copies to /Applications, --dmg builds the disk image)"
fi
