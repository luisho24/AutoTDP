#!/usr/bin/bash
set -e

DECKY_DIR="$HOME/homebrew/plugins"
PLUGIN_NAME="AutoTDP"
TMP_FILE="/tmp/${PLUGIN_NAME}_update.tar.gz"
LOCK_FILE="/tmp/${PLUGIN_NAME}_update.lock"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

cleanup() {
    rm -f "$LOCK_FILE" "$TMP_FILE"
}

trap cleanup EXIT

if [ -f "$LOCK_FILE" ]; then
    log "Update already in progress, skipping"
    exit 0
fi

touch "$LOCK_FILE"

log "Checking for AutoTDP update..."

LATEST_URL=$(curl -s https://api.github.com/repos/luisho24/AutoTDP/releases/latest | grep "browser_download_url" | cut -d '"' -f 4)

if [ -z "$LATEST_URL" ]; then
    log "Failed to get latest release URL"
    exit 1
fi

CURRENT_VERSION=$(grep '"version"' "$DECKY_DIR/$PLUGIN_NAME/plugin.json" 2>/dev/null | cut -d'"' -f4 || echo "0.0.0")
LATEST_VERSION=$(curl -sL "$LATEST_URL" -o /dev/null -w '%{http_code}' 2>/dev/null || echo "000")

log "Current version: $CURRENT_VERSION"
log "Latest URL: $LATEST_URL"

if [ ! -f "$TMP_FILE" ]; then
    log "Downloading latest release..."
    curl -L "$LATEST_URL" -o "$TMP_FILE"
fi

if [ ! -d "$DECKY_DIR" ]; then
    log "Plugin directory not found at: $DECKY_DIR"
    exit 1
fi

log "Installing update..."
rm -rf "$DECKY_DIR/$PLUGIN_NAME"
tar -xzf "$TMP_FILE" -C "$DECKY_DIR"

log "Restarting plugin_loader..."
systemctl restart plugin_loader.service

log "Update complete"