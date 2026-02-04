#!/bin/bash

# Deployment script for quadly.org backend
# This script assumes you have SSH access to your production server

set -e

echo "🚀 Starting deployment to quadly.org..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration (update these with your server details)
SERVER_USER="${DEPLOY_USER:-your-username}"
SERVER_HOST="${DEPLOY_HOST:-quadly.org}"
SERVER_PATH="${DEPLOY_PATH:-/path/to/quadly}"
SSH_KEY="${SSH_KEY:-~/.ssh/id_rsa}"

echo -e "${YELLOW}Deployment Configuration:${NC}"
echo "  Server: ${SERVER_USER}@${SERVER_HOST}"
echo "  Path: ${SERVER_PATH}"
echo ""

# Check if we should deploy via SSH or if CI/CD handles it
if [ -z "$CI" ]; then
    echo -e "${YELLOW}Manual Deployment Steps:${NC}"
    echo ""
    echo "1. SSH into your production server:"
    echo "   ssh ${SERVER_USER}@${SERVER_HOST}"
    echo ""
    echo "2. Navigate to your project directory:"
    echo "   cd ${SERVER_PATH}"
    echo ""
    echo "3. Pull the latest changes:"
    echo "   git pull origin main"
    echo ""
    echo "4. Install dependencies (if needed):"
    echo "   npm install"
    echo ""
    echo "5. Build the API:"
    echo "   cd apps/api && npm run build"
    echo ""
    echo "6. Generate Prisma client:"
    echo "   npx prisma generate"
    echo ""
    echo "7. Run database migrations (if any):"
    echo "   npx prisma migrate deploy"
    echo ""
    echo "8. Restart the backend service:"
    echo "   # If using PM2:"
    echo "   pm2 restart quadly-api"
    echo "   # OR if using systemd:"
    echo "   sudo systemctl restart quadly-api"
    echo "   # OR if using Docker:"
    echo "   docker-compose restart api"
    echo ""
    echo "9. Check logs to verify deployment:"
    echo "   # PM2:"
    echo "   pm2 logs quadly-api"
    echo "   # systemd:"
    echo "   sudo journalctl -u quadly-api -f"
    echo "   # Docker:"
    echo "   docker-compose logs -f api"
    echo ""
    echo -e "${GREEN}✅ Deployment instructions ready!${NC}"
else
    echo "CI/CD deployment detected - skipping manual steps"
fi
