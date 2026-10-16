#!/bin/bash
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
VERSION_FILE="$DIR/VERSION"
CSPROJ_FILE="$DIR/AuraLoop-Win/AuraLoop-Win.csproj"
SETTINGS_FILE="$DIR/AuraLoop-Win/Views/SettingsView.xaml"

# Helper for in-place sed across macOS BSD sed and Linux GNU sed
portable_sed() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "$1" "$2"
    else
        sed -i "$1" "$2"
    fi
}

# If arguments provided: ./version.sh <version> [build]
if [ -n "$1" ]; then
    NEW_VERSION="$1"
    if [ -n "$2" ]; then
        NEW_BUILD="$2"
    else
        if [ -f "$VERSION_FILE" ]; then
            source "$VERSION_FILE"
            NEW_BUILD=$((BUILD + 1))
        else
            NEW_BUILD=1
        fi
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
        echo "Example: ./version.sh 6.5.0 112"
        exit 1
    fi
fi

if [ -z "$NEW_VERSION" ] || [ -z "$NEW_BUILD" ]; then
    echo "Error: Version or build is empty!"
    exit 1
fi

echo "==> Updating AuraLoop-Win to Version: $NEW_VERSION (Build: $NEW_BUILD)"

# 1. Update VERSION file
cat > "$VERSION_FILE" <<EOF
VERSION=$NEW_VERSION
BUILD=$NEW_BUILD
EOF

# 2. Update AuraLoop-Win.csproj (<Version>, <AssemblyVersion>, <FileVersion>)
if [ -f "$CSPROJ_FILE" ]; then
    portable_sed "s|<Version>.*</Version>|<Version>$NEW_VERSION</Version>|" "$CSPROJ_FILE"
    portable_sed "s|<AssemblyVersion>.*</AssemblyVersion>|<AssemblyVersion>$NEW_VERSION.$NEW_BUILD</AssemblyVersion>|" "$CSPROJ_FILE"
    portable_sed "s|<FileVersion>.*</FileVersion>|<FileVersion>$NEW_VERSION.$NEW_BUILD</FileVersion>|" "$CSPROJ_FILE"
fi

# 3. Update SettingsView.xaml
if [ -f "$SETTINGS_FILE" ]; then
    portable_sed "s|Version [0-9.]* (Build [0-9]*)|Version $NEW_VERSION (Build $NEW_BUILD)|" "$SETTINGS_FILE"
fi

echo "✓ Successfully updated AuraLoop-Win to $NEW_VERSION (Build $NEW_BUILD) across all files!"
