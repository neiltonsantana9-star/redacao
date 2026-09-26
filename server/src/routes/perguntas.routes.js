import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, ok } from '../utils.js';
import { db } from '../db.js';
import * as questoesService from '../services/perguntas.service.js';
import { provaPDF, respostaPdf } from '../services/pdf.service.js';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const ids = String(req.query.ids || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '')
    .map(Number)
    .filter(Number.isInteger);
  const textoId = req.query.texto_id ? Number(req.query.texto_id) : null;
  const lista = questoesService.listarBanco(req.user.id, {
    genero: String(req.query.genero || ''),
    nivel: String(req.query.nivel || ''),
    busca: String(req.query.busca || ''),
    ids,
    textoId: textoId && textoId > 0 ? textoId : null
  });
  return ok(res, { questoes: lista });
}));

router.get('/por-redacao/:redacaoId', asyncHandler(async (req, res) => {
  const red = db.prepare('SELECT id FROM redacoes WHERE id = ? AND user_id = ?')
    .get(Number(req.params.redacaoId), req.user.id);
  if (!red) throw Object.assign(new Error('Redação não encontrada'), { status: 404 });
  return ok(res, { questoes: questoesService.listarPorRedacao(req.user.id, red.id) });
}));

router.get('/por-texto/:textoId', asyncHandler(async (req, res) => {
  const txt = db.prepare('SELECT id FROM textos WHERE id = ? AND user_id = ?')
    .get(Number(req.params.textoId), req.user.id);
  if (!txt) throw Object.assign(new Error('Texto não encontrado'), { status: 404 });
  return ok(res, { questoes: questoesService.listarPorTexto(req.user.id, txt.id) });
}));

// PDF com as questões selecionadas (prova) — precisa vir antes de '/:id'
router.get('/pdf', asyncHandler(async (req, res) => {
  const ids = String(req.query.ids || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '')
    .map(Number)
    .filter(Number.isInteger);
  const questoes = questoesService.listarBanco(req.user.id, { ids });
  if (questoes.length === 0) throw Object.assign(new Error('Nenhuma questão selecionada'), { status: 400 });
  const buf = await provaPDF({
    titulo: String(req.query.titulo || 'Questões de interpretação textual'),
    professor: req.user.name,
    data: new Date().toLocaleDateString('pt-BR'),
    questoes,
    mostrarGabarito: req.query.gabarito === '1'
  });
  return respostaPdf(res, buf, `prova-questoes-${questoes.length}`);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  return ok(res, { questao: questoesService.getPergunta(req.user.id, Number(req.params.id)) });
}));

router.post('/', asyncHandler(async (req, res) => {
  const questao = questoesService.criarBanco(req.user.id, req.body);
  return ok(res, { questao }, 201);
}));

// Gera questões de interpretação com IA sobre o texto de uma redação (salva no banco)
router.post('/redacao/:redacaoId/gerar', asyncHandler(async (req, res) => {
  const { quantidade } = req.body || {};
  const dados = await questoesService.gerarParaRedacao(req.user.id, Number(req.params.redacaoId), { quantidade });
  return ok(res, dados);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const questao = questoesService.atualizar(req.user.id, Number(req.params.id), req.body);
  return ok(res, { questao });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  questoesService.excluir(req.user.id, Number(req.params.id));
  return ok(res);
}));

export default router;