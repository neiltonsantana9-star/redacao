import { sentences, tokens, normalizeWord, clamp, stripNbsp } from '../../utils.js';
import { checkLanguageTool } from './ortografia.js';
import { heuristicaCoesao } from './heuristica-coesao.js';
import { heuristicaSemantica } from './heuristica-semantica.js';
import { estatisticas } from './heuristica-base.js';
import { analisarComIA, extrairCompetencias, IA_AVAILABLE, mockAI } from './ia.js';
import { MOCK_AI } from '../../config.js';

function findWord(text, word, from = 0) {
  const norm = normalizeWord(String(word).replace(/[.,!?;:…"']/g, ''));
  if (!norm) return -1;
  const escaped = norm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?<![a-zà-ú])${escaped}(?![a-zà-ú])`, 'i');
  const m = String(text).substring(from).match(re);
  return m ? m.index + from : -1;
}

function mapPositions(text, items) {
  const out = [];
  for (const item of items || []) {
    const trecho = String(item.trecho || '').trim();
    if (!trecho) continue;
    let start = text.indexOf(trecho);
    if (start === -1) start = findWord(text, trecho);
    if (start === -1) continue;
    out.push({
      start,
      end: start + trecho.length,
      trecho,
      message: item.sugestao || item.message || '',
      tipo: item.tipo || 'info'
    });
  }
  return out;
}

function mergeProblemas(local, ia, categoria) {
  const seen = new Set();
  const out = [];
  const push = (p) => {
    const key = `${p.tipo}|${p.start}|${p.end}|${String(p.message || p.sugestao || '').slice(0, 40)}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ ...p, categoria, message: p.message || p.sugestao || '' });
  };
  for (const p of local) push(p);
  for (const p of ia) push(p);
  return out.sort((a, b) => a.start - b.start);
}

export async function analisarRedacao(texto, { genero = '' } = {}) {
  const text = stripNbsp(String(texto || '')).trim();
  if (text.length < 10) {
    throw Object.assign(new Error('O texto da redação é muito curto para análise'), { status: 400 });
  }

  const sentList = sentences(text);
  const stats = estatisticas(text);

  let ortografia = [];
  try {
    ortografia = await checkLanguageTool(text);
  } catch (e) {
    console.warn('[LanguageTool indisponível]', e.message);
  }

  const coesao = heuristicaCoesao(text, sentList);
  const semantica = heuristicaSemantica(text);

  const ia = await analisarIA(text, genero);

  const coesaoProblemas = mergeProblemas(coesao.problemas, ia.coesaoProblemas, 'coesao');
  const semanticaProblemas = mergeProblemas(semantica.problemas, ia.semanticaProblemas, 'semantica');

  let notaMecanica = clamp(
    Math.round(((coesao.score || 0) + (semantica.score || 0)) / 2) - Math.min(ortografia.length * 0.7, 3),
    1, 10
  );
  let notaFinal = notaMecanica;
  if (ia.notaMedia) {
    const notaIA = (ia.notaMedia / 5) * 10;
    notaFinal = clamp(Math.round(notaMecanica * 0.4 + notaIA * 0.6), 1, 10);
  }

  const competencias = ia.competencias.length
    ? ia.competencias
    : competenciasHeuristicas(ortografia, coesao, semantica, stats);

  return {
    ia: ia.usado,
    aviso: ia.aviso,
    nota: notaFinal,
    nota_mecanica: notaMecanica,
    ortografia,
    coesao: {
      score: coesao.score,
      problemas: coesaoProblemas,
      positivos: ia.coesaoPositivos,
      avaliacao: ia.coesaoAvaliacao,
      conectivos: coesao.conectivos
    },
    semantica: {
      score: semantica.score,
      problemas: semanticaProblemas,
      positivos: ia.semanticaPositivos,
      avaliacao: ia.semanticaAvaliacao
    },
    competencias,
    resumo: ia.resumo || resumoHeuristico(coesao, semantica, ortografia.length, stats),
    estatisticas: stats,
    objetivos: ortografia.length === 0 && coesao.problemas.length === 0 && semantica.problemas.length === 0
  };
}

