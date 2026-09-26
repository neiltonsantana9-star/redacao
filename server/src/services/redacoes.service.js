import { db } from '../db.js';
import { analisarRedacao } from './analise/index.js';

function hydrate(row) {
  const r = { ...row };
  try {
    r.resultado = JSON.parse(r.resultado || '{}');
  } catch {
    r.resultado = {};
  }
  if (r.aluno_id) {
    r.aluno = db.prepare('SELECT id, nome FROM alunos WHERE id = ?').get(r.aluno_id) || null;
  }
  if (r.grupo_id) {
    const grupo = db.prepare('SELECT id, nome, atividade_id FROM grupos WHERE id = ?').get(r.grupo_id);
    r.grupo = grupo || null;
    if (grupo) {
      r.grupo.alunos = db.prepare(`
        SELECT a.id, a.nome FROM grupo_alunos ga JOIN alunos a ON a.id = ga.aluno_id
        WHERE ga.grupo_id = ? ORDER BY a.nome
      `).all(grupo.id);
    }
  }
  return r;
}

export function listRedacoes(userId, turmaId) {
  return db.prepare(`
    SELECT * FROM redacoes
    WHERE user_id = ? AND turma_id = ?
    ORDER BY created_at DESC
  `).all(userId, turmaId).map(hydrate);
}

export function listRedacoesPorAtividade(userId, atividadeId) {
  return db.prepare(`
    SELECT * FROM redacoes
    WHERE user_id = ? AND atividade_id = ?
    ORDER BY created_at DESC
  `).all(userId, atividadeId).map(hydrate);
}

export function getRedacao(userId, id) {
  const row = db.prepare('SELECT * FROM redacoes WHERE id = ? AND user_id = ?').get(id, userId);
  if (!row) throw Object.assign(new Error('Redação não encontrada'), { status: 404 });
  return hydrate(row);
}

export async function createRedacao(userId, { turmaId, atividadeId, alunoId, grupoId, titulo, texto, textoOcr, imagePath, genero }) {
  const textoLimpo = String(texto || '').trim();
  if (!turmaId) throw Object.assign(new Error('Informe a turma'), { status: 400 });
  if (!textoLimpo) throw Object.assign(new Error('Informe o texto da redação'), { status: 400 });

  const resultado = await analisarRedacao(textoLimpo, { genero });
  const nota = resultado.nota ?? null;

  const info = db.prepare(`
    INSERT INTO redacoes (user_id, turma_id, atividade_id, aluno_id, grupo_id, titulo, nota_final, status, image_path, texto_ocr, texto, resultado)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'corrigida', ?, ?, ?, ?)
  `).run(
    userId,
    turmaId,
    atividadeId || null,
    alunoId || null,
    grupoId || null,
    String(titulo || '').trim(),
    nota,
    String(imagePath || ''),
    String(textoOcr || ''),
    textoLimpo,
    JSON.stringify(resultado)
  );

  return hydrate(db.prepare('SELECT * FROM redacoes WHERE id = ?').get(info.lastInsertRowid));
}

export async function updateRedacao(userId, id, { texto, titulo, notaFinal, alunoId, grupoId }) {
  const row = db.prepare('SELECT * FROM redacoes WHERE id = ? AND user_id = ?').get(id, userId);
  if (!row) throw Object.assign(new Error('Redação não encontrada'), { status: 404 });

  if (texto && String(texto).trim() !== row.texto) {
    const resultado = await analisarRedacao(String(texto).trim(), {
      genero: row.atividade_id
        ? (db.prepare('SELECT genero_textual FROM atividades WHERE id = ?').get(row.atividade_id)?.genero_textual || '')
        : ''
    });
    const nota = notaFinal !== undefined && notaFinal !== '' && notaFinal !== null ? Number(notaFinal) : (resultado.nota ?? null);
    db.prepare('UPDATE redacoes SET texto = ?, resultado = ?, nota_final = ?, titulo = ?, aluno_id = ?, grupo_id = ? WHERE id = ?')
      .run(String(texto).trim(), JSON.stringify(resultado), nota, String(titulo ?? row.titulo), alunoId ?? row.aluno_id, grupoId ?? row.grupo_id, id);
    return getRedacao(userId, id);
  }

  const nota = notaFinal !== undefined && notaFinal !== '' && notaFinal !== null ? Number(notaFinal) : row.nota_final;
  db.prepare('UPDATE redacoes SET titulo = ?, nota_final = ?, aluno_id = ?, grupo_id = ? WHERE id = ?')
    .run(String(titulo ?? row.titulo), nota, alunoId ?? row.aluno_id, grupoId ?? row.grupo_id, id);
  return getRedacao(userId, id);
}

export function deleteRedacao(userId, id) {
  const info = db.prepare('DELETE FROM redacoes WHERE id = ? AND user_id = ?').run(id, userId);
  if (info.changes === 0) throw Object.assign(new Error('Redação não encontrada'), { status: 404 });
  return true;
}