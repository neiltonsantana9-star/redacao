import { db } from '../db.js';
import { clamp } from '../utils.js';
import { gerarQuestoes } from './analise/ia.js';

function hydrate(row) {
  const p = { ...row };
  try {
    p.alternativas = JSON.parse(p.alternativas || '[]');
  } catch {
    p.alternativas = [];
  }
  return p;
}

function limparAlternativas(lista) {
  if (!Array.isArray(lista)) return [];
  return lista.map((a) => String(a || '').replace(/^[a-dA-D][.)]\s*/, '').trim()).filter(Boolean);
}

export function listarBanco(userId, { genero = '', nivel = '', busca = '', ids = [], textoId = null } = {}) {
  const conds = ['user_id = ?'];
  const params = [userId];

  if (ids.length) {
    const marks = ids.map(Number).filter((n) => Number.isInteger(n) && n > 0);
    if (marks.length) {
      conds.push(`id IN (${marks.map(() => '?').join(',')})`);
      params.push(...marks);
    }
  }
  if (textoId) { conds.push('texto_id = ?'); params.push(textoId); }
  if (genero && genero !== 'todos') { conds.push('genero = ?'); params.push(genero); }
  if (nivel && nivel !== 'todos') { conds.push('nivel = ?'); params.push(nivel); }
  if (busca) { conds.push('enunciado LIKE ?'); params.push(`%${busca}%`); }

  return db.prepare(`
    SELECT * FROM perguntas
    WHERE ${conds.join(' AND ')}
    ORDER BY origem = 'ia' DESC, created_at DESC, id DESC
  `).all(...params).map(hydrate);
}

export function getPergunta(userId, id) {
  const row = db.prepare('SELECT * FROM perguntas WHERE id = ? AND user_id = ?').get(id, userId);
  if (!row) throw Object.assign(new Error('Questão não encontrada'), { status: 404 });
  return hydrate(row);
}

export function listarPorRedacao(userId, redacaoId) {
  return db.prepare(`
    SELECT * FROM perguntas
    WHERE user_id = ? AND redacao_id = ?
    ORDER BY id ASC
  `).all(userId, redacaoId).map(hydrate);
}

export function listarPorTexto(userId, textoId) {
  return db.prepare(`
    SELECT * FROM perguntas
    WHERE user_id = ? AND texto_id = ?
    ORDER BY origem = 'banco' DESC, id ASC
  `).all(userId, textoId).map(hydrate);
}

function inserir(userId, { turmaId, atividadeId, redacaoId, textoId, genero, origem, nivel, enunciado, alternativas, correta, explicacao }) {
  const info = db.prepare(`
    INSERT INTO perguntas (user_id, turma_id, atividade_id, redacao_id, texto_id, genero, origem, nivel, enunciado, alternativas, correta, explicacao)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    turmaId || null,
    atividadeId || null,
    redacaoId || null,
    textoId || null,
    String(genero || ''),
    origem || 'banco',
    ['fácil', 'médio', 'difícil'].includes(nivel) ? nivel : 'médio',
    String(enunciado || '').trim(),
    JSON.stringify(limparAlternativas(alternativas)),
    String(correta ?? '0'),
    String(explicacao || '')
  );
  return getPergunta(userId, Number(info.lastInsertRowid));
}

export function criarBanco(userId, dados) {
  const enunciado = String(dados.enunciado || '').trim();
  if (!enunciado) throw Object.assign(new Error('Informe o enunciado da questão'), { status: 400 });
  const alt = limparAlternativas(dados.alternativas);
  if (alt.length && !alt.includes(String(dados.correta ?? '').trim()) && dados.correta !== '') {
    // correta pode vir como índice
    const idx = Number(dados.correta);
    if (!Number.isInteger(idx) || idx < 0 || idx >= alt.length) {
      throw Object.assign(new Error('Marque a alternativa correta'), { status: 400 });
    }
  }
  const textoId = dados.textoId ? Number(dados.textoId) : null;
  if (textoId) {
    const txt = db.prepare('SELECT id FROM textos WHERE id = ? AND user_id = ?').get(textoId, userId);
    if (!txt) throw Object.assign(new Error('Texto não encontrado'), { status: 404 });
  }
  return inserir(userId, { ...dados, alternativas: alt, textoId });
}

export function atualizar(userId, id, dados) {
  getPergunta(userId, id); // 404 check
  const alt = limparAlternativas(dados.alternativas);
  const nivel = ['fácil', 'médio', 'difícil'].includes(dados.nivel) ? dados.nivel : 'médio';
  const correta = alt.length ? String(dados.correta ?? '0') : String(dados.correta ?? '');
  db.prepare(`
    UPDATE perguntas
    SET genero = ?, nivel = ?, enunciado = ?, alternativas = ?, correta = ?, explicacao = ?, turma_id = ?, atividade_id = ?
    WHERE id = ? AND user_id = ?
  `).run(
    String(dados.genero || ''),
    nivel,
    String(dados.enunciado || '').trim(),
    JSON.stringify(alt),
    correta,
    String(dados.explicacao || ''),
    dados.turmaId || null,
    dados.atividadeId || null,
    id,
    userId
  );
  return getPergunta(userId, id);
}

export function excluir(userId, id) {
  const info = db.prepare('DELETE FROM perguntas WHERE id = ? AND user_id = ?').run(id, userId);
  if (info.changes === 0) throw Object.assign(new Error('Questão não encontrada'), { status: 404 });
  return true;
}

export async function gerarParaRedacao(userId, redacaoId, { quantidade = 5 } = {}) {
  const red = db.prepare('SELECT * FROM redacoes WHERE id = ? AND user_id = ?').get(redacaoId, userId);
  if (!red) throw Object.assign(new Error('Redação não encontrada'), { status: 404 });
  if (!String(red.texto || '').trim()) throw Object.assign(new Error('A redação não tem texto'), { status: 400 });

  const atv = red.atividade_id
    ? db.prepare('SELECT genero_textual FROM atividades WHERE id = ?').get(red.atividade_id)
    : null;
  const turma = red.turma_id
    ? db.prepare('SELECT genero_foco FROM turmas WHERE id = ?').get(red.turma_id)
    : null;
  const genero = atv?.genero_textual || turma?.genero_foco || '';

  const qtd = clamp(Number(quantidade) || 5, 3, 10);
  const geradas = await gerarQuestoes(red.texto, genero, qtd);

  db.prepare('DELETE FROM perguntas WHERE redacao_id = ? AND user_id = ?').run(redacaoId, userId);

  const ids = geradas.map((q) =>
    inserir(userId, {
      redacaoId,
      genero,
      origem: 'ia',
      nivel: q.nivel,
      enunciado: q.enunciado,
      alternativas: q.alternativas,
      correta: q.correta,
      explicacao: q.explicacao
    })
  );

  return { genero, questoes: ids };
}