import { db } from '../db.js';

function getGrupos(atividadeId) {
  const grupos = db.prepare('SELECT * FROM grupos WHERE atividade_id = ? ORDER BY id').all(atividadeId);
  for (const g of grupos) {
    g.alunos = db.prepare(`
      SELECT a.* FROM grupo_alunos ga JOIN alunos a ON a.id = ga.aluno_id
      WHERE ga.grupo_id = ? ORDER BY a.nome
    `).all(g.id);
  }
  return grupos;
}

function hydrate(id) {
  const atv = db.prepare('SELECT * FROM atividades WHERE id = ?').get(id);
  atv.grupos = getGrupos(atv.id);
  return atv;
}

export function listAtividades(turmaId) {
  return db.prepare('SELECT * FROM atividades WHERE turma_id = ? ORDER BY created_at DESC').all(turmaId);
}

export function getAtividade(id) {
  const atv = db.prepare('SELECT * FROM atividades WHERE id = ?').get(id);
  if (!atv) throw Object.assign(new Error('Atividade não encontrada'), { status: 404 });
  return hydrate(id);
}

export function createAtividade(turmaId, data) {
  const titulo = String(data.titulo || '').trim();
  const genero = String(data.genero_textual || '').trim();
  if (!titulo) throw Object.assign(new Error('Informe o título da atividade'), { status: 400 });
  if (!genero) throw Object.assign(new Error('Informe o gênero textual'), { status: 400 });
  const tipo = data.tipo === 'grupo' ? 'grupo' : 'individual';

  const info = db.prepare(`
    INSERT INTO atividades (turma_id, titulo, descricao, genero_textual, tipo, tema, data_prevista)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    turmaId,
    titulo,
    String(data.descricao || '').trim(),
    genero,
    tipo,
    String(data.tema || '').trim(),
    String(data.data_prevista || '').trim()
  );

  const atvId = Number(info.lastInsertRowid);

  if (tipo === 'grupo' && Array.isArray(data.grupos)) {
    for (const g of data.grupos) {
      const gInfo = db.prepare('INSERT INTO grupos (atividade_id, nome) VALUES (?, ?)')
        .run(atvId, String(g.nome || 'Grupo').trim());
      const grupoId = Number(gInfo.lastInsertRowid);
      const stmt = db.prepare('INSERT OR IGNORE INTO grupo_alunos (grupo_id, aluno_id) VALUES (?, ?)');
      for (const alunoId of Array.isArray(g.alunos) ? g.alunos : []) {
        if (alunoId) stmt.run(grupoId, alunoId);
      }
    }
  }

  return hydrate(atvId);
}

export function updateAtividade(turmaId, id, data) {
  const exists = db.prepare('SELECT * FROM atividades WHERE id = ? AND turma_id = ?').get(id, turmaId);
  if (!exists) throw Object.assign(new Error('Atividade não encontrada'), { status: 404 });

  const titulo = String(data.titulo ?? exists.titulo).trim();
  const genero = String(data.genero_textual ?? exists.genero_textual).trim();
  const tipo = data.tipo ? (data.tipo === 'grupo' ? 'grupo' : 'individual') : exists.tipo;

  db.prepare(`
    UPDATE atividades SET titulo = ?, descricao = ?, genero_textual = ?, tipo = ?, tema = ?, data_prevista = ?
    WHERE id = ?
  `).run(
    titulo,
    String(data.descricao ?? exists.descricao).trim(),
    genero,
    tipo,
    String(data.tema ?? exists.tema).trim(),
    String(data.data_prevista ?? exists.data_prevista).trim(),
    id
  );

  if (tipo === 'grupo' && Array.isArray(data.grupos)) {
    db.prepare('DELETE FROM grupo_alunos WHERE grupo_id IN (SELECT id FROM grupos WHERE atividade_id = ?)').run(id);
    db.prepare('DELETE FROM grupos WHERE atividade_id = ?').run(id);
    for (const g of data.grupos) {
      const gInfo = db.prepare('INSERT INTO grupos (atividade_id, nome) VALUES (?, ?)')
        .run(id, String(g.nome || 'Grupo').trim());
      const grupoId = Number(gInfo.lastInsertRowid);
      const stmt = db.prepare('INSERT OR IGNORE INTO grupo_alunos (grupo_id, aluno_id) VALUES (?, ?)');
      for (const alunoId of Array.isArray(g.alunos) ? g.alunos : []) {
        if (alunoId) stmt.run(grupoId, alunoId);
      }
    }
  }

  return hydrate(id);
}

export function deleteAtividade(turmaId, id) {
  const info = db.prepare('DELETE FROM atividades WHERE id = ? AND turma_id = ?').run(id, turmaId);
  if (info.changes === 0) throw Object.assign(new Error('Atividade não encontrada'), { status: 404 });
  return true;
}