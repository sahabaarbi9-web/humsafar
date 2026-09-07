// src/services/upload.service.js — multer config + file storage abstraction
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const config = require('../config/config');

fs.mkdirSync(config.uploadsDir, { recursive: true });

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

function sanitizeExt(mime) {
  return { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/avif': '.avif' }[mime] || '.jpg';
}

// easiest to validate type from buffer signature — we use multer mimetype + size here
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.uploadsDir),
  filename: (req, file, cb) => {
    const ext = sanitizeExt(file.mimetype);
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxUploadBytes, files: config.maxPhotos },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) return cb(new Error('Only JPEG, PNG, WEBP, GIF and AVIF images are allowed.'));
    cb(null, true);
  }
});

function toPublicUrl(filename) {
  return `${config.uploadsUrl}/${path.basename(filename)}`;
}

function removeFile(filePath) {
  try { fs.unlinkSync(filePath); } catch { /* ignore */ }
}

module.exports = { upload, toPublicUrl, removeFile, ALLOWED };