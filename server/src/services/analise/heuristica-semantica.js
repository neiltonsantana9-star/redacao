import { tokens, clamp, sentences } from '../../utils.js';

const VAGUENESS = new Set(['muito','muitos','muitas','bastante','vários','várias','umas','alguns','algumas','tudo','toda','todas','todo','grande','grandes','coisa']);

export function heuristicaSemantica(text) {
  const problemas = [];
  const toks = tokens(text);
  const total = toks.length;
  if (total === 0) return { score: 0, problemas };

  const freq = {};
  for (const t of toks) freq[t] = (freq[t] || 0) + 1;
  const uniqueCount = Object.keys(freq).length;
  const repRatio = (total - uniqueCount) / total;

  if (repRatio > 0.45) {
    problemas.push({
      trecho: text.slice(0, 90) + (text.length > 90 ? '…' : ''),
      sugestao: `Vocabulário muito repetido (${Math.round(repRatio * 100)}% de repetição). Amplie o repertório lexical para dar precisão ao sentido.`,
      tipo: 'repeticao'
    });
  }

  const vagaCount = {};
  for (const t of toks) if (VAGUENESS.has(t)) vagaCount[t] = (vagaCount[t] || 0) + 1;
  for (const [w, n] of Object.entries(vagaCount)) {
    if (n >= 3) {
      problemas.push({
        trecho: w,
        sugestao: `"${w}" aparece ${n} vezes e passa imprecisão. Substitua por termos específicos.`,
        tipo: 'imprecisao'
      });
    }
  }

  const oralMatch = text.match(/\b(tipo assim|tá|né|a gente|tipo|coisa)\b/gi);
  if (oralMatch) {
    problemas.push({
      trecho: oralMatch[0],
      sugestao: 'Registro coloquial ("tipo assim", "né", "a gente"). Prefira a variedade formal da norma padrão.',
      tipo: 'oralidade'
    });
  }

  const longSents = sentences(text).filter((s) => s.split(/\s+/).length >= 40).slice(0, 3);
  for (const s of longSents) {
    problemas.push({
      trecho: s.slice(0, 90) + (s.length > 90 ? '…' : ''),
      sugestao: `Frase de ${s.split(/\s+/).length} palavras é muito longa; o sentido fica confuso. Divida em períodos menores.`,
      tipo: 'periodo_longo'
    });
  }

  const score = clamp(Math.round(10 - problemas.length * 2 - (repRatio - 0.25 > 0 ? (repRatio - 0.25) * 5 : 0)), 0, 10);
  return { score, problemas };
}