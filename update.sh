#!/bin/bash
# CC-Track Robust Update Script
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

# 1. System & Nginx Limits
apt-get update && apt-get upgrade -y
apt-get install -y build-essential python3-dev libffi-dev git nginx
echo "client_max_body_size 25M;" > /etc/nginx/conf.d/uploads.conf
systemctl restart nginx

# 2. PRE-UPDATE BACKUP
BACKUP_DIR="/tmp/cc_track_backup_$(date +%s)"
mkdir -p "$BACKUP_DIR"
echo "--- 💾 Backing up User Data to $BACKUP_DIR ---"

if [ -f "$PROJECT_DIR/backend/cc_track.db" ]; then
    cp "$PROJECT_DIR/backend/cc_track.db" "$BACKUP_DIR/cc_track.db"
    echo "Database backed up."
fi

if [ -d "$PROJECT_DIR/backend/uploads" ]; then
    cp -r "$PROJECT_DIR/backend/uploads" "$BACKUP_DIR/uploads"
    echo "Uploads backed up."
fi

# 3. Pull Code
cd "$PROJECT_DIR"
git fetch origin
git reset --hard origin/main
chown -R "$REAL_USER:$REAL_USER" "$PROJECT_DIR"

# 4. Backend
cd backend
if [ ! -d "venv" ]; then
    if [ "$REAL_USER" == "root" ]; then python3 -m venv venv; else sudo -u "$REAL_USER" python3 -m venv venv; fi
fi
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

# 5. Frontend
cd frontend
if [ "$REAL_USER" == "root" ]; then npm install && npm run build; else sudo -u "$REAL_USER" npm install && sudo -u "$REAL_USER" npm run build; fi
cd ..

# 6. RESTORE USER DATA
echo "--- ♻️ Restoring User Data ---"
if [ -f "$BACKUP_DIR/cc_track.db" ]; then
    cp "$BACKUP_DIR/cc_track.db" "$PROJECT_DIR/backend/cc_track.db"
    echo "Database restored."
fi

mkdir -p "$PROJECT_DIR/backend/uploads"
if [ -d "$BACKUP_DIR/uploads" ]; then
    if [ "$(ls -A $BACKUP_DIR/uploads)" ]; then
        cp -a "$BACKUP_DIR/uploads/." "$PROJECT_DIR/backend/uploads/"
        echo "Uploads restored."
    fi
fi

chown -R "$REAL_USER:$REAL_USER" "$PROJECT_DIR/backend"

# 7. Restart
if systemctl list-units --full -all | grep -Fq "cc-track.service"; then systemctl restart cc-track; fi

echo "--- ✅ Update Complete! ---"