#!/bin/bash
set -e

# --- Configuration ---
REPO_URL="https://github.com/JungleeAadmi/cc-track.git"
INSTALL_DIR="/opt/cc-track"
BACKUP_DIR="/var/backups/cc-track"
SERVICE_NAME="cc-track"
DB_FILE="cc_data.db"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}--- Starting Credit Card Tracker Installer ---${NC}"

# 1. Check Root
if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root (sudo bash install.sh)"
  exit
fi

# 2. Install System Dependencies
echo -e "${GREEN}[1/6] Installing System Dependencies (Python, Node, Nginx)...${NC}"
apt-get update -qq
# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash - > /dev/null
apt-get install -y python3 python3-pip python3-venv nodejs nginx git acl > /dev/null

# 3. Clone or Update Repository
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${GREEN}[2/6] Directory exists. Triggering update mode...${NC}"
    # If running purely from curl, we might not be inside the dir.
    # We delegate to the update logic which handles data safety.
    bash "$INSTALL_DIR/update.sh"
    exit 0
else
    echo -e "${GREEN}[2/6] Cloning Repository...${NC}"
    git clone "$REPO_URL" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"

# 4. Backend Setup
echo -e "${GREEN}[3/6] Setting up Python Backend...${NC}"
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt > /dev/null

# 5. Frontend Build
echo -e "${GREEN}[4/6] Building React Frontend...${NC}"
cd frontend
npm install --silent
npm run build
cd ..

# 6. Service Configuration (Systemd)
echo -e "${GREEN}[5/6] Configuring Systemd Service...${NC}"
cat > /etc/systemd/system/$SERVICE_NAME.service <<EOF
[Unit]
Description=Credit Card Tracker Backend
After=network.target

[Service]
User=root
WorkingDirectory=$INSTALL_DIR/backend
ExecStart=$INSTALL_DIR/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl restart $SERVICE_NAME

# 7. Nginx Configuration
echo -e "${GREEN}[6/6] Configuring Nginx Reverse Proxy...${NC}"
cat > /etc/nginx/sites-available/cc-track <<EOF
server {
    listen 80;
    server_name _;

    root $INSTALL_DIR/frontend/dist;
    index index.html;

    # Serve React App
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy API requests to Python
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

# Enable site and remove default
ln -sf /etc/nginx/sites-available/cc-track /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx

# 8. Completion
IP_ADDR=$(hostname -I | cut -d' ' -f1)
echo -e "${BLUE}------------------------------------------------${NC}"
echo -e "${GREEN} Installation Complete! ${NC}"
echo -e "${BLUE} Open your browser: http://$IP_ADDR ${NC}"
echo -e "${BLUE}------------------------------------------------${NC}"