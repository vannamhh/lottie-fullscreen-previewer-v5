#!/usr/bin/env bash
#
# Everything the Tauri bundler cannot express, applied to a built .app:
#
#   QuickLookExtension.appex  — the Space-bar preview panel
#   ThumbnailExtension.appex  — Finder icon thumbnails (off by default, see below)
#   lottie-document.icns      — the Finder icon for .lottie files
#
# Each of these edits the bundle, which invalidates its signature, so the app is
# always re-signed at the end.
#
# Usage: scripts/postbuild-macos.sh [path/to/Some.app]

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP="${1:-$ROOT/src-tauri/target/release/bundle/macos/Lottie Previewer.app}"

PLUGINS="$APP/Contents/PlugIns"
WEB_DIR="$ROOT/dist-quicklook"
VERSION="$(node -p "require('$ROOT/src-tauri/tauri.conf.json').version")"

if [[ ! -d "$APP" ]]; then
  echo "error: app bundle not found at: $APP" >&2
  echo "       run 'npm run app:build' first, or pass the path as an argument." >&2
  exit 1
fi

# --- 1. preview page (shared by both extensions) ---------------------------
echo "==> building preview page"
(cd "$ROOT" && npx vite build --config vite.quicklook.config.ts)

for asset in preview.html preview.js; do
  if [[ ! -f "$WEB_DIR/$asset" ]]; then
    echo "error: expected $WEB_DIR/$asset after the vite build" >&2
    exit 1
  fi
done

# --- 2. build each extension ----------------------------------------------
# An .appex entry point is _NSExtensionMain rather than main(); -application_extension
# holds us to the API subset extensions are allowed to use.
build_appex() {
  local name="$1" source="$2" plist="$3" entitlements="$4" frameworks="$5"
  local appex="$PLUGINS/$name.appex"

  echo "==> building $name ($(uname -m))"
  rm -rf "$appex"
  mkdir -p "$appex/Contents/MacOS" "$appex/Contents/Resources"

  # shellcheck disable=SC2086 # frameworks is an intentional multi-flag string
  swiftc \
    -target "$(uname -m)-apple-macos11.0" \
    -parse-as-library \
    -O \
    -module-name "$name" \
    $frameworks \
    -Xlinker -e -Xlinker _NSExtensionMain \
    -Xlinker -application_extension \
    -o "$appex/Contents/MacOS/$name" \
    "$ROOT/quicklook/$source"

  cp "$ROOT/quicklook/$plist" "$appex/Contents/Info.plist"
  # Single source of truth for the version, so an extension can never claim a
  # different one from the app that hosts it.
  plutil -replace CFBundleShortVersionString -string "$VERSION" "$appex/Contents/Info.plist"
  # Each extension is sandboxed into its own container, so each needs its own
  # copy of the renderer rather than sharing one.
  cp "$WEB_DIR/preview.html" "$WEB_DIR/preview.js" "$appex/Contents/Resources/"

  codesign --force --sign - \
    --entitlements "$ROOT/quicklook/$entitlements" \
    --timestamp=none \
    "$appex"
}

mkdir -p "$PLUGINS"

build_appex "QuickLookExtension" "PreviewViewController.swift" "Info.preview.plist" \
  "QuickLookExtension.entitlements" \
  "-framework AppKit -framework QuickLookUI -framework WebKit"

# The thumbnail extension is NOT built by default: WebKit's WebContent process
# aborts in _RegisterApplication inside a thumbnail extension, which has no UI
# context to register with. It leaves Finder stalling on every .lottie file
# until the render times out. The source is kept for a future non-WebKit
# renderer; set LOTTIE_BUILD_THUMBNAIL=1 to build it anyway.
if [[ "${LOTTIE_BUILD_THUMBNAIL:-0}" == "1" ]]; then
  build_appex "ThumbnailExtension" "ThumbnailProvider.swift" "Info.thumbnail.plist" \
    "ThumbnailExtension.entitlements" \
    "-framework AppKit -framework QuickLookThumbnailing -framework WebKit"
