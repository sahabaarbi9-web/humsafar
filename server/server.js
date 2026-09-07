// server.js — Humsafar backend entry (also exports app for serverless/Vercel)
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./src/config/config');

const { notFound, errorHandler } = require('./src/middleware/errorHandler');

const app = express();
app.set('trust proxy', 1);

app.use(cors({ origin: config.corsOrigin === '*' ? true : config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static uploads
app.use(config.uploadsUrl, express.static(config.uploadsDir, { maxAge: '1d' }));

// API routes
const publicRoutes = require('./src/routes/public.routes');
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const discoverRoutes = require('./src/routes/discover.routes');
const interactionRoutes = require('./src/routes/interaction.routes');
const matchRoutes = require('./src/routes/match.routes');
const conversationRoutes = require('./src/routes/conversation.routes');
const notificationRoutes = require('./src/routes/notification.routes');
const callRoutes = require('./src/routes/call.routes');
const dateRoutes = require('./src/routes/date.routes');
const gameRoutes = require('./src/routes/game.routes');
const blockRoutes = require('./src/routes/block.routes');
const reportRoutes = require('./src/routes/report.routes');
const adminRoutes = require('./src/routes/admin.routes');

app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/dates', dateRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    data: {
      appUrl: config.appUrl,
      stun: config.stunUrl,
      turn: config.turnUrl ? { url: config.turnUrl, username: config.turnUser, credential: config.turnPass } : null,
      aws: null
    }
  });
});

// Serve frontend SPA (/) and admin dashboard (/admin)
app.use('/admin', express.static(path.join(config.adminDir)));
app.use(express.static(config.frontendDir));

// Any other SPA-ish GET -> index.html for deep links
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return notFound(req, res);
  res.sendFile(path.join(config.frontendDir, 'index.html'));
});

app.use(notFound);
app.use(errorHandler);

// Only listen when run directly (not when imported by a serverless wrapper)
if (require.main === module) {
  const server = app.listen(config.port, () => {
    console.log(`Humsafar server running on http://localhost:${config.port}`);
  });
  module.exports = server;
} else {
  module.exports = app;
}