// src/config/config.js — environment variables & app config
// All paths resolved as ABSOLUTE relative to the server directory (CWD-independent).
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const serverRoot = path.join(__dirname, '..', '..');

function resolveFromServer(p) {
  return path.isAbsolute(p) ? p : path.resolve(serverRoot, p);
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  authSecret: process.env.AUTH_SECRET || 'humsafar-dev-secret-change-me',
  tokenExpiry: process.env.TOKEN_EXPIRY || '7d',
  rememberExpiry: process.env.REMEMBER_EXPIRY || '30d',
  cookieName: process.env.COOKIE_NAME || 'humsafar_token',
  cookieSecure: process.env.COOKIE_SECURE === 'true' || (process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false'),
  dbPath: process.env.DATABASE_URL
    ? resolveFromServer(process.env.DATABASE_URL)
    : path.join(serverRoot, 'data', 'humsafar.db'),
  frontendDir: process.env.FRONTEND_DIR
    ? resolveFromServer(process.env.FRONTEND_DIR)
    : path.join(serverRoot, '..'),
  adminDir: process.env.ADMIN_DIR
    ? resolveFromServer(process.env.ADMIN_DIR)
    : path.join(serverRoot, '..', 'admin'),
  uploadsDir: process.env.UPLOADS_DIR
    ? resolveFromServer(process.env.UPLOADS_DIR)
    : path.join(serverRoot, '..', 'uploads'),
  uploadsUrl: process.env.UPLOADS_URL || '/uploads',
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES) || 5 * 1024 * 1024,
  maxPhotos: Number(process.env.MAX_PHOTOS) || 9,
  minAge: Number(process.env.MIN_AGE) || 18,
  mail: {
    from: process.env.MAIL_FROM || 'Humsafar <no-reply@humsafar.app>',
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    secure: process.env.SMTP_SECURE === 'true'
  },
  appUrl: process.env.APP_URL || 'http://localhost:4000',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 300
  },
  stunUrl: process.env.RTC_STUN_URL || 'stun:stun.l.google.com:19302',
  turnUrl: process.env.RTC_TURN_URL || '',
  turnUser: process.env.RTC_TURN_USER || '',
  turnPass: process.env.RTC_TURN_PASS || ''
};

module.exports = config;