#!/bin/bash
# CC-Track "One-Shot" Update Script
# Usage: sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/JungleeAadmi/cc-track/main/update.sh)"

set -e
if [ "$EUID" -ne 0 ]; then echo "❌ Run as root"; exit 1; fi

REAL_USER=${SUDO_USER:-$USER}

# Detect Directory
if [ -d "/opt/cc-track" ]; then PROJECT_DIR="/opt/cc-track"
else
    if [ "$REAL_USER" == "root" ]; then USER_HOME="/root"; else USER_HOME=$(getent passwd "$REAL_USER" | cut -d: -f6); fi
    if [ -d "$USER_HOME/cc-track" ]; then PROJECT_DIR="$USER_HOME/cc-track"
    else echo "❌ App not found"; exit 1; fi
fi

echo "--- 🚀 Updating CC-Track [Dir: $PROJECT_DIR] ---"

# 0. BACKUP DATABASE (Critical Safety Step)
if [ -f "$PROJECT_DIR/backend/cc_track.db" ]; then
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$PROJECT_DIR/backend/cc_track.db.bak_$TIMESTAMP"
    echo "--- 💾 Backing up Database to $BACKUP_FILE ---"
    cp "$PROJECT_DIR/backend/cc_track.db" "$BACKUP_FILE"
fi

# 1. System & Nginx Limits
apt-get update && apt-get upgrade -y
apt-get install -y build-essential python3-dev libffi-dev git nginx
echo "client_max_body_size 25M;" > /etc/nginx/conf.d/uploads.conf
systemctl restart nginx

# 2. Pull Code
cd "$PROJECT_DIR"
git reset --hard # Reset local changes to tracked files (DB is untracked, so it's safe)
git pull origin main
chown -R "$REAL_USER:$REAL_USER" "$PROJECT_DIR"

# 3. Backend
cd backend
if [ ! -d "venv" ]; then
    if [ "$REAL_USER" == "root" ]; then python3 -m venv venv; else sudo -u "$REAL_USER" python3 -m venv venv; fi
fi
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

# 4. Frontend
cd frontend
if [ "$REAL_USER" == "root" ]; then npm install && npm run build; else sudo -u "$REAL_USER" npm install && sudo -u "$REAL_USER" npm run build; fi
cd ..

# 5. Restart
if systemctl list-units --full -all | grep -Fq "cc-track.service"; then systemctl restart cc-track; fi

echo "--- ✅ Update Complete! Database backed up. ---"