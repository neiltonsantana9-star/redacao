import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, ok, fail } from '../utils.js';
import { db } from '../db.js';
import * as redacoesService from '../services/redacoes.service.js';
import { redacaoPDF, respostaPdf } from '../services/pdf.service.js';

const router = Router();
router.use(requireAuth);

function checkTurmaOwnership(userId, turmaId) {
  const row = db.prepare('SELECT id FROM turmas WHERE id = ? AND user_id = ?').get(turmaId, userId);
  if (!row) throw Object.assign(new Error('Turma não encontrada'), { status: 404 });
  return row.id;
}

router.get('/turma/:turmaId', asyncHandler(async (req, res) => {
  const turmaId = checkTurmaOwnership(req.user.id, Number(req.params.turmaId));
  return ok(res, { redacoes: redacoesService.listRedacoes(req.user.id, turmaId) });
}));

router.get('/atividade/:atividadeId', asyncHandler(async (req, res) => {
  const atv = db.prepare('SELECT id, turma_id FROM atividades WHERE id = ?').get(Number(req.params.atividadeId));
  if (!atv) throw Object.assign(new Error('Atividade não encontrada'), { status: 404 });
  checkTurmaOwnership(req.user.id, atv.turma_id);
  return ok(res, { redacoes: redacoesService.listRedacoesPorAtividade(req.user.id, atv.id) });
}));

router.get('/:id/pdf', asyncHandler(async (req, res) => {
  const redacao = redacoesService.getRedacao(req.user.id, Number(req.params.id));
  const buf = await redacaoPDF({ redacao });
  return respostaPdf(res, buf, `redacao-${redacao.id}-correcao`);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const redacao = redacoesService.getRedacao(req.user.id, Number(req.params.id));
  return ok(res, { redacao });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { turmaId, atividadeId, alunoId, grupoId, titulo, texto, textoOcr, imagePath, genero } = req.body;
  const tid = checkTurmaOwnership(req.user.id, Number(turmaId));

  if (req.body.atividadeId) {
    const atv = db.prepare('SELECT id, turma_id FROM atividades WHERE id = ?').get(Number(req.body.atividadeId));
    if (!atv || atv.turma_id !== tid) throw Object.assign(new Error('Atividade não pertence à turma'), { status: 400 });
  }
  if (req.body.alunoId) {
    const a = db.prepare('SELECT id, turma_id FROM alunos WHERE id = ?').get(Number(req.body.alunoId));
    if (!a || a.turma_id !== tid) throw Object.assign(new Error('Aluno não pertence à turma'), { status: 400 });
  }
  if (req.body.grupoId) {
    const g = db.prepare('SELECT g.id FROM grupos g JOIN atividades a ON a.id = g.atividade_id WHERE g.id = ? AND a.turma_id = ?')
      .get(Number(req.body.grupoId), tid);
    if (!g) throw Object.assign(new Error('Grupo não pertence à turma'), { status: 400 });
  }

  const redacao = await redacoesService.createRedacao(req.user.id, {
    turmaId: tid,
    atividadeId: atividadeId ? Number(atividadeId) : null,
    alunoId: alunoId ? Number(alunoId) : null,
    grupoId: grupoId ? Number(grupoId) : null,
    titulo,
    texto,
    textoOcr,
    imagePath,
    genero
  });
  return ok(res, { redacao }, 201);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const redacao = await redacoesService.updateRedacao(req.user.id, Number(req.params.id), req.body);
  return ok(res, { redacao });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  redacoesService.deleteRedacao(req.user.id, Number(req.params.id));
  return ok(res);
}));

// Análise prévia de um texto sem salvar (para edição/visualização)
router.post('/analisar', asyncHandler(async (req, res) => {
  const { texto, genero } = req.body;
  const { analisarRedacao } = await import('../services/analise/index.js');
  const resultado = await analisarRedacao(String(texto || ''), { genero });
  return ok(res, { resultado });
}));

export default router;