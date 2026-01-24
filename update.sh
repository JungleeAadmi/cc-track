#!/bin/bash

# CC-Track Safe Update Script
# Usage: sudo ./update.sh

set -e

if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root (sudo ./update.sh)"
  exit 1
fi

REAL_USER=${SUDO_USER:-$USER}

echo "--- 🔄 1. Updating System Packages (OS) ---"
apt-get update && apt-get upgrade -y

echo "--- ⬇️ 2. Pulling latest App Code ---"
git pull

echo "--- 🐍 3. Updating Backend Dependencies ---"
cd backend
if [ ! -d "venv" ]; then
    sudo -u "$REAL_USER" python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

echo "--- ⚛️ 4. Rebuilding Frontend Assets ---"
cd frontend
sudo -u "$REAL_USER" npm install
sudo -u "$REAL_USER" npm run build
cd ..

echo "--- 🔄 5. Restarting Service ---"
systemctl restart cc-track

echo "--- ✅ Update Complete! System and App are up to date. ---"