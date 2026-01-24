#!/bin/bash

# CC-Track "One-Shot" Installation Script
# Usage: sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/JungleeAadmi/cc-track/main/install.sh)"

set -e

# 1. Check Root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root (sudo bash ...)"
  exit 1
fi

# Detect Real User (to avoid owning files as root)
REAL_USER=${SUDO_USER:-$USER}
if [ "$REAL_USER" == "root" ]; then
    BASE_DIR="/opt"
else
    BASE_DIR=$(getent passwd "$REAL_USER" | cut -d: -f6)
fi

PROJECT_DIR="$BASE_DIR/cc-track"
REPO_URL="https://github.com/JungleeAadmi/cc-track.git"

echo "--- 🚀 Starting CC-Track Installation ---"

# 2. System Updates & Dependencies
echo "--- 🔄 System Update & Upgrade (This may take a minute) ---"
apt-get update && apt-get upgrade -y
apt-get install -y python3 python3-pip python3-venv nodejs npm nginx git acl openssl curl

# 3. Setup Directory & Clone
echo "--- 📂 Setting up Application at $PROJECT_DIR ---"

if [ -d "$PROJECT_DIR" ]; then
    echo "Directory exists. Updating repo..."
    cd "$PROJECT_DIR"
    if [ -d ".git" ]; then
        git pull
    fi
else
    echo "Cloning repository..."
    git clone "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

# Fix ownership so the real user can edit files later
chown -R "$REAL_USER:$REAL_USER" "$PROJECT_DIR"

# 4. Backend Setup
echo "--- 🐍 Setting up Backend ---"
cd backend
# Create venv as the real user
sudo -u "$REAL_USER" python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate

# 5. Security: Shuffle Keys
# Replaces the default hardcoded key in app/auth.py with a random 64-char hex string
TARGET_AUTH_FILE="app/auth.py"
if grep -q "CHANGE_THIS_TO_A_REALLY_LONG_RANDOM_STRING_FOR_PROD" "$TARGET_AUTH_FILE"; then
    echo "--- 🔐 Generating unique Production Secret Key ---"
    NEW_SECRET=$(openssl rand -hex 32)
    sed -i "s/CHANGE_THIS_TO_A_REALLY_LONG_RANDOM_STRING_FOR_PROD/$NEW_SECRET/g" "$TARGET_AUTH_FILE"
fi
cd ..

# 6. Frontend Setup
echo "--- ⚛️ Setting up Frontend (Building Assets) ---"
cd frontend
sudo -u "$REAL_USER" npm install
sudo -u "$REAL_USER" npm run build
cd ..

# 7. Systemd Service Configuration
echo "--- ⚙️ Configuring System Service ---"
SERVICE_FILE="/etc/systemd/system/cc-track.service"

cat > $SERVICE_FILE <<EOF
[Unit]
Description=CC-Track Backend Service
After=network.target

[Service]
User=$REAL_USER
Group=$REAL_USER
WorkingDirectory=$PROJECT_DIR/backend
Environment="PATH=$PROJECT_DIR/backend/venv/bin"
ExecStart=$PROJECT_DIR/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable cc-track
systemctl restart cc-track

# 8. Nginx Configuration
echo "--- 🌐 Configuring Nginx Reverse Proxy ---"
NGINX_CONF="/etc/nginx/sites-available/cc-track"

cat > $NGINX_CONF <<EOF
server {
    listen 80;
    server_name _;

    # Serve React Frontend
    location / {
        root $PROJECT_DIR/frontend/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy API Requests
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # Proxy Auth Requests
    location /auth {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
    }

    # Proxy Uploads
    location /uploads {
        proxy_pass http://127.0.0.1:8000;
    }
}
EOF

# Enable Site
rm -f /etc/nginx/sites-enabled/default
ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# 9. Final Permissions
chown -R "$REAL_USER:$REAL_USER" "$PROJECT_DIR"
chmod +x install.sh update.sh

echo "--- ✅ Installation Complete! ---"
echo "Access your app at: http://$(hostname -I | awk '{print $1}')"