import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DB_PATH } from './config.js';

mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Migrações simples para bancos criados antes de uma coluna existir
// (precisam vir antes dos CREATE INDEX que usam a coluna)
try { db.exec('ALTER TABLE perguntas ADD COLUMN texto_id INTEGER REFERENCES textos(id) ON DELETE CASCADE'); } catch { /* já existe */ }

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS turmas (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nome       TEXT NOT NULL,
    serie      TEXT NOT NULL DEFAULT '',
    turno      TEXT NOT NULL DEFAULT '',
    genero_foco TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS alunos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    turma_id   INTEGER NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
    nome       TEXT NOT NULL,
    email      TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS atividades (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    turma_id      INTEGER NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
    titulo        TEXT NOT NULL,
    descricao     TEXT NOT NULL DEFAULT '',
    genero_textual TEXT NOT NULL,
    tipo          TEXT NOT NULL DEFAULT 'individual'
                  CHECK (tipo IN ('individual','grupo')),
    tema          TEXT NOT NULL DEFAULT '',
    data_prevista TEXT NOT NULL DEFAULT '',
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS grupos (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    atividade_id INTEGER NOT NULL REFERENCES atividades(id) ON DELETE CASCADE,
    nome         TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS grupo_alunos (
    grupo_id INTEGER NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    aluno_id INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    UNIQUE (grupo_id, aluno_id)
  );

  CREATE TABLE IF NOT EXISTS redacoes (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    turma_id     INTEGER NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
    atividade_id INTEGER REFERENCES atividades(id) ON DELETE SET NULL,
    aluno_id     INTEGER REFERENCES alunos(id) ON DELETE SET NULL,
    grupo_id     INTEGER REFERENCES grupos(id) ON DELETE SET NULL,
    titulo       TEXT NOT NULL DEFAULT '',
    nota_final   REAL,
    status       TEXT NOT NULL DEFAULT 'corrigida'
                 CHECK (status IN ('pendente','corrigida')),
    image_path   TEXT NOT NULL DEFAULT '',
    texto_ocr    TEXT NOT NULL DEFAULT '',
    texto        TEXT NOT NULL,
    resultado    TEXT NOT NULL DEFAULT '{}',
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS perguntas (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    turma_id     INTEGER REFERENCES turmas(id) ON DELETE SET NULL,
    atividade_id INTEGER REFERENCES atividades(id) ON DELETE SET NULL,
    redacao_id   INTEGER REFERENCES redacoes(id) ON DELETE CASCADE,
    genero       TEXT NOT NULL DEFAULT '',
    origem       TEXT NOT NULL DEFAULT 'banco'
                 CHECK (origem IN ('banco','ia')),
    nivel        TEXT NOT NULL DEFAULT 'médio'
                 CHECK (nivel IN ('fácil','médio','difícil')),
    enunciado    TEXT NOT NULL,
    alternativas TEXT NOT NULL DEFAULT '[]',
    correta      TEXT NOT NULL DEFAULT '',
    explicacao   TEXT NOT NULL DEFAULT '',
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS textos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    titulo     TEXT NOT NULL,
    autor      TEXT NOT NULL DEFAULT '',
    fonte      TEXT NOT NULL DEFAULT '',
    genero     TEXT NOT NULL DEFAULT '',
    nivel      TEXT NOT NULL DEFAULT 'difícil',
    orientacao TEXT NOT NULL DEFAULT '',
    texto      TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_turmas_user    ON turmas(user_id);
  CREATE INDEX IF NOT EXISTS idx_alunos_turma   ON alunos(turma_id);
  CREATE INDEX IF NOT EXISTS idx_atividades_turma ON atividades(turma_id);
  CREATE INDEX IF NOT EXISTS idx_redacoes_user  ON redacoes(user_id);
  CREATE INDEX IF NOT EXISTS idx_redacoes_turma ON redacoes(turma_id);
  CREATE INDEX IF NOT EXISTS idx_perguntas_user   ON perguntas(user_id);
  CREATE INDEX IF NOT EXISTS idx_perguntas_genero ON perguntas(genero);
  CREATE INDEX IF NOT EXISTS idx_perguntas_redacao ON perguntas(redacao_id);
  CREATE INDEX IF NOT EXISTS idx_perguntas_texto ON perguntas(texto_id);
  CREATE INDEX IF NOT EXISTS idx_textos_user   ON textos(user_id);
`);

// Migrações simples para bancos criados antes de uma coluna existir
try { db.exec('ALTER TABLE redacoes ADD COLUMN status TEXT NOT NULL DEFAULT \'corrigida\''); } catch { /* já existe */ }
try { db.exec('ALTER TABLE redacoes ADD COLUMN image_path TEXT NOT NULL DEFAULT \'\''); } catch { /* já existe */ }
try { db.exec('ALTER TABLE redacoes ADD COLUMN titulo TEXT NOT NULL DEFAULT \'\''); } catch { /* já existe */ }