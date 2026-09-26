import { sentences, tokens, normalizeWord, CONECTIVOS, TODOS_CONECTIVOS, clamp, unique } from '../../utils.js';

export function splitParagraphs(text) {
  return text
    .split(/\n{2,}|\n(?=[A-ZÀ-ÚÇ][a-zà-úç]{2,})/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

export function estatisticas(text) {
  const toks = tokens(text);
  const paras = splitParagraphs(text);
  const sents = sentences(text);
  const uniqueWords = new Set(toks.map(normalizeWord)).size || 1;
  return {
    paragrafos: paras.length,
    sentencas: sents.length,
    palavras: toks.length,
    palavras_unicas: uniqueWords,
    repeticao_ratio: toks.length ? clamp(Math.round(((toks.length - uniqueWords) / toks.length) * 100), 0, 100) : 0,
    palavras_por_sentenca: sents.length ? Math.round(toks.length / sents.length) : 0
  };
}

export function conectivosPresentes(text) {
  const found = [];
  for (const funcao of Object.keys(CONECTIVOS)) {
    for (const c of CONECTIVOS[funcao]) {
      const re = new RegExp(`(?<![a-zà-ú])${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-zà-ú])`, 'i');
      if (re.test(text)) found.push({ conectivo: c, funcao });
    }
  }
  return { encontrados: found, funcoes: unique(found.map((f) => f.funcao)) };
}

export function temConectivo(p) {
  return TODOS_CONECTIVOS.some((c) => {
    const re = new RegExp(`(?<![a-zà-ú])${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-zà-ú])`, 'i');
    return re.test(p);
  });
}