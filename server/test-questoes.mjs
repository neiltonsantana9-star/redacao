import { gerarQuestoes, mockQuestoes, normalizarQuestoes } from './src/services/analise/ia.js';

const texto = `No meu bairro, todas as manha cedo a padaria ja esta cheia de gente apressada. Tem o seu Juca, que todo dia toma cafe e conversa sobre futebol. Eu acho muito legal essa rotina. Alem disso, as ruas sao limpas graças ao pessoal da faxina. Porem, tem um problema grande: o semafaro da avenida fica quebrado quase toda semana. Isso acaba atrapalhando muita coisa. As pessoas precisam ter mais cuidado. A prefeitura deveria fazer uma revisao no semafaro. Porque um semafaro quebrado causa acidentes de transito.`;

function valida(lista, nome) {
  if (!Array.isArray(lista) || lista.length === 0) throw new Error(`${nome}: lista vazia`);
  for (const [i, q] of lista.entries()) {
    if (!q.enunciado) throw new Error(`${nome} q${i}: sem enunciado`);
    if (!['fácil', 'médio', 'difícil'].includes(q.nivel)) throw new Error(`${nome} q${i}: nivel inválido ${q.nivel}`);
    if (q.alternativas.length && q.alternativas.length !== 4) throw new Error(`${nome} q${i}: ${q.alternativas.length} alternativas`);
    const idx = Number(q.correta);
    if (q.alternativas.length && (!Number.isInteger(idx) || idx < 0 || idx >= q.alternativas.length)) {
      throw new Error(`${nome} q${i}: correta inválida ${q.correta}`);
    }
    for (const a of q.alternativas) if (!String(a).trim()) throw new Error(`${nome} q${i}: alternativa vazia`);
  }
  const corretas = lista.filter((q) => q.alternativas.length).map((q) => Number(q.correta));
  if (new Set(corretas).size < 2) throw new Error(`${nome}: corretas não variam (${corretas.join(',')})`);
  console.log(`✓ ${nome}: ${lista.length} questões, corretas ${corretas.join(' ')}`);
}

const mock = mockQuestoes(texto, 'Narrativo', 5);
valida(mock, 'mockQuestoes');

const geradas = await gerarQuestoes(texto, 'Narrativo', 5);
valida(geradas, 'gerarQuestoes');

const norm = normalizarQuestoes({ questoes: [
  { nivel: 'fácil', enunciado: 'x?', alternativas: ['aa', 'bb', 'cc', 'dd'], correta: 'b', explicacao: 'ok' },
  { nivel: 'x', enunciado: 'y?', alternativas: [], correta: 0, explicacao: '' }
]});
if (norm.length !== 2 || norm[0].correta !== '1') throw new Error(`normalizarQuestoes: ${JSON.stringify(norm)}`);
console.log('✓ normalizarQuestoes');

console.log('\nExemplo de questão gerada:\n');
for (const q of mock.slice(0, 2)) {
  console.log(`[${q.nivel}] ${q.enunciado}`);
  q.alternativas.forEach((a, i) => console.log(`   ${String.fromCharCode(65 + i)}) ${a}${i === Number(q.correta) ? '  <- certa' : ''}`));
  console.log(`   Gabarito: ${q.explicacao}\n`);
}

console.log('✅ Todos os testes de questões passaram!');