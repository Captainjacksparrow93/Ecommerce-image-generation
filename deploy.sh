#!/usr/bin/env bash
# =============================================================
# EcomCreatives — VPS Deployment Script (Hostinger)
# =============================================================
# FIRST-TIME SETUP:  sudo bash deploy.sh --setup
# SUBSEQUENT DEPLOYS: bash deploy.sh
# =============================================================

set -euo pipefail

APP_NAME="ecomcreatives"
APP_DIR="/var/www/${APP_NAME}"
REPO_URL="https://github.com/Captainjacksparrow93/Ecommerce-image-generation.git"
BRANCH="master"
NODE_VERSION="20"   # Node.js LTS version
LOG_DIR="/var/log/${APP_NAME}"

# -------------------------------------------------------
# Helpers
# -------------------------------------------------------
info()  { echo -e "\033[1;34m[INFO]\033[0m  $*"; }
ok()    { echo -e "\033[1;32m[ OK ]\033[0m  $*"; }
warn()  { echo -e "\033[1;33m[WARN]\033[0m  $*"; }
err()   { echo -e "\033[1;31m[ERR ]\033[0m  $*" >&2; exit 1; }

# -------------------------------------------------------
# First-time server setup (run once as root)
# -------------------------------------------------------
setup_server() {
  info "=== First-time server setup ==="

  # 1. Update system packages
  info "Updating system packages..."
  apt-get update -y && apt-get upgrade -y

  # 2. Install Node.js via NodeSource
  if ! command -v node &>/dev/null; then
    info "Installing Node.js ${NODE_VERSION}..."
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash -
    apt-get install -y nodejs
  else
    ok "Node.js $(node -v) already installed"
  fi

  # 3. Install PM2 globally
  if ! command -v pm2 &>/dev/null; then
    info "Installing PM2..."
    npm install -g pm2
  else
    ok "PM2 $(pm2 -v) already installed"
  fi

  # 4. Install Nginx
  if ! command -v nginx &>/dev/null; then
    info "Installing Nginx..."
    apt-get install -y nginx
    systemctl enable nginx
  else
    ok "Nginx already installed"
  fi

  # 5. Install Certbot for SSL
  if ! command -v certbot &>/dev/null; then
    info "Installing Certbot..."
    apt-get install -y certbot python3-certbot-nginx
  else
    ok "Certbot already installed"
  fi

  # 6. Create app directory
  mkdir -p "${APP_DIR}" "${LOG_DIR}"

  # 7. Clone the repository
  if [ ! -d "${APP_DIR}/.git" ]; then
    info "Cloning repository..."
    git clone --branch "${BRANCH}" "${REPO_URL}" "${APP_DIR}"
  else
    ok "Repository already cloned"
  fi

  # 8. Copy Nginx config
  info "Installing Nginx configuration..."
  cp "${APP_DIR}/nginx.conf" "/etc/nginx/sites-available/${APP_NAME}"
  ln -sf "/etc/nginx/sites-available/${APP_NAME}" "/etc/nginx/sites-enabled/${APP_NAME}"
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl reload nginx

  # 9. Create log directory with correct permissions
  chown -R www-data:www-data "${LOG_DIR}" 2>/dev/null || true

  info ""
  info "=== Server setup complete ==="
  info ""
  warn "NEXT STEPS:"
  warn "  1. Create your .env.local file:"
  warn "       cp ${APP_DIR}/.env.example ${APP_DIR}/.env.local"
  warn "       nano ${APP_DIR}/.env.local   # add GEMINI_API_KEY and ADMIN_PASSWORD"
  warn ""
  warn "  2. Update the domain in Nginx config:"
  warn "       nano /etc/nginx/sites-available/${APP_NAME}"
  warn "       # Replace YOUR_DOMAIN.com with your actual domain"
  warn "       nginx -t && systemctl reload nginx"
  warn ""
  warn "  3. Obtain SSL certificate:"
  warn "       certbot --nginx -d YOUR_DOMAIN.com -d www.YOUR_DOMAIN.com"
  warn ""
  warn "  4. Run the app:"
  warn "       bash ${APP_DIR}/deploy.sh"
  warn ""
  warn "  5. Enable PM2 auto-start on reboot:"
  warn "       pm2 save && pm2 startup"
}

# -------------------------------------------------------
# Deploy / update the application
# -------------------------------------------------------
deploy_app() {
  info "=== Deploying ${APP_NAME} ==="

  if [ ! -d "${APP_DIR}/.git" ]; then
    err "App directory not found at ${APP_DIR}. Run: sudo bash deploy.sh --setup first."
  fi

  cd "${APP_DIR}"

  # Pull latest code
  info "Pulling latest code from ${BRANCH}..."
  git fetch origin "${BRANCH}"
  git reset --hard "origin/${BRANCH}"

  # Check .env.local exists
  if [ ! -f ".env.local" ]; then
    warn ".env.local not found! Copying from .env.example..."
    cp .env.example .env.local
    warn "Edit .env.local and add your GEMINI_API_KEY before the app will work:"
    warn "  nano ${APP_DIR}/.env.local"
  fi

  # Ensure data directory exists (for file-based settings storage)
  mkdir -p data

  # Install / update dependencies
  info "Installing dependencies..."
  npm ci --omit=dev

  # Build the Next.js app
  info "Building application..."
  npm run build

  # Start or restart via PM2
  if pm2 describe "${APP_NAME}" &>/dev/null; then
    info "Restarting PM2 process..."
    pm2 restart "${APP_NAME}" --update-env
  else
    info "Starting PM2 process for the first time..."
    pm2 start ecosystem.config.js --env production
  fi

  pm2 save

  ok ""
  ok "=== Deployment complete! ==="
  ok "  App running at:  http://localhost:3000"
  ok "  PM2 status:      pm2 status"
  ok "  Logs:            pm2 logs ${APP_NAME}"
}

# -------------------------------------------------------
# Entry point
# -------------------------------------------------------
case "${1:-}" in
  --setup)
    [ "$(id -u)" -eq 0 ] || err "Run setup as root: sudo bash deploy.sh --setup"
    setup_server
    ;;
  *)
    deploy_app
    ;;
esac
