import { tokens, clamp, sentences } from '../../utils.js';
import { splitParagraphs, conectivosPresentes, temConectivo } from './heuristica-base.js';

export function heuristicaCoesao(text, sentList) {
  const problems = [];
  const { encontrados, funcoes } = conectivosPresentes(text);

  const paras = splitParagraphs(text);
  paras.forEach((p) => {
    const hasConn = temConectivo(p);
    const len = p.split(/\s+/).length;
    if (len > 25 && !hasConn && paras.length > 1) {
      problems.push({
        trecho: p.slice(0, 90) + (p.length > 90 ? '…' : ''),
        sugestao: 'Este parágrafo não usa conectivo de articulação. Reforce a coesão com expressões como "além disso", "entretanto", "portanto".',
        tipo: 'conectivo'
      });
    }
  });

  const starters = sentList
    .filter((s) => s.length > 3)
    .map((s) => {
      const w = s.match(/[A-Za-zÀ-úÇç][a-zà-úç]*/);
      return w ? w[0].toLowerCase() : '';
    })
    .filter(Boolean);
  const counts = {};
  for (const w of starters) counts[w] = (counts[w] || 0) + 1;
  for (const [w, n] of Object.entries(counts)) {
    if (n >= 3 && sentList.length >= 5) {
      problems.push({
        trecho: w,
        sugestao: `A palavra "${w}" abre ${n} frases. Varie o início das frases para melhorar a coesão.`,
        tipo: 'repeticao_inicio'
      });
    }
  }

  const toks = tokens(text);
  const freq = {};
  for (const t of toks) freq[t] = (freq[t] || 0) + 1;
  const reps = Object.entries(freq)
    .filter(([w, n]) => n >= 4 && !['o','a','os','as','e','de','da','do','que','em','para','com','por','não','é','um','uma','se','na','no'].includes(w))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  for (const [w, n] of reps) {
    problems.push({
      trecho: w,
      sugestao: `A palavra "${w}" aparece ${n} vezes. Use sinônimos ou substitua por pronomes/termos anafóricos.`,
      tipo: 'repeticao_lexical'
    });
  }

  if (encontrados.length === 0 && paras.length >= 3 && tokens(text).length >= 80) {
    problems.push({
      trecho: text.slice(0, 90) + (text.length > 90 ? '…' : ''),
      sugestao: 'O texto praticamente não usa conectivos. Introduza articuladores como "portanto", "porém", "além disso" para a coesão.',
      tipo: 'sem_conectivo'
    });
  }

  const score = clamp(Math.round(10 - problems.length * 1.4 - (funcoes.length < 3 && encontrados.length > 0 ? 1 : 0)), 0, 10);
  return { score, problemas: problems, conectivos: { total: encontrados.length, funcoes } };
}