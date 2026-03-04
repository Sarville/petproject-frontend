#!/bin/bash
set -e

APP_DIR="/var/www/wish-list-app"
cd "$APP_DIR"

echo "[$(date)] === Deploy started ==="

git pull origin master
npm install
npx prisma migrate deploy
npx prisma generate
npm run build

pm2 restart wish-list-app 2>/dev/null || pm2 start npm --name "wish-list-app" -- start
pm2 save

echo "[$(date)] === Deploy complete ==="
pm2 status
