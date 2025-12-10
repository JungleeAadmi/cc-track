#!/bin/bash
set -e

# --- Config ---
INSTALL_DIR="/opt/cc-track"
BACKUP_DIR="/tmp/cc_track_backup"
SERVICE_NAME="cc-track"

GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}--- Updating CC Tracker ---${NC}"

# 1. Stop Services
echo "Stopping services..."
systemctl stop $SERVICE_NAME

# 2. Backup User Data (Database & Images)
echo "Backing up user data..."
rm -rf "$BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Check if DB exists and backup
if [ -f "$INSTALL_DIR/backend/cc_data.db" ]; then
    cp "$INSTALL_DIR/backend/cc_data.db" "$BACKUP_DIR/"
    echo "Database backed up."
fi

# Check if uploaded images exist and backup
if [ -d "$INSTALL_DIR/backend/uploaded_images" ]; then
    cp -r "$INSTALL_DIR/backend/uploaded_images" "$BACKUP_DIR/"
    echo "Images backed up."
fi

# 3. Update Code (Rebuild from Source)
echo "Pulling latest code..."
cd "$INSTALL_DIR"
git fetch --all
git reset --hard origin/main

# 4. Restore User Data
echo "Restoring user data..."
if [ -f "$BACKUP_DIR/cc_data.db" ]; then
    cp "$BACKUP_DIR/cc_data.db" "$INSTALL_DIR/backend/"
fi

if [ -d "$BACKUP_DIR/uploaded_images" ]; then
    mkdir -p "$INSTALL_DIR/backend/uploaded_images"
    cp -r "$BACKUP_DIR/uploaded_images/*" "$INSTALL_DIR/backend/uploaded_images/"
fi

# 5. Rebuild Dependencies
echo "Rebuilding backend..."
source venv/bin/activate
pip install -r backend/requirements.txt

echo "Rebuilding frontend..."
cd frontend
rm -rf node_modules package-lock.json # Force clean slate for NPM
npm install --silent
npm run build
cd ..

# 6. Restart
echo "Restarting services..."
systemctl start $SERVICE_NAME
systemctl restart nginx

echo -e "${GREEN}Update Complete! Data preserved.${NC}"