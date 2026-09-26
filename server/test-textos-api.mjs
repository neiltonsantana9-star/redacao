const BASE = 'http://localhost:4020';

async function j(res) {
  const d = await res.json();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(d)}`);
  return d;
}

let token;
let headers;

try {
  ({ token } = await j(await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'professor@escola.com', password: 'prof123' })
  })));
  headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  console.log('✓ login ok');

  const lista = await j(await fetch(`${BASE}/api/textos`, { headers }));
  if (!lista.textos.length) throw new Error('acervo vazio');
  console.log(`✓ acervo: ${lista.textos.length} textos`);

  const t4 = lista.textos.find((t) => t.genero === 'Teatral');
  const t1 = lista.textos.find((t) => t.genero === 'Narrativo');
  if (!t4 || !t1) throw new Error('faltam gêneros no seed');

  const q1 = await j(await fetch(`${BASE}/api/perguntas/por-texto/${t1.id}`, { headers }));
  if (q1.questoes.length < 4) throw new Error(`por-texto: ${q1.questoes.length}`);
  console.log(`✓ '${t1.titulo}' → ${q1.questoes.length} questões ligadas`);

  const t4q = await j(await fetch(`${BASE}/api/perguntas/por-texto/${t4.id}`, { headers }));
  if (t4q.questoes.length < 4) throw new Error(`por-texto teatral: ${t4q.questoes.length}`);
  console.log(`✓ '${t4.titulo}' → ${t4q.questoes.length} questões ligadas (cena teatral)`);

  const det = await j(await fetch(`${BASE}/api/textos/${t1.id}`, { headers }));
  if (!det.texto.titulo || det.texto.qtd_questoes < 4) throw new Error('get texto');
  console.log(`✓ get texto #${t1.id}: "${det.texto.titulo}" (${det.texto.qtd_questoes} questões)`);

  const ger = await j(await fetch(`${BASE}/api/textos/${t1.id}/gerar`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ quantidade: 5 })
  }));
  if (!ger.questoes || ger.questoes.length < 5) throw new Error(`gerar: ${ger.questoes?.length}`);
  const geradasIA = ger.questoes.filter((q) => q.origem === 'ia').length;
  if (geradasIA < 5) throw new Error(`ia questions: ${geradasIA}`);
  console.log(`✓ geração IA: ${ger.questoes.length} questões (${geradasIA} de origem ia)`);
  for (const q of ger.questoes.filter((x) => x.origem === 'ia')) {
    const idx = Number(q.correta);
    if (q.alternativas.length === 4 && (!Number.isInteger(idx) || idx < 0 || idx > 3)) {
      throw new Error(`gabarito inválido na gerada: ${q.enunciado}`);
    }
  }
  console.log('✓ gabaritos coerentes nas geradas');

  const criada = await j(await fetch(`${BASE}/api/perguntas`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      textoId: t1.id,
      genero: 'Narrativo',
      nivel: 'difícil',
      enunciado: 'Teste manual ligado ao texto',
      alternativas: ['a', 'b', 'c', 'd'],
      correta: '1',
      explicacao: 'teste'
    })
  }));
  if (!criada.questao?.id || criada.questao.texto_id !== t1.id) throw new Error('criar questão com texto');
  console.log(`✓ questão criada ligada ao texto (#${criada.questao.id})`);

  const up = await j(await fetch(`${BASE}/api/perguntas/${criada.questao.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      genero: 'Narrativo',
      nivel: 'médio',
      enunciado: 'Teste manual ligado ao texto (editado)',
      alternativas: ['a', 'b', 'c', 'd', 'e'],
      correta: '4',
      explicacao: 'teste editado'
    })
  }));
  if (up.questao.enunciado.indexOf('editado') < 0) throw new Error('update questão');
  console.log('✓ update da questão ok');

  const novoTexto = await j(await fetch(`${BASE}/api/textos`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      titulo: 'Texto de teste',
      autor: 'Teste',
      fonte: 'Ensaio',
      genero: 'Expositivo',
      nivel: 'difícil',
      orientacao: 'Leia e responda.',
      texto: 'Primeiro parágrafo sobre o teste.\n\nSegundo parágrafo com exemplo.'
    })
  }));
  if (!novoTexto.texto?.id) throw new Error('criar texto');
  console.log(`✓ texto criado #${novoTexto.texto.id}`);

  const novoQ = await j(await fetch(`${BASE}/api/perguntas`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ textoId: novoTexto.texto.id, genero: 'Expositivo', nivel: 'difícil', enunciado: 'Questão do texto novo', alternativas: ['x', 'y', 'z', 'w'], correta: '2', explicacao: 'ok' })
  }));
  const del = await fetch(`${BASE}/api/textos/${novoTexto.texto.id}`, { method: 'DELETE', headers });
  if (!del.ok) throw new Error('delete texto');
  const pos = await j(await fetch(`${BASE}/api/perguntas?ids=${novoQ.questao.id}`, { headers }));
  if (pos.questoes.length !== 0) throw new Error('questão do texto deletado deveria sumir (cascade)');
  console.log('✓ delete texto apagou a questão ligada (cascade)');

  const filtro = await j(await fetch(`${BASE}/api/textos?genero=Lírico`, { headers }));
  if (!filtro.textos.length) throw new Error('filtro por gênero');
  console.log(`✓ filtro gênero Lírico: ${filtro.textos.length} texto(s)`);

  const busca = await j(await fetch(`${BASE}/api/textos?busca=bananeira`, { headers }));
  if (!busca.textos.length) throw new Error('busca por trecho');
  console.log(`✓ busca "bananeira": ${busca.textos.length} texto(s)`);

  const s401 = await fetch(`${BASE}/api/textos`, { headers: {} });
  if (s401.status !== 401) throw new Error('rota deveria exigir login');
  console.log('✓ rota protegida');

  console.log('\n✅ Testes de textos + questões passaram!');
} catch (e) {
  console.error('\n❌', e.message);
  process.exit(1);
}