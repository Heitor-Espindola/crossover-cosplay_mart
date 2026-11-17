import jwt from 'jsonwebtoken';
import { db } from './db.js';

// Em produção JWT_SECRET é obrigatório (ver README). O fallback só existe
// para rodar localmente sem configurar nada.
const SECRET = process.env.JWT_SECRET || 'crossover-dev-secret-change-me';
const MAX_AGE = 60 * 60 * 24 * 7;
const isProd = process.env.NODE_ENV === 'production';

if (isProd && !process.env.JWT_SECRET) {
  console.warn('[auth] ATENÇÃO: defina JWT_SECRET nas variáveis de ambiente.');
}

export function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '7d' });
}

export function setAuthCookie(res, token) {
  res.cookie('cx_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd, // Railway serve em HTTPS
    maxAge: MAX_AGE * 1000,
    path: '/',
  });
}

export function clearAuthCookie(res) {
  res.clearCookie('cx_token', { path: '/', httpOnly: true, sameSite: 'lax', secure: isProd });
}

export function publicUser(row) {
  if (!row) return null;
  return { id: row.id, name: row.name, email: row.email, role: row.role, phone: row.phone, cpf: row.cpf, createdAt: row.created_at };
}

export async function currentUser(req) {
  const token = req.cookies?.cx_token || (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return null;
  try {
    const payload = jwt.verify(token, SECRET);
    const row = await db.prepare('SELECT * FROM users WHERE id = ?').get(payload.id);
    return publicUser(row);
  } catch {
    return null;
  }
}

export async function requireAuth(req, res, next) {
  const user = await currentUser(req);
  if (!user) return res.status(401).json({ error: 'É preciso estar autenticado.' });
  req.user = user;
  next();
}

export async function requireAdmin(req, res, next) {
  const user = await currentUser(req);
  if (!user) return res.status(401).json({ error: 'É preciso estar autenticado.' });
  if (user.role !== 'admin') return res.status(403).json({ error: 'Acesso restrito à equipe Crossover.' });
  req.user = user;
  next();
}
