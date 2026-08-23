#!/usr/bin/env bash
set -e

echo "==> Building ScreenLink macOS App..."
export PATH=$PATH:/opt/homebrew/bin:$HOME/go/bin
wails build -platform darwin/arm64

echo "==> Creating Drag & Drop DMG Installer with /Applications shortcut..."
rm -f build/bin/ScreenLink-Installer.dmg

create-dmg \
  --volname "ScreenLink Installer" \
  --window-pos 200 120 \
  --window-size 540 320 \
  --icon-size 110 \
  --icon "ScreenLink.app" 140 140 \
  --hide-extension "ScreenLink.app" \
  --app-drop-link 400 140 \
  --no-internet-enable \
  --overwrite \
  build/bin/ScreenLink-Installer.dmg \
  build/bin/ScreenLink.app

# Automatically close any temporary Finder window opened during build
osascript -e 'tell application "Finder" to close (every window whose name contains "ScreenLink")' 2>/dev/null || true

echo "==> Successfully created installer: build/bin/ScreenLink-Installer.dmg"
