// src/db/transaction.js — manual transaction wrapper for node:sqlite
const db = require('./database');

let depth = 0;

function transaction(fn) {
  return function (...args) {
    const isOuter = depth === 0;
    if (isOuter) db.exec('BEGIN');
    depth++;
    try {
      const result = fn.apply(this, args);
      if (isOuter) db.exec('COMMIT');
      return result;
    } catch (err) {
      if (isOuter) db.exec('ROLLBACK');
      throw err;
    } finally {
      depth--;
    }
  };
}

module.exports = { transaction };