// src/db/migrate.js — run pending migrations (idempotent)
const fs = require('fs');
const path = require('path');
const db = require('./database');

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

function appliedNames() {
  return db.prepare('SELECT name FROM schema_migrations').all().map((r) => r.name);
}

function run() {
  const applied = new Set(appliedNames());
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const applyStmt = db.prepare('INSERT INTO schema_migrations (name) VALUES (?)');
  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    db.exec(sql);
    applyStmt.run(file);
    console.log('Applied migration:', file);
    count++;
  }
  if (count === 0) console.log('No pending migrations.');

  // Always ensure default interests exist.
  require('../models/interest.model').ensureDefaults();
  console.log('Default interests ensured.');
  console.log('Migration complete.');
  return count;
}

if (require.main === module) run();

module.exports = { run };