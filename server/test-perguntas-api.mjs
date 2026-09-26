const BASE = 'http://localhost:4020';

const r = await fetch(`${BASE}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'professor@escola.com', password: 'prof123' })
});
const login = await r.json();
if (!r.ok) throw new Error(`login: ${JSON.stringify(login)}`);
const token = login.token;
const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
console.log('✓ login ok');

const list = await (await fetch(`${BASE}/api/perguntas?genero=Narrativo`, { headers: H })).json();
if (!list.questoes.length || list.questoes.length < 2) throw new Error(`banco Narrativo: ${list.questoes.length}`);
console.log(`✓ banco Narrativo: ${list.questoes.length} questões → ${list.questoes[0].enunciado}`);

const turmasRaw = await (await fetch(`${BASE}/api/turmas`, { headers: H })).json();
const turmaId = turmasRaw.turmas[0]?.id;
if (!turmaId) throw new Error('turma não encontrada');
const redacoesRaw = await (await fetch(`${BASE}/api/redacoes/turma/${turmaId}`, { headers: H })).json();
const redacaoId = redacoesRaw.redacoes[0]?.id;
if (!redacaoId) throw new Error('redação não encontrada');
console.log(`✓ contexto: turma #${turmaId}, redação #${redacaoId}`);

const criada = await (await fetch(`${BASE}/api/perguntas`, {
  method: 'POST', headers: H,
  body: JSON.stringify({ genero: 'Injuntivo', nivel: 'médio', enunciado: 'Qual é a função de um manual de instruções?', alternativas: ['Ensina procedimentos', 'Conta uma história', 'Vende um produto', 'Descreve um lugar'], correta: '0', explicacao: 'Manuais orientam como fazer.' })
})).json();
if (!criada.questao?.id) throw new Error(`criar: ${JSON.stringify(criada)}`);
console.log(`✓ criada questão #${criada.questao.id}`);

const geradas = await (await fetch(`${BASE}/api/perguntas/redacao/${redacaoId}/gerar`, {
  method: 'POST', headers: H, body: JSON.stringify({ quantidade: 5 })
})).json();
if (geradas.questoes?.length !== 5) throw new Error(`gerar: ${JSON.stringify(geradas)}`);
console.log(`✓ geração IA: ${geradas.questoes.length} questões (gênero ${geradas.genero})`);
for (const q of geradas.questoes) {
  const idx = Number(q.correta);
  const okAlt = q.alternativas.length === 0 || (Number.isInteger(idx) && q.alternativas[idx]);
  if (!okAlt) throw new Error(`correta inválida: ${JSON.stringify(q)}`);
}
console.log('✓ gabaritos coerentes nas geradas');

const porRed = await (await fetch(`${BASE}/api/perguntas/por-redacao/${redacaoId}`, { headers: H })).json();
if (porRed.questoes.length !== 5) throw new Error(`por-redacao: ${porRed.questoes.length}`);
console.log(`✓ por-redacao: ${porRed.questoes.length} questões salvas`);

const upd = await (await fetch(`${BASE}/api/perguntas/${criada.questao.id}`, {
  method: 'PUT', headers: H,
  body: JSON.stringify({ genero: 'Injuntivo', nivel: 'difícil', enunciado: 'Qual a função de um manual?', alternativas: ['Ensina a fazer', 'Narra fatos', 'Argumenta', 'Descreve'], correta: '0', explicacao: 'Manual instrui.', turmaId: null, atividadeId: null })
})).json();
if (upd.questao?.nivel !== 'difícil') throw new Error(`update: ${JSON.stringify(upd)}`);
console.log('✓ update ok');

const del = await fetch(`${BASE}/api/perguntas/${criada.questao.id}`, { method: 'DELETE', headers: H });
if (!del.ok) throw new Error(`delete: ${del.status}`);
console.log('✓ delete ok');

const semAuth = await fetch(`${BASE}/api/perguntas`);
if (semAuth.status !== 401) throw new Error(`401 esperado, veio ${semAuth.status}`);
console.log('✓ rota protegida');

console.log('\n✅ Testes de integração de questões passaram!');