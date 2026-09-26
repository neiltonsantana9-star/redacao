export const ok = (res, data = {}, status = 200) =>
  res.status(status).json({ ok: true, ...data });

export const fail = (res, message, status = 400, extra = {}) =>
  res.status(status).json({ ok: false, message, ...extra });

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Normaliza acentuação: "ação" -> "acao" (útil para comparar palavras)
export function normalizeWord(w) {
  return w
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function stripNbsp(text) {
  return String(text).replace(/\u00a0/g, ' ');
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function unique(arr) {
  return [...new Set(arr)];
}

// Separa o texto em sentenças simples (por pontuação final).
export function sentences(text) {
  return String(text)
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// Palavras (sem pontuação) do texto.
export function tokens(text) {
  return String(text).toLowerCase().match(/[a-zà-úâêôûãõçáéíóúü]+/g) || [];
}

// Conectivos comuns da língua portuguesa por função.
export const CONECTIVOS = {
  adicao: ['e', 'também', 'além disso', 'ademais', 'somando', 'ainda', 'bem como', 'inclusive', 'da mesma forma', 'igualmente'],
  oposicao: ['mas', 'porém', 'contudo', 'entretanto', 'todavia', 'no entanto', 'apesar de', 'embora', 'ainda que', 'ao passo que'],
  conclusao: ['portanto', 'logo', 'assim', 'então', 'por isso', 'por conseguinte', 'dessa forma', 'desse modo', 'concluindo', 'enfim', 'em suma', 'diante disso'],
  causa: ['porque', 'pois', 'já que', 'visto que', 'uma vez que', 'devido a', 'em virtude de', 'haja vista'],
  consequencia: ['consequentemente', 'por consequência', 'de modo que', 'tal que', 'resultando em'],
  tempo: ['quando', 'enquanto', 'logo que', 'assim que', 'depois que', 'antes de', 'ao mesmo tempo', 'atualmente', 'hoje em dia', 'nos dias de hoje'],
  exemplificacao: ['por exemplo', 'como', 'tal como', 'a exemplo de', 'isto é', 'ou seja', 'exemplificando'],
  condicionais: ['se', 'caso', 'contanto que', 'desde que', 'a menos que'],
  finalidade: ['para', 'a fim de', 'com o intuito de', 'com o objetivo de'],
  comparacao: ['como se', 'do mesmo modo', 'de igual forma', 'mais que', 'menos que', 'tal qual', 'assim como']
};

export const TODOS_CONECTIVOS = Object.values(CONECTIVOS).flat();