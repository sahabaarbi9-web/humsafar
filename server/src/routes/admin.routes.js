// src/routes/admin.routes.js — secure operations dashboard API
const express = require('express');
const db = require('../db/database');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const config = require('../config/config');
const adminModel = require('../models/admin.model');
const userModel = require('../models/user.model');
const reportModel = require('../models/report.model');
const authService = require('../services/auth.service');
const profileService = require('../services/profile.service');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { positiveIntParam } = require('../middleware/validate');
const { requireFields, assertEmail } = require('../utils/validators');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Admin login (separate from normal login — same token, role-gated)
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  requireFields(req.body, ['email', 'password']);
  assertEmail(email);
  const user = userModel.findByEmail(email.toLowerCase());
  if (!user || !adminModel.isAdminUser(user.id) || user.role !== 'ADMIN') {
    throw new AppError('Invalid admin credentials.', 401, 'INVALID_CREDENTIALS');
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new AppError('Invalid admin credentials.', 401, 'INVALID_CREDENTIALS');
  const { token } = authService.signToken(user.id, true);
  authService.persistSession(user.id, token);
  res.locals.admin = true;
  res.json({ success: true, data: { token, user: { id: user.id, name: user.name, email: user.email, role: 'ADMIN' } } });
}));

router.use(requireAuth, requireAdmin);
router.use('/session-stats', (req, res, next) => {
  adminModel.touchLogin(req.user.id);
  next();
});

// Dashboard overview
router.get('/dashboard', asyncHandler(async (req, res) => {
  const totals = (table, cond = '1') => db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${cond}`).get().n;
  const countSelector = (sql) => db.prepare(sql).get().n;
  const recentUsers = db.prepare(`
    SELECT u.id, u.name, u.email, u.gender, u.location, u.status, u.created_at,
      (SELECT url FROM photos WHERE user_id = u.id AND is_primary = 1 LIMIT 1) AS photo
    FROM users u ORDER BY u.id DESC LIMIT 10
  `).all();
  res.json({ success: true, data: {
    counts: {
      users: totals('users', 'status = \'ACTIVE\''),
      banned: totals('users', "status = 'BANNED'"),
      admins: countSelector('SELECT COUNT(*) AS n FROM admin_users'),
      likes: totals('likes'),
      superLikes: totals('super_likes'),
      passes: totals('passes'),
      matches: totals('matches'),
      messages: totals('messages'),
      conversations: totals('conversations'),
      calls: totals('calls'),
      dates: totals('dates'),
      games: totals('games'),
      openReports: reportModel.countOpen(),
      onlineNow: totals('profiles', 'online = 1')
    },
    recentUsers
  } });
}));

// Users
router.get('/users', asyncHandler(async (req, res) => {
  const q = req.query.q ? ` AND (u.name LIKE '%${String(req.query.q).replace(/'/g, "''")}%' OR u.email LIKE '%${String(req.query.q).replace(/'/g, "''")}%')` : '';
  const status = req.query.status && req.query.status !== 'all' ? ` AND u.status = '${String(req.query.status).replace(/'/g, "''")}'` : '';
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const offset = (page - 1) * limit;
  const rows = db.prepare(`
    SELECT u.id, u.name, u.email, u.gender, u.location, u.status, u.role, u.created_at,
      (SELECT url FROM photos WHERE user_id = u.id AND is_primary = 1 LIMIT 1) AS photo,
      (SELECT COUNT(*) FROM likes WHERE from_user = u.id) AS likes_sent,
      (SELECT COUNT(*) FROM matches WHERE user_a = u.id OR user_b = u.id) AS matches,
      (SELECT COUNT(*) FROM reports WHERE reported = u.id AND status = 'OPEN') AS open_reports
    FROM users u WHERE 1=1 ${q} ${status}
    ORDER BY u.id DESC LIMIT ? OFFSET ?
  `).all(limit, offset);
  const total = db.prepare(`SELECT COUNT(*) AS n FROM users u WHERE 1=1 ${q} ${status}`).get().n;
  res.json({ success: true, data: { users: rows, total, page, limit } });
}));

