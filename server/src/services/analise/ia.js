import { AI_API_URL, AI_API_KEY, AI_MODEL, MOCK_AI } from '../../config.js';
import { normalizeWord, clamp, tokens, sentences, stripNbsp, CONECTIVOS } from '../../utils.js';

const SYSTEM_PROMPT = `Você é uma professora de Língua Portuguesa experiente em correção de redações (padrão ENEM e escola).
Analise a redação e responda ÚNICA E EXCLUSIVAMENTE em JSON, sem texto extra, neste formato:
{
  "resumo": "avaliação geral em 2-3 frases",
  "competencia1": {"nome":"Domínio da norma culta","nota":0.0,"comentario":"..."},
  "competencia2": {"nome":"Compreensão da proposta","nota":0.0,"comentario":"..."},
  "competencia3": {"nome":"Argumentação e repertório","nota":0.0,"comentario":"..."},
  "competencia4": {"nome":"Coesão textual","nota":0.0,"comentario":"..."},
  "competencia5": {"nome":"Proposta de intervenção","nota":0.0,"comentario":"..."},
  "coesao": {"problemas":[{"trecho":"trecho exato da redação","sugestao":"como melhorar"}],"positivos":["..."],"avaliacao":"..."},
  "semantica": {"problemas":[{"trecho":"trecho exato da redação","sugestao":"o que está ambíguo/errado em sentido e como corrigir"}],"positivos":["..."],"avaliacao":"..."}
}
As notas das competências vão de 1 a 5 (apenas números). Os trechos em "problemas" DEVEM ser copiados literalmente da redação (1 a 8 palavras) para que o sistema os localize e destaque.`;

export const IA_AVAILABLE = Boolean((AI_API_URL && AI_API_KEY) || MOCK_AI);

