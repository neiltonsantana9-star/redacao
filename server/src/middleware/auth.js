import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

export function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, {
    expiresIn: '7d'
  });
}

export function requireAuth(req, res, next) {
  let token = null;
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) token = auth.slice(7);
  if (!token && req.cookies) token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ ok: false, message: 'Não autenticado' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ ok: false, message: 'Sessão inválida ou expirada' });
  }
}

export function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 3600 * 1000,
    path: '/'
  });
}

export function clearAuthCookie(res) {
  res.clearCookie('token', { path: '/' });
}