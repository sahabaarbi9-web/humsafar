// src/middleware/rateLimit.js — using express-rate-limit
const rateLimitPkg = require('express-rate-limit');
const config = require('../config/config');

function rateLimit({ windowMs = config.rateLimit.windowMs, max = config.rateLimit.max, label = 'requests' } = {}) {
  return rateLimitPkg({
    windowMs,
    max,
    message: { success: false, message: `Too many ${label}. Please slow down.`, code: 'RATE_LIMIT' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip
  });
}

module.exports = { rateLimit };