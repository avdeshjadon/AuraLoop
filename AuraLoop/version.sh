#!/bin/bash
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
VERSION_FILE="$DIR/VERSION"

# If arguments provided: ./version.sh <version> [build]
if [ -n "$1" ]; then
    NEW_VERSION="$1"
    if [ -n "$2" ]; then
        NEW_BUILD="$2"
    else
        # Auto-increment current build number if not provided
        CURRENT_BUILD=$(grep '^BUILD=' "$DIR/build-app.sh" | cut -d'"' -f2)
        NEW_BUILD=$((CURRENT_BUILD + 1))
    fi
else
    # Read from VERSION file if exists
    if [ -f "$VERSION_FILE" ]; then
        # shellcheck disable=SC1090
        source "$VERSION_FILE"
        NEW_VERSION="$VERSION"
        NEW_BUILD="$BUILD"
    else
        echo "Usage: ./version.sh <version> [build]"
        echo "Example: ./version.sh 6.6.0 113"
        exit 1
    fi
fi

if [ -z "$NEW_VERSION" ] || [ -z "$NEW_BUILD" ]; then
    echo "Error: Version or build is empty!"
    exit 1
fi

echo "==> Updating AuraLoop to Version: $NEW_VERSION (Build: $NEW_BUILD)"

# 1. Update VERSION file
cat > "$VERSION_FILE" <<EOF
VERSION=$NEW_VERSION
BUILD=$NEW_BUILD
EOF

# Helper for in-place sed across macOS BSD sed and Linux GNU sed
portable_sed() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "$1" "$2"
    else
        sed -i "$1" "$2"
    fi
}

# 2. Update build-app.sh
portable_sed "s/^VERSION=\".*\"/VERSION=\"$NEW_VERSION\"/" "$DIR/build-app.sh"
portable_sed "s/^BUILD=\".*\"/BUILD=\"$NEW_BUILD\"/" "$DIR/build-app.sh"

# 3. Update WhatsNewView.swift
WHATSNEW_FILE="$DIR/Sources/AuraLoopApp/Views/WhatsNewView.swift"
if [ -f "$WHATSNEW_FILE" ]; then
    portable_sed "s/version: \".*\"/version: \"$NEW_VERSION\"/" "$WHATSNEW_FILE"
fi

echo "✓ Successfully updated AuraLoop to $NEW_VERSION ($NEW_BUILD) across all files!"