router.get('/users/:id', positiveIntParam('id'), asyncHandler(async (req, res) => {
  const u = userModel.findById(req.params.id);
  if (!u) throw new AppError('User not found.', 404, 'NOT_FOUND');
  const authed = profileService.buildOwn(u.id);
  const reports = reportModel.listAdmin(null, 100).filter((r) => r.reported === u.id || r.reporter === u.id);
  const blockModel = require('../models/block.model');
  res.json({ success: true, data: {
    user: authed,
    reports: reports.map((r) => ({ id: r.id, reason: r.reason, details: r.details, status: r.status, reporter: r.reporter_name, reported: r.reported_name, createdAt: r.created_at })),
    blocks: blockModel.listForUser(u.id)
  } });
}));

router.post('/users/:id/status', positiveIntParam('id'), asyncHandler(async (req, res) => {
  const { status } = req.body;
  requireFields(req.body, ['status']);
  const allowed = ['ACTIVE', 'SUSPENDED', 'BANNED'];
  if (!allowed.includes(status)) throw new AppError('Invalid status.', 422, 'VALIDATION_ERROR');
  const u = userModel.findById(req.params.id);
  if (!u) throw new AppError('User not found.', 404, 'NOT_FOUND');
  if (u.role === 'ADMIN' && status !== 'ACTIVE') throw new AppError('Cannot suspend an admin.', 403, 'FORBIDDEN');
  userModel.setStatus(u.id, status);
  if (status !== 'ACTIVE') db.prepare("UPDATE auth_tokens SET revoked_at = datetime('now') WHERE user_id = ? AND kind = 'SESSION'").run(u.id);
  res.json({ success: true, data: { ok: true } });
}));

router.post('/users/:id/promote-admin', positiveIntParam('id'), asyncHandler(async (req, res) => {
  const u = userModel.findById(req.params.id);
  if (!u) throw new AppError('User not found.', 404, 'NOT_FOUND');
  adminModel.addAdmin(u.id, req.user.id);
  res.json({ success: true, data: { ok: true } });
}));

router.post('/users/:id/demote-admin', positiveIntParam('id'), asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) throw new AppError('Cannot demote yourself.', 403, 'FORBIDDEN');
  const u = userModel.findById(req.params.id);
  if (!u) throw new AppError('User not found.', 404, 'NOT_FOUND');
  db.prepare('DELETE FROM admin_users WHERE user_id = ?').run(u.id);
  db.prepare("UPDATE users SET role = 'USER' WHERE id = ?").run(u.id);
  res.json({ success: true, data: { ok: true } });
}));

// Reports
router.get('/reports', asyncHandler(async (req, res) => {
  const status = req.query.status && req.query.status !== 'all' ? req.query.status : null;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const rows = reportModel.listAdmin(status, limit).map((r) => ({
    id: r.id, reason: r.reason, details: r.details, status: r.status,
    reporter: { id: r.reporter, name: r.reporter_name }, reported: { id: r.reported, name: r.reported_name, status: r.reported_status },
    created_at: r.created_at, resolved_at: r.resolved_at
  }));
  const open = reportModel.countOpen();
  res.json({ success: true, data: { reports: rows, openReports: open, countResolved: db.prepare("SELECT COUNT(*) AS n FROM reports WHERE status = 'RESOLVED'").get().n } });
}));

router.post('/reports/:id/status', positiveIntParam('id'), asyncHandler(async (req, res) => {
  const { status, actionTaken } = req.body;
  requireFields(req.body, ['status']);
  if (!['OPEN', 'RESOLVED', 'IGNORED'].includes(status)) throw new AppError('Invalid status.', 422, 'VALIDATION_ERROR');
  const report = reportModel.setStatus(req.params.id, status, actionTaken, req.user.id);
  if (!report) throw new AppError('Report not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: { report: { id: report.id, status: report.status } } });
}));

// Meta / interests / locations / gender dist
router.get('/interests', asyncHandler(async (req, res) => {
  const interestModel = require('../models/interest.model');
  res.json({ success: true, data: { interests: interestModel.listAll() } });
}));

module.exports = router;