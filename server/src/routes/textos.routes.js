import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, ok } from '../utils.js';
import * as textosService from '../services/textos.service.js';
import { textoPDF, respostaPdf } from '../services/pdf.service.js';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const lista = textosService.listarTextos(req.user.id, {
    genero: String(req.query.genero || ''),
    nivel: String(req.query.nivel || ''),
    busca: String(req.query.busca || '')
  });
  return ok(res, { textos: lista });
}));

router.get('/:id/questoes', asyncHandler(async (req, res) => {
  const questoes = textosService.listarPorTexto(req.user.id, Number(req.params.id));
  return ok(res, { questoes });
}));

router.post('/:id/gerar', asyncHandler(async (req, res) => {
  const { quantidade } = req.body || {};
  const dados = await textosService.gerarParaTexto(req.user.id, Number(req.params.id), { quantidade });
  return ok(res, dados);
}));

// PDF do texto + questões — precisa vir antes de '/:id'
router.get('/:id/pdf', asyncHandler(async (req, res) => {
  const texto = textosService.getTexto(req.user.id, Number(req.params.id));
  const questoes = textosService.listarPorTexto(req.user.id, texto.id);
  const buf = await textoPDF({
    texto,
    questoes,
    professor: req.user.name,
    data: new Date().toLocaleDateString('pt-BR'),
    mostrarGabarito: req.query.gabarito === '1'
  });
  return respostaPdf(res, buf, `texto-${texto.id}-questoes`);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  return ok(res, { texto: textosService.getTexto(req.user.id, Number(req.params.id)) });
}));

router.post('/', asyncHandler(async (req, res) => {
  const texto = textosService.criarTexto(req.user.id, req.body);
  return ok(res, { texto }, 201);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const texto = textosService.atualizarTexto(req.user.id, Number(req.params.id), req.body);
  return ok(res, { texto });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  textosService.excluirTexto(req.user.id, Number(req.params.id));
  return ok(res);
}));

export default router;