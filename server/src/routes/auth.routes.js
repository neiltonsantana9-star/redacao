import { Router } from 'express';
import { requireAuth, signToken, setAuthCookie, clearAuthCookie } from '../middleware/auth.js';
import { asyncHandler, ok, fail } from '../utils.js';
import * as authService from '../services/auth.service.js';

const router = Router();

router.post('/register', asyncHandler(async (req, res) => {
  if (process.env.ALLOW_REGISTER === '0') {
    return fail(res, 403, 'Cadastro público desativado. Peça ao administrador que crie sua conta.');
  }
  const user = await authService.register(req.body);
  const token = signToken(user);
  setAuthCookie(res, token);
  return ok(res, { user, token });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const user = await authService.login(req.body);
  const token = signToken(user);
  setAuthCookie(res, token);
  return ok(res, { user, token });
}));

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  return ok(res);
});

router.get('/me', requireAuth, (req, res) => {
  return ok(res, { user: { id: req.user.id, email: req.user.email, name: req.user.name } });
});

export default router;