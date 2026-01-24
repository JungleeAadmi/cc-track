#!/bin/bash
set -euo pipefail

# =========================================================
# CONFIG
# =========================================================
APP_NAME="cc-track"
INSTALL_DIR="/opt/cc-track"
BACKEND_DIR="$INSTALL_DIR/backend"
FRONTEND_DIR="$INSTALL_DIR/frontend"
VENV_DIR="$INSTALL_DIR/venv"
SERVICE_FILE="/etc/systemd/system/cc-track.service"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== CC-Track Fresh Install ===${NC}"

# =========================================================
# OS & PACKAGE MANAGER DETECTION
# =========================================================
if command -v apt-get >/dev/null; then
  PKG_INSTALL="apt-get install -y"
  PKG_UPDATE="apt-get update"
elif command -v dnf >/dev/null; then
  PKG_INSTALL="dnf install -y"
  PKG_UPDATE="dnf makecache"
else
  echo -e "${RED}Unsupported OS: no apt or dnf found${NC}"
  exit 1
fi

# =========================================================
# INSTALL SYSTEM DEPENDENCIES
# =========================================================
echo -e "${YELLOW}Installing system dependencies...${NC}"
$PKG_UPDATE
$PKG_INSTALL \
  git \
  curl \
  ca-certificates \
  python3 \
  python3-venv \
  python3-pip \
  nodejs \
  npm

# =========================================================
# CLONE OR UPDATE REPO
# =========================================================
if [ -d "$INSTALL_DIR/.git" ]; then
  echo "Updating existing repository..."
  cd "$INSTALL_DIR"
  git fetch origin
  git reset --hard origin/main
else
  echo "Cloning repository..."
  git clone https://github.com/JungleeAadmi/cc-track.git "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

# =========================================================
# PYTHON VIRTUAL ENVIRONMENT
# =========================================================
echo "Setting up Python virtual environment..."
python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"

pip install --upgrade pip
pip install --no-cache-dir -r "$BACKEND_DIR/requirements.txt"

# =========================================================
# FRONTEND BUILD
# =========================================================
echo "Building frontend..."
cd "$FRONTEND_DIR"
rm -rf node_modules dist package-lock.json
npm install
npm run build

# =========================================================
# SYSTEMD SERVICE
# =========================================================
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

# =========================================================
# HEALTH CHECK
# =========================================================
sleep 3

if ! curl -sf http://127.0.0.1:8000/ >/dev/null; then
  echo -e "${RED}ERROR: Backend failed to start${NC}"
  systemctl status cc-track --no-pager -l
  exit 1
fi

echo -e "${GREEN}Backend is healthy${NC}"
echo -e "${GREEN}=== CC-Track Installed Successfully ===${NC}"
echo "Open the app in browser and hard refresh (Ctrl+Shift+R)"