else
  rm -rf "$PLUGINS/ThumbnailExtension.appex"
fi

# --- 3. document icon for .lottie ------------------------------------------
# Tauri's fileAssociations config has no icon field, so the icon is generated
# here and stitched into the Info.plist it produced.
echo "==> building document icon"
ICON_NAME="lottie-document"
ICONSET="$(mktemp -d)/$ICON_NAME.iconset"
mkdir -p "$ICONSET"

SOURCE_PNG="$(mktemp -d)/$ICON_NAME.png"
node "$ROOT/scripts/gen-document-icon.mjs" "$SOURCE_PNG" > /dev/null

for size in 16 32 128 256 512; do
  sips -z "$size" "$size" "$SOURCE_PNG" --out "$ICONSET/icon_${size}x${size}.png" > /dev/null
  sips -z "$((size * 2))" "$((size * 2))" "$SOURCE_PNG" \
    --out "$ICONSET/icon_${size}x${size}@2x.png" > /dev/null
done

iconutil -c icns "$ICONSET" -o "$APP/Contents/Resources/$ICON_NAME.icns"

# CFBundleTypeIconFile drives the Finder icon; UTTypeIconFile does the same for
# the exported type declaration. Both entries are index 0 — the .lottie one.
plutil -replace 'CFBundleDocumentTypes.0.CFBundleTypeIconFile' \
  -string "$ICON_NAME" "$APP/Contents/Info.plist"
plutil -replace 'UTExportedTypeDeclarations.0.UTTypeIconFile' \
  -string "$ICON_NAME" "$APP/Contents/Info.plist"

# Guard against the association order in tauri.conf.json drifting out from under
# those hardcoded indexes.
if ! plutil -extract 'CFBundleDocumentTypes.0.CFBundleTypeExtensions.0' raw \
     "$APP/Contents/Info.plist" | grep -qx 'lottie'; then
  echo "error: CFBundleDocumentTypes.0 is no longer the .lottie association" >&2
  echo "       check the fileAssociations order in src-tauri/tauri.conf.json" >&2
  exit 1
fi

# --- 4. re-seal the app ----------------------------------------------------
# Nested code is signed above; the container must be signed after it, otherwise
# the outer seal records contents that no longer match.
echo "==> re-signing app"
codesign --force --sign - --timestamp=none "$APP"
codesign --verify --deep --strict "$APP"

# --- 5. disk image ---------------------------------------------------------
# Built here rather than by `tauri build`, for two reasons: the bundler runs
# before this script, so its .dmg would ship without the extension inside; and
# its bundle_dmg.sh drives Finder over AppleScript, which races and fails
# intermittently. A plain hdiutil image has neither problem.
DMG_DIR="$(dirname "$(dirname "$APP")")/dmg"
DMG="$DMG_DIR/$(basename "$APP" .app)_${VERSION}_$(uname -m).dmg"
STAGING="$(mktemp -d)/dmg"

echo "==> building disk image"
mkdir -p "$STAGING" "$DMG_DIR"
cp -R "$APP" "$STAGING/"
ln -s /Applications "$STAGING/Applications"

rm -f "$DMG"
hdiutil create \
  -volname "$(basename "$APP" .app)" \
  -srcfolder "$STAGING" \
  -ov -format UDZO \
  -quiet \
  "$DMG"

echo
echo "embedded:"
for appex in "$PLUGINS"/*.appex; do
  [[ -e "$appex" ]] && echo "  $(basename "$appex")"
done
echo
echo "app: $APP"
echo "dmg: $DMG"
echo
echo "Reinstall so macOS picks the extensions up:"
echo "  rm -rf '/Applications/$(basename "$APP")'"
echo "  cp -R '$APP' /Applications/"
