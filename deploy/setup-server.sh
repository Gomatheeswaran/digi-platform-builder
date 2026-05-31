#!/bin/bash
# ============================================================
# setup-server.sh — One-time Linux server setup
# Run this once on your fresh Ubuntu/Debian server
# Usage: sudo bash setup-server.sh
# ============================================================

echo "➤ Updating system packages..."
apt update && apt upgrade -y

echo "➤ Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "➤ Installing PM2 (process manager)..."
npm install -g pm2

echo "➤ Installing nginx..."
apt install -y nginx

echo "➤ Installing certbot (Let's Encrypt)..."
apt install -y certbot python3-certbot-nginx

echo "➤ Installing MongoDB..."
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod

echo "➤ Creating certbot webroot..."
mkdir -p /var/www/certbot

echo "➤ Setting up nginx..."
# Remove default site
rm -f /etc/nginx/sites-enabled/default

echo ""
echo "✓ Server setup complete!"
echo ""
echo "Next steps:"
echo "1. Upload your app to /var/www/app-platform"
echo "2. Copy .env.local.example to .env.local and fill in your values"
echo "3. Run: npm install && npm run build"
echo "4. Copy deploy/nginx-platform.conf to /etc/nginx/sites-available/"
echo "5. Update PLATFORM_DOMAIN in the nginx config"
echo "6. Run: certbot --nginx -d platform.yourdomain.com -m admin@yourdomain.com"
echo "7. Run: pm2 start npm --name app-platform -- start"
echo "8. Run: pm2 startup && pm2 save"
