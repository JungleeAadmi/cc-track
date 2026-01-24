#!/bin/bash
set -euo pipefail

# =========================
# CONFIG
# =========================
APP_NAME="cc-track"
INSTALL_DIR="/opt/cc-track"
BACKEND_DIR="$INSTALL_DIR/backend"
FRONTEND_DIR="$INSTALL_DIR/frontend"
VENV_DIR="$INSTALL_DIR/venv"

SERVICE_FILE="/etc/systemd/system/cc-track.service"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== CC-Track Fresh Install ===${NC}"

# =========================
# PRE-CHECKS
# =========================
command -v git >/dev/null || { echo "git not installed"; exit 1; }
command -v python3 >/dev/null || { echo "python3 not installed"; exit 1; }
command -v npm >/dev/null || { echo "npm not installed"; exit 1; }

# =========================
# CLONE / RESET APP
# =========================
if [ -d "$INSTALL_DIR/.git" ]; then
  echo "Updating existing repo..."
  cd "$INSTALL_DIR"
  git fetch origin
  git reset --hard origin/main
else
  echo "Cloning repo..."
  git clone https://github.com/JungleeAadmi/cc-track.git "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

# =========================
# PYTHON VENV
# =========================
echo "Setting up Python virtual environment..."
python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"

pip install --upgrade pip
pip install --no-cache-dir -r "$BACKEND_DIR/requirements.txt"

# =========================
# FRONTEND BUILD
# =========================
echo "Building frontend..."
cd "$FRONTEND_DIR"
rm -rf node_modules dist package-lock.json
npm install
npm run build

# =========================
# SYSTEMD SERVICE
# =========================
echo "Installing systemd service..."

cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=CC-Track Backend
After=network.target

[Service]
User=root
WorkingDirectory=/opt/cc-track
ExecStart=/opt/cc-track/venv/bin/uvicorn backend.main:app --host 127.0.0.1 --port 8000
Restart=always
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reexec
systemctl daemon-reload
systemctl enable cc-track
systemctl restart cc-track

# =========================
# HEALTH CHECK
# =========================
sleep 2

if ! curl -sf http://127.0.0.1:8000/ >/dev/null; then
  echo -e "${RED}Backend failed health check${NC}"
  systemctl status cc-track --no-pager
  exit 1
fi

echo -e "${GREEN}Backend is healthy${NC}"

# =========================
# DONE
# =========================
echo -e "${GREEN}=== CC-Track Installed Successfully ===${NC}"
echo "Open the app in browser and hard refresh (Ctrl+Shift+R)"