async function analisarIA(text, genero) {
  const padrao = {
    usado: false,
    aviso: '',
    resumo: '',
    notaMedia: null,
    competencias: [],
    coesaoProblemas: [],
    coesaoPositivos: [],
    coesaoAvaliacao: '',
    semanticaProblemas: [],
    semanticaPositivos: [],
    semanticaAvaliacao: ''
  };
  if (!IA_AVAILABLE) return padrao;

  try {
    const parsed = MOCK_AI ? mockAI(text) : await analisarComIA(text, genero);
    const competencias = extrairCompetencias(parsed);
    const media = competencias.length
      ? clamp(competencias.reduce((a, c) => a + c.nota, 0) / competencias.length, 1, 5)
      : null;
    return {
      usado: true,
      aviso: '',
      resumo: String(parsed.resumo || ''),
      notaMedia: media,
      competencias,
      coesaoProblemas: mapPositions(text, parsed.coesao?.problemas),
      coesaoPositivos: parsed.coesao?.positivos || [],
      coesaoAvaliacao: String(parsed.coesao?.avaliacao || ''),
      semanticaProblemas: mapPositions(text, parsed.semantica?.problemas),
      semanticaPositivos: parsed.semantica?.positivos || [],
      semanticaAvaliacao: String(parsed.semantica?.avaliacao || '')
    };
  } catch (e) {
    console.warn('[IA indisponível]', e.message);
    return { ...padrao, aviso: 'A IA não respondeu neste momento; a análise abaixo é baseada em heurísticas locais.' };
  }
}

function competenciasHeuristicas(ort, coesao, sem, stats) {
  const errosPorMil = stats.palavras ? Math.round((ort.length / stats.palavras) * 1000) : 0;
  const notaNorma = clamp(5 - errosPorMil / 4, 1, 5);
  const notaCoesao = clamp(2 + (coesao.score / 10) * 3, 1, 5);
  const notaSem = clamp(2 + (sem.score / 10) * 3, 1, 5);
  const notaArg = clamp(1 + Math.min(stats.palavras / 120, 3), 1, 5);
  return [
    { nome: 'Domínio da norma culta', nota: Number(notaNorma.toFixed(1)), comentario: `Estimativa a partir de ${ort.length} sugestões ortográficas/gramaticais.` },
    { nome: 'Compreensão da proposta', nota: Number(notaArg.toFixed(1)), comentario: `Estimativa a partir da extensão (${stats.palavras} palavras) e estrutura do texto.` },
    { nome: 'Argumentação e repertório', nota: Number(notaArg.toFixed(1)), comentario: 'Estimativa heurística; configure chave de IA para análise qualitativa real.' },
    { nome: 'Coesão textual', nota: Number(notaCoesao.toFixed(1)), comentario: `Baseado em ${coesao.conectivos.total} conectivos e ${coesao.problemas.length} problemas de coesão.` },
    { nome: 'Proposta de intervenção', nota: 3, comentario: 'Valor neutro na estimativa; depende do gênero argumentativo.' }
  ];
}

function resumoHeuristico(coesao, sem, erros, stats) {
  const orto = erros === 0 ? 'Nenhuma sugestão ortográfica foi encontrada.' : `${erros} sugestões ortográficas/gramaticais encontradas.`;
  return `Texto com ${stats.palavras} palavras em ${stats.paragrafos} parágrafo(s). ${orto} Coesão avaliada em ${coesao.score}/10 (${coesao.problemas.length} problema(s)) e semântica em ${sem.score}/10 (${sem.problemas.length} problema(s)). Configure uma chave de IA no .env para uma avaliação qualitativa completa por competências.`;
}