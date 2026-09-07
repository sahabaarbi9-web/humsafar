// src/db/database.js — SQLite connection using Node's built-in node:sqlite
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

if (!fs.existsSync(path.dirname(config.dbPath))) {
  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
}

const db = new DatabaseSync(config.dbPath);

db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

// Named-parameter convenience. node:sqlite accepts objects for named params,
// but we normalize string/number binding explicitly for clarity.
db.prepareStmt = null; // (reserved)

module.exports = db;