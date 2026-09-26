import bcrypt from 'bcryptjs';
import { db } from '../db.js';

export async function register({ name, email, password }) {
  const emailClean = String(email || '').trim().toLowerCase();
  const nameClean = String(name || '').trim();
  if (!emailClean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
    throw Object.assign(new Error('E-mail inválido'), { status: 400 });
  }
  if (!nameClean) throw Object.assign(new Error('Informe o nome'), { status: 400 });
  if (!password || String(password).length < 6) {
    throw Object.assign(new Error('A senha precisa de pelo menos 6 caracteres'), { status: 400 });
  }
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(emailClean);
  if (exists) throw Object.assign(new Error('Este e-mail já está cadastrado'), { status: 409 });

  const hash = bcrypt.hashSync(String(password), 10);
  const info = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(nameClean, emailClean, hash);
  const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(info.lastInsertRowid);
  return user;
}

export async function login({ email, password }) {
  const emailClean = String(email || '').trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(emailClean);
  if (!user || !bcrypt.compareSync(String(password || ''), user.password_hash)) {
    throw Object.assign(new Error('E-mail ou senha incorretos'), { status: 401 });
  }
  return { id: user.id, name: user.name, email: user.email, created_at: user.created_at };
}