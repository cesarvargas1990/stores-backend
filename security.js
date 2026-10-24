import crypto from 'node:crypto';

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}
export function verifyPassword(password, stored) {
  const [salt, expected] = String(stored).split(':');
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}
export function safeEqual(a, b) {
  const aa = Buffer.from(String(a || '')); const bb = Buffer.from(String(b || ''));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}
export function cleanText(value, max = 2000) { return String(value ?? '').trim().slice(0, max); }
export function cleanUrl(value) {
  const valueText = cleanText(value, 1000);
  if (!valueText) return '';
  try { const parsed = new URL(valueText, 'http://localhost'); return ['http:', 'https:'].includes(parsed.protocol) ? valueText : ''; }
  catch { return ''; }
}
export function slug(value) { return cleanText(value, 80).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
