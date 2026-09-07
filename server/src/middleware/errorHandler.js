// src/middleware/errorHandler.js — uniform API error responses
function notFound(req, res, next) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}`, code: 'NOT_FOUND' });
}

function errorHandler(err, req, res, next) {
  // Multer errors
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'Image is too large. Max 5MB allowed.', code: 'FILE_TOO_LARGE' });
  }
  if (err && err.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json({ success: false, message: 'Too many photos at once.', code: 'FILE_LIMIT' });
  }
  if (err && err.message && err.message.includes('Only JPEG')) {
    return res.status(415).json({ success: false, message: err.message, code: 'UNSUPPORTED_MEDIA' });
  }

  const status = err.status || err.statusCode || 500;
  const message = status >= 500
    ? 'Something went wrong on our side. Please try again.'
    : (err.message || 'Request failed.');
  const code = status >= 500 ? 'SERVER_ERROR' : (err.code || 'ERROR');

  if (status >= 500) console.error('[error]', err);

  res.status(status).json({ success: false, message, code });
}

module.exports = { notFound, errorHandler };