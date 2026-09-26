import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, ok, fail } from '../utils.js';
import * as turmasService from '../services/turmas.service.js';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  return ok(res, { turmas: turmasService.listTurmas(req.user.id) });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const turma = turmasService.getTurma(req.user.id, Number(req.params.id));
  return ok(res, { turma });
}));

router.post('/', asyncHandler(async (req, res) => {
  const turma = turmasService.createTurma(req.user.id, req.body);
  return ok(res, { turma }, 201);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const turma = turmasService.updateTurma(req.user.id, Number(req.params.id), req.body);
  return ok(res, { turma });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  turmasService.deleteTurma(req.user.id, Number(req.params.id));
  return ok(res);
}));

// -------- Alunos --------
router.get('/:id/alunos', asyncHandler(async (req, res) => {
  const turma = turmasService.getTurma(req.user.id, Number(req.params.id));
  return ok(res, { alunos: turmasService.listAlunos(turma.id) });
}));

router.post('/:id/alunos', asyncHandler(async (req, res) => {
  const turma = turmasService.getTurma(req.user.id, Number(req.params.id));
  const aluno = turmasService.createAluno(turma.id, req.body);
  return ok(res, { aluno }, 201);
}));

router.put('/:id/alunos/:alunoId', asyncHandler(async (req, res) => {
  const turma = turmasService.getTurma(req.user.id, Number(req.params.id));
  const aluno = turmasService.updateAluno(turma.id, Number(req.params.alunoId), req.body);
  return ok(res, { aluno });
}));

router.delete('/:id/alunos/:alunoId', asyncHandler(async (req, res) => {
  const turma = turmasService.getTurma(req.user.id, Number(req.params.id));
  turmasService.deleteAluno(turma.id, Number(req.params.alunoId));
  return ok(res);
}));

router.post('/:id/alunos/importar', asyncHandler(async (req, res) => {
  const turma = turmasService.getTurma(req.user.id, Number(req.params.id));
  const result = turmasService.importAlunos(turma.id, req.body.texto);
  return ok(res, result, 201);
}));

export default router;