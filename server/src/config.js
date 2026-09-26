import path from 'node:path';
import { readFileSync, existsSync } from 'node:fs';

// Carrega variáveis do .env na raiz do projeto (sem dependência), apenas se
// a variável ainda não estiver definida no ambiente.
const ROOT = path.join(import.meta.dirname, '..', '..');
const ENV_PATH = path.join(ROOT, '.env');
if (existsSync(ENV_PATH)) {
  for (const line of readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}

export const PORT = Number(process.env.PORT || 4020);
export const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-in-production';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const CORS_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

export const AUTH_COOKIE = process.env.AUTH_COOKIE || 'redacoes_token';
export const AUTH_COOKIE_MAX_AGE = Number(process.env.AUTH_COOKIE_MAX_AGE || 7 * 24 * 3600);
export const AUTH_COOKIE_SAMESITE = process.env.AUTH_COOKIE_SAMESITE || 'Lax';
const sameSiteNone = AUTH_COOKIE_SAMESITE.toLowerCase() === 'none';
export const AUTH_COOKIE_SECURE = process.env.AUTH_COOKIE_SECURE
  ? ['1', 'true', 'yes'].includes(String(process.env.AUTH_COOKIE_SECURE).toLowerCase())
  : sameSiteNone;
export const AUTH_COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN || '';

export const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(import.meta.dirname, '..', 'data', 'redacoes.db');

// LanguageTool (API pública grátis para ortografia/gramática; não precisa de chave)
export const LANGUAGETOOL_URL = process.env.LANGUAGETOOL_URL || 'https://api.languagetool.org/v2/check';

// IA para análise de coesão e semântica (opcional). Funciona com qualquer API
// compatível com OpenAI (OpenAI, Anthropic via gateway, Ollama, LM Studio...).
export const AI_API_URL = process.env.AI_API_URL || '';
export const AI_API_KEY = process.env.AI_API_KEY || '';
export const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

export const AI_ENABLED = Boolean(AI_API_URL && AI_API_KEY);

// Chave fake só para testes locais (seed); em produção use AI_API_URL/AI_API_KEY.
export const MOCK_AI = process.env.MOCK_AI === '1';