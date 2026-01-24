#!/bin/bash

# CC-Track "One-Shot" Update Script
# Usage: sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/JungleeAadmi/cc-track/main/update.sh)"

set -e

# 1. Root Check
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root (sudo bash ...)"
  exit 1
fi

REAL_USER=${SUDO_USER:-$USER}

# 2. Detect Installation Directory
# PRIORITY: Check /opt/cc-track first
if [ -d "/opt/cc-track" ]; then
    PROJECT_DIR="/opt/cc-track"
    echo "✅ Found existing installation at /opt/cc-track"
else
    # Fallback: Check user's home directory
    if [ "$REAL_USER" == "root" ]; then
        USER_HOME="/root"
    else
        USER_HOME=$(getent passwd "$REAL_USER" | cut -d: -f6)
    fi
    
    if [ -d "$USER_HOME/cc-track" ]; then
        PROJECT_DIR="$USER_HOME/cc-track"
        echo "✅ Found existing installation at $USER_HOME/cc-track"
    else
        echo "❌ Error: Could not find CC-Track in /opt/cc-track or $USER_HOME/cc-track"
        exit 1
    fi
fi

echo "--- 🚀 Starting CC-Track Update [Dir: $PROJECT_DIR] ---"

# 3. System Updates & Compilers
echo "--- 🔄 1. Updating System & Installing Compilers ---"
apt-get update && apt-get upgrade -y
apt-get install -y build-essential python3-dev libffi-dev git

# 4. Update Code (Force Sync)
echo "--- ⬇️ 2. Pulling latest code ---"
cd "$PROJECT_DIR"

# FORCE RESET: Discard local changes to tracked files (e.g., modified update.sh)
# This DOES NOT touch untracked files like cc_track.db or uploads/ (thanks to .gitignore)
git reset --hard

# Pull latest version
git pull origin main

# Update permissions
chown -R "$REAL_USER:$REAL_USER" "$PROJECT_DIR"

# 5. Update Backend
echo "--- 🐍 3. Updating Backend ---"
cd backend
if [ ! -d "venv" ]; then
    if [ "$REAL_USER" == "root" ]; then
        python3 -m venv venv
    else
        sudo -u "$REAL_USER" python3 -m venv venv
    fi
fi
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

# 6. Update Frontend
echo "--- ⚛️ 4. Rebuilding Frontend ---"
cd frontend
if [ "$REAL_USER" == "root" ]; then
    npm install
    npm run build
else
    sudo -u "$REAL_USER" npm install
    sudo -u "$REAL_USER" npm run build
fi
cd ..

# 7. Restart Service
echo "--- 🔄 5. Restarting Service ---"
if systemctl list-units --full -all | grep -Fq "cc-track.service"; then
    systemctl restart cc-track
    echo "✅ Service restarted."
else
    echo "⚠️ Service not found."
fi

echo "--- ✅ Update Complete! Data preserved. ---"