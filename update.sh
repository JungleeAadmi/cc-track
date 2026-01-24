#!/bin/bash
set -euo pipefail

# ===============================
# CONFIG
# ===============================
INSTALL_DIR="/opt/cc-track"
BACKUP_DIR="/tmp/cc_track_backup"
SERVICE_NAME="cc-track"
FRONTEND_DIR="$INSTALL_DIR/frontend"
BACKEND_DIR="$INSTALL_DIR/backend"
VENV_DIR="$INSTALL_DIR/venv"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}--- Updating CC Tracker ---${NC}"

# ===============================
# PRE-FLIGHT CHECKS
# ===============================
echo "Running pre-flight checks..."

if [ ! -d "$INSTALL_DIR/.git" ]; then
  echo -e "${RED}ERROR: $INSTALL_DIR is not a git repository${NC}"
  exit 1
fi

if [ ! -d "$VENV_DIR" ]; then
  echo -e "${RED}ERROR: Python venv not found at $VENV_DIR${NC}"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo -e "${RED}ERROR: npm is not installed${NC}"
  exit 1
fi

# ===============================
# STOP SERVICES
# ===============================
echo "Stopping services..."
systemctl stop "$SERVICE_NAME"

# ===============================
# BACKUP USER DATA
# ===============================
echo "Backing up user data..."
rm -rf "$BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

if [ -f "$BACKEND_DIR/cc_data.db" ]; then
  cp "$BACKEND_DIR/cc_data.db" "$BACKUP_DIR/"
  echo "✔ Database backed up"
fi

if [ -d "$BACKEND_DIR/uploaded_images" ]; then
  cp -r "$BACKEND_DIR/uploaded_images" "$BACKUP_DIR/"
  echo "✔ Uploaded images backed up"
fi

# ===============================
# PULL LATEST CODE
# ===============================
echo "Pulling latest code..."
cd "$INSTALL_DIR"

git fetch origin
git reset --hard origin/main

# ===============================
# RESTORE USER DATA
# ===============================
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

# ===============================
# BACKEND BUILD
# ===============================
echo "Rebuilding backend..."

source "$VENV_DIR/bin/activate"
pip install --upgrade pip >/dev/null
pip install -r "$BACKEND_DIR/requirements.txt"

# ===============================
# FRONTEND BUILD (SAFE)
# ===============================
echo "Rebuilding frontend..."

cd "$FRONTEND_DIR"

# Clean only what is safe
rm -rf node_modules dist

npm install --silent
npm run build

# Validate build output
if [ ! -d "dist" ]; then
  echo -e "${RED}ERROR: Frontend build failed (dist not found)${NC}"
  exit 1
fi

echo "✔ Frontend build OK"

cd "$INSTALL_DIR"

# ===============================
# RESTART SERVICES
# ===============================
echo "Starting services..."
systemctl start "$SERVICE_NAME"
systemctl restart nginx

# ===============================
# HEALTH CHECK
# ===============================
sleep 2
if ! systemctl is-active --quiet "$SERVICE_NAME"; then
  echo -e "${RED}ERROR: Service failed to start${NC}"
  exit 1
fi

echo -e "${GREEN}✔ CC Tracker updated successfully${NC}"
echo -e "${GREEN}✔ Data preserved${NC}"
