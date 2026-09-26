import { db } from '../db.js';

// ---------- TURMAS ----------

export function listTurmas(userId) {
  return db.prepare(`
    SELECT t.*,
      (SELECT COUNT(*) FROM alunos a WHERE a.turma_id = t.id) AS qtd_alunos,
      (SELECT COUNT(*) FROM atividades atv WHERE atv.turma_id = t.id) AS qtd_atividades
    FROM turmas t WHERE t.user_id = ? ORDER BY t.created_at DESC
  `).all(userId);
}

export function getTurma(userId, id) {
  const turma = db.prepare('SELECT * FROM turmas WHERE id = ? AND user_id = ?').get(id, userId);
  if (!turma) throw Object.assign(new Error('Turma não encontrada'), { status: 404 });
  turma.alunos = db.prepare('SELECT * FROM alunos WHERE turma_id = ? ORDER BY nome').all(id);
  turma.atividades = db.prepare('SELECT * FROM atividades WHERE turma_id = ? ORDER BY created_at DESC').all(id);
  return turma;
}

export function createTurma(userId, data) {
  const nome = String(data.nome || '').trim();
  if (!nome) throw Object.assign(new Error('Informe o nome da turma'), { status: 400 });
  const info = db.prepare(`
    INSERT INTO turmas (user_id, nome, serie, turno, genero_foco)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, nome, String(data.serie || '').trim(), String(data.turno || '').trim(), String(data.genero_foco || '').trim());
  return db.prepare('SELECT * FROM turmas WHERE id = ?').get(info.lastInsertRowid);
}

export function updateTurma(userId, id, data) {
  const exists = db.prepare('SELECT id FROM turmas WHERE id = ? AND user_id = ?').get(id, userId);
  if (!exists) throw Object.assign(new Error('Turma não encontrada'), { status: 404 });
  db.prepare('UPDATE turmas SET nome = ?, serie = ?, turno = ?, genero_foco = ? WHERE id = ?')
    .run(String(data.nome || '').trim(), String(data.serie || '').trim(), String(data.turno || '').trim(), String(data.genero_foco || '').trim(), id);
  return getTurma(userId, id);
}

export function deleteTurma(userId, id) {
  const info = db.prepare('DELETE FROM turmas WHERE id = ? AND user_id = ?').run(id, userId);
  if (info.changes === 0) throw Object.assign(new Error('Turma não encontrada'), { status: 404 });
  return true;
}

// ---------- ALUNOS ----------

export function listAlunos(turmaId) {
  return db.prepare('SELECT * FROM alunos WHERE turma_id = ? ORDER BY nome').all(turmaId);
}

export function createAluno(turmaId, data) {
  const nome = String(data.nome || '').trim();
  if (!nome) throw Object.assign(new Error('Informe o nome do aluno'), { status: 400 });
  const info = db.prepare('INSERT INTO alunos (turma_id, nome, email) VALUES (?, ?, ?)')
    .run(turmaId, nome, String(data.email || '').trim());
  return db.prepare('SELECT * FROM alunos WHERE id = ?').get(info.lastInsertRowid);
}

export function updateAluno(turmaId, id, data) {
  const exists = db.prepare('SELECT id FROM alunos WHERE id = ? AND turma_id = ?').get(id, turmaId);
  if (!exists) throw Object.assign(new Error('Aluno não encontrado'), { status: 404 });
  db.prepare('UPDATE alunos SET nome = ?, email = ? WHERE id = ?')
    .run(String(data.nome || '').trim(), String(data.email || '').trim(), id);
  return db.prepare('SELECT * FROM alunos WHERE id = ?').get(id);
}

export function deleteAluno(turmaId, id) {
  const info = db.prepare('DELETE FROM alunos WHERE id = ? AND turma_id = ?').run(id, turmaId);
  if (info.changes === 0) throw Object.assign(new Error('Aluno não encontrado'), { status: 404 });
  return true;
}

export function importAlunos(turmaId, rawLines) {
  const lines = String(rawLines || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) throw Object.assign(new Error('Nenhum nome informado'), { status: 400 });
  let total = 0;
  const stmt = db.prepare('INSERT INTO alunos (turma_id, nome, email) VALUES (?, ?, ?)');
  for (const line of lines) {
    const [nome, email = ''] = line.split(';').map((p) => p.trim());
    if (!nome) continue;
    stmt.run(turmaId, nome, email);
    total++;
  }
  return { total };
}