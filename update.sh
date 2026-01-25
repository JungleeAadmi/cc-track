#!/bin/bash

# CC-Track Robust Update Script (Backup -> Wipe -> Restore)
# Usage: sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/JungleeAadmi/cc-track/main/update.sh)"

set -e
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Detect Directory Logic
REAL_USER=${SUDO_USER:-$USER}
if [ "$REAL_USER" == "root" ]; then
    BASE_DIR="/opt"
else
    BASE_DIR=$(getent passwd "$REAL_USER" | cut -d: -f6)
fi

# Force /opt/cc-track if it exists, otherwise use home
if [ -d "/opt/cc-track" ]; then
    APP_DIR="/opt/cc-track"
else
    APP_DIR="$BASE_DIR/cc-track"
fi

BACKUP_DIR="/tmp/cc_track_backup_$(date +%s)"
REPO_URL="https://github.com/JungleeAadmi/cc-track.git"

echo -e "${GREEN}--- STARTING ROBUST CC-TRACK UPDATE ---${NC}"
echo -e "Target Directory: $APP_DIR"

# 1. Root Check
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}Error: This script must be run as root.${NC}" 
   exit 1
fi

# 2. Preparation & Backup
echo -e "${YELLOW}Creating temporary backup of user data...${NC}"
mkdir -p "$BACKUP_DIR"

# 2a. Backup Database (SQLite)
if [ -f "$APP_DIR/backend/cc_track.db" ]; then
    echo "Backing up database..."
    cp "$APP_DIR/backend/cc_track.db" "$BACKUP_DIR/cc_track.db"
else
    echo "No database found (Fresh install?), skipping backup."
fi

# 2b. Backup Uploads
if [ -d "$APP_DIR/backend/uploads" ]; then
    echo "Backing up uploads..."
    cp -r "$APP_DIR/backend/uploads" "$BACKUP_DIR/uploads"
fi

# 3. Stop Service & Clean Old Files
echo -e "${YELLOW}Stopping service and cleaning old files...${NC}"
systemctl stop cc-track || true
# Remove the directory to force a clean git clone
rm -rf "$APP_DIR"

# 4. Re-Clone & Rebuild
echo -e "${YELLOW}Downloading fresh code...${NC}"
git clone "$REPO_URL" "$APP_DIR"
chown -R "$REAL_USER:$REAL_USER" "$APP_DIR"

# 4a. Backend Setup
echo -e "${YELLOW}Installing Backend dependencies...${NC}"
cd "$APP_DIR/backend"
# Install system deps for python build
apt-get update && apt-get install -y build-essential python3-dev libffi-dev
# Create venv as real user to avoid permission issues
if [ "$REAL_USER" == "root" ]; then
    python3 -m venv venv
else
    sudo -u "$REAL_USER" python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
deactivate

# Security: Shuffle Keys (If it's a fresh auth file)
TARGET_AUTH_FILE="$APP_DIR/backend/app/auth.py"
if grep -q "CHANGE_THIS_TO_A_REALLY_LONG_RANDOM_STRING_FOR_PROD" "$TARGET_AUTH_FILE"; then
    NEW_SECRET=$(openssl rand -hex 32)
    sed -i "s/CHANGE_THIS_TO_A_REALLY_LONG_RANDOM_STRING_FOR_PROD/$NEW_SECRET/g" "$TARGET_AUTH_FILE"
fi

# 4b. Frontend Setup
echo -e "${YELLOW}Building Frontend...${NC}"
cd "$APP_DIR/frontend"
if [ "$REAL_USER" == "root" ]; then
    npm install && npm run build
else
    sudo -u "$REAL_USER" npm install && sudo -u "$REAL_USER" npm run build
fi

# 5. Restore User Data
echo -e "${YELLOW}Restoring user data...${NC}"

# 5a. Restore Database
if [ -f "$BACKUP_DIR/cc_track.db" ]; then
    cp "$BACKUP_DIR/cc_track.db" "$APP_DIR/backend/cc_track.db"
    echo "Database restored."
fi

# 5b. Restore Uploads
mkdir -p "$APP_DIR/backend/uploads"
if [ -d "$BACKUP_DIR/uploads" ]; then
    cp -r "$BACKUP_DIR/uploads/*" "$APP_DIR/backend/uploads/"
    echo "Uploads restored."
fi

# Fix ownership of restored files
chown -R "$REAL_USER:$REAL_USER" "$APP_DIR/backend"

# 6. Restart Service
echo -e "${YELLOW}Restarting Service...${NC}"
# Ensure Nginx limit is set
echo "client_max_body_size 25M;" > /etc/nginx/conf.d/uploads.conf
systemctl restart nginx
systemctl daemon-reload
systemctl enable cc-track
systemctl start cc-track

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}    Update Complete! Data Restored.      ${NC}"
echo -e "${GREEN}=========================================${NC}"