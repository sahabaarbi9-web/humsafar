// src/utils/validators.js — lightweight input validation helpers
const AppError = require('./AppError');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function requireFields(body, fields) {
  for (const f of fields) {
    const v = body[f];
    if (v === undefined || v === null || (typeof v === 'string' && !v.trim())) {
      throw new AppError(`Field '${f}' is required.`, 422, 'VALIDATION_ERROR');
    }
  }
}

function isValidEmail(v) { return typeof v === 'string' && EMAIL_RE.test(v.trim()); }

function assertEmail(v, label = 'email') {
  if (!isValidEmail(v)) throw new AppError(`Invalid ${label}.`, 422, 'VALIDATION_ERROR');
}

function isValidDate(v) {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v));
}

function ageFromDob(dob) {
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function requireMinAge(dob, minAge) {
  if (!isValidDate(dob)) throw new AppError('Invalid date of birth.', 422, 'VALIDATION_ERROR');
  if (ageFromDob(dob) < minAge) throw new AppError(`You must be at least ${minAge} to join Humsafar.`, 422, 'AGE_RESTRICTED');
}

function isInt(v) { return Number.isInteger(v); }

function strLen(v, min, max, label) {
  if (typeof v !== 'string') throw new AppError(`${label} must be a string.`, 422, 'VALIDATION_ERROR');
  if (v.length < min || v.length > max) throw new AppError(`${label} must be between ${min} and ${max} characters.`, 422, 'VALIDATION_ERROR');
}

module.exports = { requireFields, isValidEmail, assertEmail, isValidDate, ageFromDob, requireMinAge, isInt, strLen };