export async function analisarComIA(text, genero) {
  const prompt = `${SYSTEM_PROMPT}\n\nGênero textual da atividade: ${genero || 'não informado'}\n\nRedação:\n\"\"\"\n${text}\n\"\"\"`;

  const res = await fetch(`${AI_API_URL.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`
    },
    body: JSON.stringify({
      model: AI_MODEL,
      temperature: 0.2,
      messages: [{ role: 'system', content: prompt }]
    })
  });
  if (!res.ok) throw new Error(`IA respondeu ${res.status}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  const json = content.replace(/```json|```/g, '').trim();
  return JSON.parse(json);
}

export function extrairCompetencias(parsed) {
  const out = [];
  for (const key of ['competencia1','competencia2','competencia3','competencia4','competencia5']) {
    const c = parsed[key];
    if (c && c.nome) {
      out.push({
        nome: String(c.nome),
        nota: clamp(Number(c.nota) || 0, 0, 5),
        comentario: String(c.comentario || '')
      });
    }
  }
  return out;
}

export function mockAI(text) {
  const toks = tokens(text);
  const freq = {};
  for (const t of toks) freq[t] = (freq[t] || 0) + 1;
  const repetidas = Object.entries(freq)
    .filter(([w, n]) => n >= 4 && !['o','a','os','as','e','de','da','do','que','em','para','com','por','não','um','uma','se','na','no'].includes(w))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return {
    resumo: 'Análise simulada (MOCK_AI=1): configure AI_API_URL e AI_API_KEY para uma correção qualitativa real. A redação apresenta pontos de atenção de coesão e vocabulário.',
    competencia1: { nome: 'Domínio da norma culta', nota: 3.5, comentario: 'Simulação. Aguardando IA real.' },
    competencia2: { nome: 'Compreensão da proposta', nota: 3.5, comentario: 'Simulação. Aguardando IA real.' },
    competencia3: { nome: 'Argumentação e repertório', nota: 3.0, comentario: 'Simulação. Aguardando IA real.' },
    competencia4: { nome: 'Coesão textual', nota: 3.0, comentario: 'Simulação. Aguardando IA real.' },
    competencia5: { nome: 'Proposta de intervenção', nota: 3.0, comentario: 'Simulação. Aguardando IA real.' },
    coesao: {
      problemas: repetidas.map(([w, n]) => ({
        trecho: w,
        sugestao: `A palavra "${w}" se repete ${n} vezes; varie o vocabulário usando sinônimos.`
      })),
      positivos: ['Há estrutura em parágrafos.', 'O texto apresenta articulação básica.'],
      avaliacao: 'Avaliação simulada.'
    },
    semantica: {
      problemas: [],
      positivos: ['Clareza geral razoável.'],
      avaliacao: 'Avaliação simulada.'
    }
  };
}

// ---------------------------------------------------------------------------
// Questões de interpretação textual
// ---------------------------------------------------------------------------

const PROMPT_QUESTOES = (quantidade) => `Você é uma professora de Língua Portuguesa experiente em interpretação textual.
Com base na REDAÇÃO DE UMA ALUNA/O abaixo (o texto PODE conter erros de escrita da aluna, que não devem ser corrigidos nas questões):
gere ${quantidade} questões de interpretação textual.
Responda ÚNICA E EXCLUSIVAMENTE em JSON (array), sem texto extra, neste formato:
[
  {"nivel":"fácil","enunciado":"pergunta","alternativas":["opcao a","opcao b","opcao c","opcao d"],"correta":2,"explicacao":"por que a alternativa 2 é correta (1-2 frases)"}
]
Regras:
- Cada questão tem exatamente 4 alternativas objetivas; "correta" é o índice (0 a 3) e deve variar entre as questões.
- Variar níveis: fácil, médio e difícil.
- Incluir ao menos: uma questão sobre o gênero textual, uma sobre o tema/ideia central, uma de vocabulário e uma de inferência.
- Não escrever "correta"/"alternativa correta" dentro do enunciado.
- Alternativas plausíveis, sem repetições e relacionadas ao texto.`;

export async function gerarQuestoesComIA(text, genero, quantidade = 5) {
  const prompt = `${PROMPT_QUESTOES(quantidade)}\n\nGênero textual: ${genero || 'não informado'}\n\nRedação:\n\"\"\"\n${text}\n\"\"\"`;

  const res = await fetch(`${AI_API_URL.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`
    },
    body: JSON.stringify({
      model: AI_MODEL,
      temperature: 0.4,
      messages: [
        { role: 'system', content: prompt }
      ]
    })
  });
  if (!res.ok) throw new Error(`IA respondeu ${res.status}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  return JSON.parse(content.replace(/```json|```/g, '').trim());
}

export function normalizarQuestoes(lista) {
  let arr = lista;
  if (!Array.isArray(arr)) {
    if (arr && Array.isArray(arr.questoes)) arr = arr.questoes;
    else if (arr && Array.isArray(arr.perguntas)) arr = arr.perguntas;
    else return [];
  }
  const letraParaIdx = { a: '0', b: '1', c: '2', d: '3' };
  return arr
    .slice(0, 10)
    .map((q) => {
      const alt = Array.isArray(q.alternativas)
        ? q.alternativas.map((a) => String(a).replace(/^[a-dA-D][.)]\s*/, '').trim()).filter(Boolean)
        : [];
      let correta = q.correta;
      if (typeof correta === 'number') correta = String(correta);
      if (letraParaIdx[String(correta || '').toLowerCase()]) correta = letraParaIdx[String(correta).toLowerCase()];
      const idx = Number(correta);
      const corretaValida = Number.isInteger(idx) && idx >= 0 && idx < alt.length;
      if (!corretaValida && alt.length) {
        const found = alt.findIndex((a) => String(a).trim().toLowerCase() === String(q.correta || '').trim().toLowerCase());
        correta = found >= 0 ? String(found) : '0';
      }
      return {
        nivel: ['fácil', 'médio', 'difícil'].includes(q.nivel) ? q.nivel : 'médio',
        enunciado: String(q.enunciado || '').trim(),
        alternativas: alt,
        correta: corretaValida ? String(idx) : String(correta ?? '0'),
        explicacao: String(q.explicacao || '')
      };
    })
    .filter((q) => q.enunciado);
}

export async function gerarQuestoes(text, genero, quantidade = 5) {
  if (MOCK_AI) return mockQuestoes(text, genero, quantidade);
  return normalizarQuestoes(await gerarQuestoesComIA(text, genero, quantidade));
}

// ---------------- Geração simulada (MOCK_AI=1) ----------------

const STOP_TEMA = new Set([
  'sobre', 'mais', 'muito', 'quando', 'também', 'porque', 'coisa', 'coisas',
  'meu', 'minha', 'essa', 'esse', 'este', 'esta', 'sua', 'seu', 'como', 'não',
  'depois', 'antes', 'tudo', 'nenhum', 'outro', 'outra', 'já', 'até', 'ainda'
]);

const CONECTIVO_NOME = {
  adicao: 'adição', oposicao: 'oposição', conclusao: 'conclusão', causa: 'causa',
  consequencia: 'consequência', tempo: 'tempo', exemplificacao: 'exemplificação',
  condicionais: 'condição', finalidade: 'finalidade', comparacao: 'comparação'
};

const OUTROS_CONECTIVOS = ['oposição', 'causa', 'consequência', 'tempo', 'adição', 'finalidade', 'exemplificação'];

const SINONIMOS = {
  problema: { sin: 'questão', outros: ['solução', 'consequência', 'escolha'] },
  pessoas: { sin: 'indivíduos', outros: ['objetos', 'lugares', 'datas'] },
  cidade: { sin: 'município', outros: ['comunidade', 'fazenda', 'planeta'] },
  casa: { sin: 'residência', outros: ['vizinho', 'escola', 'praça'] },
  escola: { sin: 'instituto', outros: ['hospital', 'igreja', 'mercado'] },
  criança: { sin: 'menino/menina', outros: ['adulto', 'idoso', 'estudante'] },
  cuidado: { sin: 'atenção', outros: ['pressa', 'falta', 'tontura'] },
  lugar: { sin: 'local', outros: ['momento', 'objeto', 'pessoa'] },
  tempo: { sin: 'período', outros: ['espaço', 'quantidade', 'velocidade'] },
  coisa: { sin: 'item', outros: ['lugar', 'momento', 'pessoa'] },
  importante: { sin: 'essencial', outros: ['opcional', 'supérfluo', 'rápido'] },
  trânsito: { sin: 'circulação', outros: ['congestionamento', 'sinalização', 'mobilidade'] },
  bairro: { sin: 'região', outros: ['prédio', 'rua', 'favela'] }
};

function topTema(text) {
  const freq = {};
  for (const t of tokens(text)) {
    if (t.length > 3 && !STOP_TEMA.has(t)) freq[t] = (freq[t] || 0) + 1;
  }
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  return sorted.length ? sorted[0][0] : null;
}

function acharConectivo(text) {
  const t = stripNbsp(text).toLowerCase();
  for (const [funcao, lista] of Object.entries(CONECTIVOS)) {
    for (const pal of lista) {
      const p = pal.toLowerCase();
      const re = new RegExp(`(^|[\\s,.;:!?…])${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s,.;:!?…]|$)`, 'i');
      if (re.test(t)) return { palavra: pal, funcao: CONECTIVO_NOME[funcao] || funcao };
    }
  }
  return null;
}

function acharSinonimo(text) {
  for (const [pal, info] of Object.entries(SINONIMOS)) {
    const re = new RegExp(`(^|[\\s,.;:!?…])${pal}([\\s,.;:!?…]|$)`, 'i');
    if (re.test(` ${stripNbsp(text).toLowerCase()} `)) return { palavra: pal, sinonimo: info.sin, outros: info.outros };
  }
  return null;
}

function rotacionar(q, i) {
  const n = q.alternativas.length;
  if (!n) return { ...q, correta: '0' };
  const r = (i * 2 + 1) % n;
  const ordem = q.alternativas.map((_, j) => q.alternativas[(j + r) % n]);
  const correta = (n - r) % n;
  return { ...q, alternativas: ordem, correta: String(correta) };
}

function encurtar(f, max = 70) {
  const s = String(f || '').trim();
  return s.length > max ? `${s.slice(0, max).trimEnd()}...` : s;
}

export function mockQuestoes(text, genero, quantidade = 5) {
  const t = stripNbsp(String(text || '')).trim();
  const frases = (sentences(t).filter((f) => f.length >= 18) || []);
  const tema = topTema(t);
  const generosDisponiveis = ['Narrativo', 'Argumentativo', 'Descritivo', 'Expositivo', 'Injuntivo', 'Lírico', 'Teatral'];
  const raiz = [];

  raiz.push({
    nivel: 'fácil',
    enunciado: genero && generosDisponiveis.includes(genero)
      ? 'A que gênero textual pertence o texto lido?'
      : 'O texto lido tem características mais próximas de qual gênero textual?',
    alternativas: genero ? [genero, ...generosDisponiveis.filter((g) => g !== genero).slice(0, 3)] : ['Narrativo', 'Argumentativo', 'Injuntivo', 'Descritivo'],
    explicacao: `O texto apresenta características típicas do gênero ${genero || 'identificado'}.`
  });

  raiz.push(tema
    ? {
        nivel: 'fácil',
        enunciado: 'Qual é o tema central tratado no texto?',
        alternativas: [tema, 'o trânsito', 'a tecnologia', 'a rotina escolar'],
        explicacao: `O texto gira em torno de "${tema}".`
      }
    : {
        nivel: 'fácil',
        enunciado: 'O que o texto faz em primeiro lugar?',
        alternativas: ['apresenta uma situação do cotidiano', 'uma receita de bolo', 'um anúncio publicitário', 'uma prova de matemática'],
        explicacao: 'A abertura do texto apresenta a situação que será desenvolvida.'
      });

  const principal = frases.slice().sort((a, b) => b.length - a.length)[0] || 'O texto defende uma ideia sobre o tema abordado.';
  const certaIdea = encurtar(principal);
  raiz.push({
    nivel: 'médio',
    enunciado: 'Qual das frases melhor expressa a ideia central do texto?',
    alternativas: [certaIdea, ...frases.slice(1, 4).map(encurtar).filter((f) => f !== certaIdea)],
    explicacao: 'A frase destacada apresenta a afirmação principal da produção.'
  });

  const conec = acharConectivo(t);
  raiz.push(conec
    ? {
        nivel: 'médio',
        enunciado: `Que relação o conectivo "${conec.palavra}" estabelece no trecho em que aparece?`,
        alternativas: [conec.funcao, ...OUTROS_CONECTIVOS.filter((f) => f !== conec.funcao).slice(0, 3)],
        explicacao: `"${conec.palavra}" articula as ideias e indica relação de ${conec.funcao}.`
      }
    : {
        nivel: 'médio',
        enunciado: 'Qual expressão poderia ser usada pelo autor para acrescentar uma ideia nova ao texto?',
        alternativas: ['além disso', 'porém', 'finalmente', 'porque'],
        explicacao: '"além disso" é um conectivo de adição.'
      });

  const sin = acharSinonimo(t);
  raiz.push(sin
    ? {
        nivel: 'difícil',
        enunciado: `No contexto do texto, a palavra "${sin.palavra}" poderia ser substituída, sem alterar o sentido, por:`,
        alternativas: [sin.sinonimo, ...sin.outros],
        explicacao: `"${sin.palavra}" assume o sentido de "${sin.sinonimo}" nesse contexto.`
      }
    : {
        nivel: 'difícil',
        enunciado: 'O que se pode concluir a partir das informações apresentadas no texto?',
        alternativas: ['que há uma preocupação com um tema do cotidiano', 'que o autor é imparcial e neutro', 'que se trata de uma ficção científica', 'que o texto é um manual de instruções'],
        explicacao: 'A conclusão mais direta generaliza a preocupação central do autor.'
      });

  raiz.push({
    nivel: 'difícil',
    enunciado: 'Qual conclusão pode ser inferida a partir das informações do texto?',
    alternativas: ['há uma preocupação com o tema abordado no cotidiano', 'o autor não manifesta qualquer opinião', 'o texto é puramente técnico e imparcial', 'o objetivo é ensinar um procedimento passo a passo'],
    explicacao: 'A leitura permite inferir uma preocupação com o tema central da produção.'
  });

  return raiz.slice(0, quantidade).map(rotacionar);
}