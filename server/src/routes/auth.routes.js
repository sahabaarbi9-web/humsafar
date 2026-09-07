// src/routes/auth.routes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const config = require('../config/config');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const authService = require('../services/auth.service');
const userModel = require('../models/user.model');
const adminModel = require('../models/admin.model');
const tokenModel = require('../models/token.model');
const { requireFields, assertEmail, requireMinAge } = require('../utils/validators');
const { randomToken, hashToken } = require('../utils/token');
const mailService = require('../services/mail.service');
const { requireAuth } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');
const router = express.Router();

const GENDERS = ['Female', 'Male', 'Other'];
const LOCATIONS = ['Lahore', 'Karachi', 'Islamabad', 'Multan', 'Rawalpindi', 'Faisalabad', 'Peshawar', 'Quetta'];

function setCookie(res, token, remember) {
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'lax',
    maxAge: remember ? 30 * 24 * 3600 * 1000 : 7 * 24 * 3600 * 1000,
    path: '/'
  });
}

function clearCookie(res) {
  res.clearCookie(config.cookieName, { path: '/' });
}

const registerLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, label: 'sign-up attempts' });

router.post('/register', registerLimiter, asyncHandler(async (req, res) => {
  const { name, email, password, dob, gender, location } = req.body;
  requireFields(req.body, ['name', 'email', 'password', 'dob', 'gender', 'location']);
  assertEmail(email);

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 50) {
    throw new AppError('Name must be between 2 and 50 characters.', 422, 'VALIDATION_ERROR');
  }
  if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
    throw new AppError('Password must be at least 6 characters.', 422, 'VALIDATION_ERROR');
  }
  if (!GENDERS.includes(gender)) throw new AppError('Invalid gender.', 422, 'VALIDATION_ERROR');

  requireMinAge(dob, config.minAge);

  const existing = userModel.findByEmail(email);
  if (existing) throw new AppError('An account with this email already exists.', 409, 'EMAIL_TAKEN');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = userModel.create({ name: name.trim(), email, passwordHash, dob, gender, location });

  // Email verification token (mock delivery, SMTP-ready)
  const vToken = randomToken();
  const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19);
  tokenModel.createToken({ userId: user.id, tokenHash: hashToken(vToken), kind: 'EMAIL_VERIFY', expiresAt });
  const verifyUrl = `${config.appUrl}/verify-email?token=${vToken}`;
  await mailService.sendVerificationEmail(user.email, verifyUrl);

  const { token } = authService.signToken(user.id, false);
  authService.persistSession(user.id, token);
  setCookie(res, token, false);

  res.status(201).json({
    success: true,
    data: {
      token,
      user: { id: user.id, name: user.name, email: user.email, gender: user.gender, location: user.location },
      verifyUrl // exposed only so the mock flow is usable end-to-end
    }
  });
}));

router.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 15, label: 'login attempts' }), asyncHandler(async (req, res) => {
  const { email, password, remember } = req.body;
  requireFields(req.body, ['email', 'password']);
  assertEmail(email);

  const user = userModel.findByEmail(email);
  // constant-ish timing: always compare against a hash when user missing
  const ok = user ? await bcrypt.compare(password, user.password_hash) : false;
  if (!user || !ok) throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  if (user.status !== 'ACTIVE') throw new AppError('Your account is not active. Contact support.', 403, 'FORBIDDEN');

  const rememberMe = remember === true || remember === 'true' || remember === 1;
  const { token } = authService.signToken(user.id, rememberMe);
  authService.persistSession(user.id, token);
  setCookie(res, token, rememberMe);

  res.json({
    success: true,
    data: {
      token,
      role: user.role,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: null }
    }
  });
}));

router.post('/logout', requireAuth, asyncHandler(async (req, res) => {
  if (req.rawToken) authService.revokeSession(req.rawToken);
  userModel.setOffline(req.user.id);
  clearCookie(res);
  res.json({ success: true, data: { message: 'Logged out.' } });
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const profileService = require('../services/profile.service');
  const me = profileService.buildOwn(req.user.id);
  res.json({ success: true, data: { user: me } });
}));

router.get('/verify-email', asyncHandler(async (req, res) => {
  const token = req.query.token;
  if (!token) throw new AppError('Missing verification token.', 422, 'VALIDATION_ERROR');
  const row = tokenModel.findValid(hashToken(token), 'EMAIL_VERIFY');
  if (!row) throw new AppError('Invalid or expired verification link.', 400, 'INVALID_TOKEN');
  userModel.setEmailVerified(row.user_id, 1);
  tokenModel.revoke(row.id);
  res.json({ success: true, data: { message: 'Email verified successfully.' } });
}));

router.post('/forgot-password', rateLimit({ windowMs: 15 * 60 * 1000, max: 5, label: 'password reset requests' }), asyncHandler(async (req, res) => {
  const { email } = req.body;
  assertEmail(email);
  const user = userModel.findByEmail(email);
  // Never reveal whether the account exists.
  if (user) {
    const rToken = randomToken();
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19);
    tokenModel.createToken({ userId: user.id, tokenHash: hashToken(rToken), kind: 'PASSWORD_RESET', expiresAt });
    const resetUrl = `${config.appUrl}/reset-password?token=${rToken}`;
    await mailService.sendPasswordReset(user.email, resetUrl);
    return res.json({ success: true, data: { message: 'If that email exists, a reset link has been sent.', resetUrl } });
  }
  res.json({ success: true, data: { message: 'If that email exists, a reset link has been sent.' } });
}));

router.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  requireFields(req.body, ['token', 'password']);
  if (typeof password !== 'string' || password.length < 6) {
    throw new AppError('Password must be at least 6 characters.', 422, 'VALIDATION_ERROR');
  }
  const row = tokenModel.findValid(hashToken(token), 'PASSWORD_RESET');
  if (!row) throw new AppError('Invalid or expired reset token.', 400, 'INVALID_TOKEN');
  const passwordHash = await bcrypt.hash(password, 10);
  userModel.setPassword(row.user_id, passwordHash);
  tokenModel.revoke(row.id);
  res.json({ success: true, data: { message: 'Password reset successfully. Please log in.' } });
}));

// Simple password-less pages endpoint info (frontend consumes APP_URL + token)
router.get('/pages', (req, res) => {
  res.json({ success: true, data: { varify: `${config.appUrl}/verify-email`, reset: `${config.appUrl}/reset-password` } });
});

module.exports = router;