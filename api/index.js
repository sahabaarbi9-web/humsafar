// api/index.js — Vercel serverless entry for the Humsafar Express app.
//
// Vercel's function filesystem is read-only except /tmp (ephemeral, reset on
// every cold start). We therefore point the SQLite database AND the photo
// uploads at writable /tmp paths and re-migrate + re-seed on each cold start.
// The full seed is idempotent, so a fresh demo DB is produced every time — a
// perfect resettable demo. Data does not persist between deploys (intended).

const os = require('os');
const path = require('path');

// Point writable state at /tmp BEFORE anything requires config/db.
process.env.DATABASE_URL =
  process.env.DATABASE_URL || path.join(os.tmpdir(), 'humsafar-demo.db');
process.env.UPLOADS_DIR =
  process.env.UPLOADS_DIR || path.join(os.tmpdir(), 'humsafar-uploads');
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Migrate + seed (idempotent) before serving any request. seed() must be
// awaited — tables are created lazily on first cold start.
const seedReady = (async () => {
  try {
    const { seed } = require('../server/seed/seed');
    await seed();
    console.log('[humsafar] seed ready');
  } catch (e) {
    console.error('[humsafar] seed failed', e);
  }
})();

const app = require('../server/server');

module.exports = (req, res) => {
  seedReady.then(() => app(req, res)).catch((e) => {
    res.status(500).json({ success: false, message: 'Startup failed: ' + e.message, code: 'STARTUP_ERROR' });
  });
};