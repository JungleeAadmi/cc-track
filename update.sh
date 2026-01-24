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
BACKUP_DIR="/tmp/cc_track_backup_$(date +%s)"

SERVICE_NAME="cc-track"
NGINX_SERVICE="nginx"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Updating CC-Track ===${NC}"

# =========================================================
# PRE-FLIGHT CHECKS
# =========================================================
echo "Running pre-flight checks..."

if [ ! -d "$INSTALL_DIR/.git" ]; then
  echo -e "${RED}ERROR: $INSTALL_DIR is not a git repository${NC}"
  exit 1
fi

if [ ! -d "$VENV_DIR" ]; then
  echo -e "${RED}ERROR: Python venv not found at $VENV_DIR${NC}"
  exit 1
fi

command -v python >/dev/null || { echo "python not found"; exit 1; }
command -v npm >/dev/null || { echo "npm not found"; exit 1; }

# =========================================================
# STOP SERVICES
# =========================================================
echo "Stopping services..."
systemctl stop "$SERVICE_NAME"

# =========================================================
# BACKUP USER DATA
# =========================================================
echo "Backing up user data to $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

if [ -f "$BACKEND_DIR/cc_data.db" ]; then
  cp "$BACKEND_DIR/cc_data.db" "$BACKUP_DIR/"
  echo "✔ Database backed up"
fi

if [ -d "$BACKEND_DIR/uploaded_images" ]; then
  cp -r "$BACKEND_DIR/uploaded_images" "$BACKUP_DIR/"
  echo "✔ Uploaded images backed up"
fi

# =========================================================
# UPDATE CODE
# =========================================================
echo "Pulling latest code..."
cd "$INSTALL_DIR"
git fetch origin
git reset --hard origin/main

# =========================================================
# RESTORE USER DATA
# =========================================================
echo "Restoring user data..."

if [ -f "$BACKUP_DIR/cc_data.db" ]; then
  cp "$BACKUP_DIR/cc_data.db" "$BACKEND_DIR/"
  echo "✔ Database restored"
fi

if [ -d "$BACKUP_DIR/uploaded_images" ]; then
  mkdir -p "$BACKEND_DIR/uploaded_images"
  cp -r "$BACKUP_DIR/uploaded_images/"* "$BACKEND_DIR/uploaded_images/" || true
  echo "✔ Uploaded images restored"
fi

# =========================================================
# BACKEND REBUILD (CLEAN)
# =========================================================
echo "Rebuilding backend..."
source "$VENV_DIR/bin/activate"

pip install --upgrade pip >/dev/null
pip install --no-cache-dir -r "$BACKEND_DIR/requirements.txt"

# =========================================================
# FRONTEND REBUILD (TRULY CLEAN)
# =========================================================
echo "Rebuilding frontend from scratch..."
cd "$FRONTEND_DIR"

# FULL CLEAN — this is critical
rm -rf node_modules dist package-lock.json

npm install
npm run build

# Validate build output
if [ ! -d "dist" ]; then
  echo -e "${RED}ERROR: Frontend build failed — dist/ not found${NC}"
  exit 1
fi

echo "✔ Frontend build successful"

# =========================================================
# RESTART SERVICES
# =========================================================
echo "Starting services..."
systemctl start "$SERVICE_NAME"
systemctl restart "$NGINX_SERVICE"

# =========================================================
# HEALTH CHECK
# =========================================================
sleep 2

if ! systemctl is-active --quiet "$SERVICE_NAME"; then
  echo -e "${RED}ERROR: Backend service failed to start${NC}"
  exit 1
fi

if ! systemctl is-active --quiet "$NGINX_SERVICE"; then
  echo -e "${RED}ERROR: Nginx failed to start${NC}"
  exit 1
fi

echo -e "${GREEN}✔ CC-Track updated successfully${NC}"
echo -e "${GREEN}✔ Data preserved${NC}"
echo -e "${YELLOW}NOTE: Hard refresh browser (Ctrl+Shift+R) after update${NC}"
