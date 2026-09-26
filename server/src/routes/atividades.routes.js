import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, ok } from '../utils.js';
import { db } from '../db.js';
import * as atividadesService from '../services/atividades.service.js';

const router = Router();
router.use(requireAuth);

function checkOwnership(userId, turmaId) {
  const row = db.prepare('SELECT id FROM turmas WHERE id = ? AND user_id = ?').get(turmaId, userId);
  if (!row) throw Object.assign(new Error('Turma não encontrada'), { status: 404 });
}

router.get('/turma/:turmaId', asyncHandler(async (req, res) => {
  const turmaId = Number(req.params.turmaId);
  checkOwnership(req.user.id, turmaId);
  return ok(res, { atividades: atividadesService.listAtividades(turmaId) });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const atv = atividadesService.getAtividade(Number(req.params.id));
  checkOwnership(req.user.id, atv.turma_id);
  return ok(res, { atividade: atv });
}));

router.post('/turma/:turmaId', asyncHandler(async (req, res) => {
  const turmaId = Number(req.params.turmaId);
  checkOwnership(req.user.id, turmaId);
  const atividade = atividadesService.createAtividade(turmaId, req.body);
  return ok(res, { atividade }, 201);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const atv = atividadesService.getAtividade(Number(req.params.id));
  checkOwnership(req.user.id, atv.turma_id);
  const atividade = atividadesService.updateAtividade(atv.turma_id, atv.id, req.body);
  return ok(res, { atividade });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const atv = atividadesService.getAtividade(Number(req.params.id));
  checkOwnership(req.user.id, atv.turma_id);
  atividadesService.deleteAtividade(atv.turma_id, atv.id);
  return ok(res);
}));

export default router;