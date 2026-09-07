// src/services/mail.service.js — mock (console/log) + SMTP-ready via nodemailer
const config = require('../config/config');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const { host, user, pass, port, secure } = config.mail;
  if (!host || !user || !pass) return null;
  // lazy require so nodemailer is only loaded when SMTP is configured
  const nodemailer = require('nodemailer');
  transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
  return transporter;
}

async function send({ to, subject, text, html }) {
  if (!to) return { delivered: false, reason: 'no-recipient' };
  const t = getTransporter();
  const logLine = `[mail] To: ${to} | Subject: ${subject}\n${text}\n${html ? '' : ''}`;
  console.log(logLine);

  if (t) {
    try {
      await t.sendMail({ from: config.mail.from, to, subject, text, html });
      return { delivered: true, via: 'smtp' };
    } catch (err) {
      console.warn('[mail] SMTP send failed, falling back to console:', err.message);
      return { delivered: false, via: 'smtp', error: err.message };
    }
  }
  return { delivered: false, via: 'console' };
}

async function sendVerificationEmail(to, verifyUrl) {
  return send({
    to,
    subject: 'Verify your Humsafar email 💌',
    text: `Welcome to Humsafar! Verify your email to continue:\n${verifyUrl}\n\nThis link is valid for 24 hours.`,
    html: `<div style="font-family:sans-serif;background:#0a0a0f;color:#fff;padding:28px;border-radius:16px">
      <h2 style="color:#ff2d78">♥ Humsafar</h2>
      <p>Welcome! Verify your email to start meeting people.</p>
      <a href="${verifyUrl}" style="display:inline-block;padding:12px 22px;background:linear-gradient(135deg,#ff2d78,#7c3aed);color:#fff;border-radius:99px;text-decoration:none;font-weight:600">Verify Email</a>
      <p style="opacity:.6;font-size:13px">Link valid for 24 hours.</p>
    </div>`
  });
}

async function sendPasswordReset(to, resetUrl) {
  return send({
    to,
    subject: 'Reset your Humsafar password 🔑',
    text: `Forgot your password? Reset it here:\n${resetUrl}\n\nThis link is valid for 1 hour. If you didn't ask, ignore this email.`,
    html: `<div style="font-family:sans-serif;background:#0a0a0f;color:#fff;padding:28px;border-radius:16px">
      <h2 style="color:#ff2d78">♥ Humsafar</h2>
      <p>We received a request to reset your password.</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 22px;background:linear-gradient(135deg,#ff2d78,#7c3aed);color:#fff;border-radius:99px;text-decoration:none;font-weight:600">Reset Password</a>
      <p style="opacity:.6;font-size:13px">Link valid for 1 hour.</p>
    </div>`
  });
}

module.exports = { send, sendVerificationEmail, sendPasswordReset };