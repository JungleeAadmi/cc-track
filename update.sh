#!/bin/bash

# CC-Track "One-Shot" Update Script
# Usage: sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/JungleeAadmi/cc-track/main/update.sh)"

set -e

# 1. Root Check
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root (sudo bash ...)"
  exit 1
fi

# 2. Detect Installation Directory
REAL_USER=${SUDO_USER:-$USER}
if [ "$REAL_USER" == "root" ]; then
    # Fallback if somehow running as raw root
    USER_HOME="/root"
else
    USER_HOME=$(getent passwd "$REAL_USER" | cut -d: -f6)
fi

PROJECT_DIR="$USER_HOME/cc-track"

# Verify directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Error: Could not find CC-Track at $PROJECT_DIR"
    echo "   If you installed it elsewhere, please run ./update.sh locally inside the folder."
    exit 1
fi

echo "--- 🚀 Starting CC-Track Update [Dir: $PROJECT_DIR] ---"

# 3. System Updates & Compilers (Fixes Auth/Bcrypt issues)
echo "--- 🔄 1. Updating System & Installing Compilers ---"
apt-get update && apt-get upgrade -y
# We explicitly install build-essential and python3-dev to ensure 'bcrypt' can compile
apt-get install -y build-essential python3-dev libffi-dev git

# 4. Update Code (Git Pull)
echo "--- ⬇️ 2. Pulling latest code ---"
cd "$PROJECT_DIR"
# Safe pull - this will NEVER delete untracked files like cc_track.db or uploads/
git pull origin main

# Update local permissions just in case
chown -R "$REAL_USER:$REAL_USER" "$PROJECT_DIR"

# 5. Update Backend
echo "--- 🐍 3. Updating Backend ---"
cd backend
if [ ! -d "venv" ]; then
    sudo -u "$REAL_USER" python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

# 6. Update Frontend
echo "--- ⚛️ 4. Rebuilding Frontend ---"
cd frontend
sudo -u "$REAL_USER" npm install
sudo -u "$REAL_USER" npm run build
cd ..

# 7. Restart Service
echo "--- 🔄 5. Restarting Service ---"
if systemctl list-units --full -all | grep -Fq "cc-track.service"; then
    systemctl restart cc-track
    echo "✅ Service restarted."
else
    echo "⚠️ Service not found. Is it installed?"
fi

echo "--- ✅ Update Complete! Data preserved. ---"