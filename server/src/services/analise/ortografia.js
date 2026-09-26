import { LANGUAGETOOL_URL } from '../../config.js';

const LT_CATEGORY_LABEL = {
  TYPOS: 'Ortografia',
  CASING: 'Majúsculas/minúsculas',
  PUNCTUATION: 'Pontuação',
  GRAMMAR: 'Gramática',
  STYLE: 'Estilo',
  SEMANTICS: 'Semântica',
  REDUNDANCY: 'Redundância',
  CONSECUTIVE_DOTS: 'Pontuação',
  TYPOGRAPHY: 'Tipografia',
  CONFUSED_WORDS: 'Palavras confusas',
  COMMA_PARENTHESIS: 'Coesão',
  AGREEMENT_SENT_START: 'Gramática'
};

function ltCategory(match) {
  const cat = (match.rule?.category?.id || '').toUpperCase();
  return LT_CATEGORY_LABEL[cat] || 'Outros';
}

export async function checkLanguageTool(text) {
  const params = new URLSearchParams();
  params.set('text', text);
  params.set('language', 'pt-BR');
  params.set('enabledOnly', 'false');

  const res = await fetch(LANGUAGETOOL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });
  if (!res.ok) throw new Error(`LanguageTool respondeu ${res.status}`);
  const data = await res.json();

  return (data.matches || [])
    .map((m) => ({
      start: m.offset,
      end: m.offset + m.length,
      message: m.message || m.shortMessage || 'Erro detectado',
      replacements: (m.replacements || []).slice(0, 3).map((r) => r.value),
      categoria: ltCategory(m),
      regra: m.rule?.id || '',
      tipo: m.rule?.issueType || '',
      contexto: m.context?.text || ''
    }))
    .filter((m) => m.end > m.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);
}