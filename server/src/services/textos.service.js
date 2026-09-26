import { db } from '../db.js';
import { clamp } from '../utils.js';
import { gerarQuestoes } from './analise/ia.js';

export function listarTextos(userId, { genero = '', nivel = '', busca = '' } = {}) {
  const conds = ['user_id = ?'];
  const params = [userId];

  if (genero && genero !== 'todos') { conds.push('genero = ?'); params.push(genero); }
  if (nivel && nivel !== 'todos') { conds.push('nivel = ?'); params.push(nivel); }
  if (busca) { conds.push('(titulo LIKE ? OR autor LIKE ? OR texto LIKE ?)'); params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`); }

  return db.prepare(`
    SELECT t.*,
           (SELECT COUNT(*) FROM perguntas p WHERE p.texto_id = t.id) AS qtd_questoes
    FROM textos t
    WHERE ${conds.join(' AND ')}
    ORDER BY t.created_at DESC, t.id DESC
  `).all(...params);
}

export function getTexto(userId, id) {
  const row = db.prepare(`
    SELECT t.*,
           (SELECT COUNT(*) FROM perguntas p WHERE p.texto_id = t.id) AS qtd_questoes
    FROM textos t WHERE t.id = ? AND t.user_id = ?
  `).get(id, userId);
  if (!row) throw Object.assign(new Error('Texto não encontrado'), { status: 404 });
  return row;
}

export function listarPorTexto(userId, textoId) {
  return db.prepare(`
    SELECT * FROM perguntas
    WHERE user_id = ? AND texto_id = ?
    ORDER BY id ASC
  `).all(userId, textoId).map((row) => {
    const p = { ...row };
    try { p.alternativas = JSON.parse(p.alternativas || '[]'); } catch { p.alternativas = []; }
    return p;
  });
}

export function criarTexto(userId, dados) {
  const titulo = String(dados.titulo || '').trim();
  if (!titulo) throw Object.assign(new Error('Informe o título do texto'), { status: 400 });
  const texto = String(dados.texto || '').trim();
  if (!texto) throw Object.assign(new Error('Informe o texto'), { status: 400 });

  const info = db.prepare(`
    INSERT INTO textos (user_id, titulo, autor, fonte, genero, nivel, orientacao, texto)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    titulo,
    String(dados.autor || ''),
    String(dados.fonte || ''),
    String(dados.genero || ''),
    ['fácil', 'médio', 'difícil'].includes(dados.nivel) ? dados.nivel : 'difícil',
    String(dados.orientacao || ''),
    texto
  );
  return getTexto(userId, Number(info.lastInsertRowid));
}

export function atualizarTexto(userId, id, dados) {
  getTexto(userId, id); // 404 check
  const titulo = String(dados.titulo ?? '').trim();
  if (!titulo) throw Object.assign(new Error('Informe o título do texto'), { status: 400 });
  db.prepare(`
    UPDATE textos
    SET titulo = ?, autor = ?, fonte = ?, genero = ?, nivel = ?, orientacao = ?, texto = ?
    WHERE id = ? AND user_id = ?
  `).run(
    titulo,
    String(dados.autor || ''),
    String(dados.fonte || ''),
    String(dados.genero || ''),
    ['fácil', 'médio', 'difícil'].includes(dados.nivel) ? dados.nivel : 'difícil',
    String(dados.orientacao || ''),
    String(dados.texto || ''),
    id,
    userId
  );
  return getTexto(userId, id);
}

export function excluirTexto(userId, id) {
  getTexto(userId, id); // 404 check
  db.prepare('DELETE FROM perguntas WHERE texto_id = ? AND user_id = ?').run(id, userId);
  const info = db.prepare('DELETE FROM textos WHERE id = ? AND user_id = ?').run(id, userId);
  if (info.changes === 0) throw Object.assign(new Error('Texto não encontrado'), { status: 404 });
  return true;
}

export async function gerarParaTexto(userId, textoId, { quantidade = 5 } = {}) {
  const txt = getTexto(userId, textoId);
  if (!String(txt.texto || '').trim()) throw Object.assign(new Error('O texto está vazio'), { status: 400 });

  const qtd = clamp(Number(quantidade) || 5, 3, 10);
  const geradas = await gerarQuestoes(txt.texto, txt.genero, qtd);

  db.prepare(`DELETE FROM perguntas WHERE texto_id = ? AND user_id = ? AND origem = 'ia'`).run(textoId, userId);

  const ids = geradas.map((q) => {
    const info = db.prepare(`
      INSERT INTO perguntas (user_id, texto_id, genero, origem, nivel, enunciado, alternativas, correta, explicacao)
      VALUES (?, ?, ?, 'ia', ?, ?, ?, ?, ?)
    `).run(
      userId,
      textoId,
      String(txt.genero || ''),
      ['fácil', 'médio', 'difícil'].includes(q.nivel) ? q.nivel : 'médio',
      String(q.enunciado || '').trim(),
      JSON.stringify(Array.isArray(q.alternativas) ? q.alternativas.map((a) => String(a).trim()).filter(Boolean) : []),
      String(q.correta ?? '0'),
      String(q.explicacao || '')
    );
    return Number(info.lastInsertRowid);
  });
  // Perguntas "ia" ficam depois das do banco na ordem de exibição
  return { genero: txt.genero, textoId, questoes: listarPorTexto(userId, textoId), novosIds: ids };
}