const BASE = 'http://localhost:4020/api';

async function r(method, url, body) {
  const res = await fetch(BASE + url, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${url} -> ${res.status}: ${data.message || ''}`);
  return data;
}

let TOKEN = '';

async function main() {
  const login = await r('POST', '/auth/login', { email: 'professor@escola.com', password: 'prof123' });
  TOKEN = login.token;
  console.log('✓ login', login.user.email);

  const turmas = await r('GET', '/turmas');
  const turma = turmas.turmas[0];
  console.log('✓ turma', turma.nome, '| alunos:', turma.qtd_alunos);

  const al = await r('POST', `/turmas/${turma.id}/alunos`, { nome: 'Aluno Smoke Test' });
  console.log('✓ aluno criado', al.aluno.nome);

  const atv = await r('POST', `/atividades/turma/${turma.id}`, {
    titulo: 'Artigo de opinião', genero_textual: 'Argumentativo', tipo: 'individual', tema: 'Esporte na escola'
  });
  console.log('✓ atividade', atv.atividade.titulo, atv.atividade.tipo);

  const grupoAtv = await r('POST', `/atividades/turma/${turma.id}`, {
    titulo: 'Debate em grupo', genero_textual: 'Argumentativo', tipo: 'grupo', tema: 'Redes sociais',
    grupos: [{ nome: 'Grupo A', alunos: [al.aluno.id] }, { nome: 'Grupo B', alunos: [] }]
  });
  console.log('✓ atividade em grupo, grupos:', grupoAtv.atividade.grupos.length);

  const texto = `A violencia nas cidades tem crescido. Porem, muitas soluções ainda são ignoradas. Alem disso, a educação é a base para transformar essa realidade. Portanto, o poder publico deve investir em escolas.`;
  const red = await r('POST', '/redacoes', {
    turmaId: turma.id, atividadeId: atv.atividade.id, alunoId: al.aluno.id,
    titulo: 'Cidade e violência', texto, genero: 'Argumentativo'
  });
  console.log('✓ redação criada nota:', red.redacao.nota_final);
  console.log('   ortografia:', red.redacao.resultado.ortografia?.length,
    '| coesão:', red.redacao.resultado.coesao?.problemas?.length,
    '| semântica:', red.redacao.resultado.semantica?.problemas?.length,
    '| resumo:', String(red.redacao.resultado.resumo).slice(0, 60));

  const leitura = await r('GET', `/redacoes/${red.redacao.id}`);
  console.log('✓ get redação texto len:', leitura.redacao.texto.length, '| nota:', leitura.redacao.nota_final);

  await r('PUT', `/redacoes/${red.redacao.id}`, { notaFinal: 9.5 });
  const atualizada = await r('GET', `/redacoes/${red.redacao.id}`);
  console.log('✓ nota atualizada:', atualizada.redacao.nota_final);

  const redGrupo = await r('POST', '/redacoes', {
    turmaId: turma.id, atividadeId: grupoAtv.atividade.id,
    grupoId: grupoAtv.atividade.grupos[0].id,
    titulo: 'Texto do grupo', texto: 'O texto do grupo articula ideias e conectivos adequados.', genero: 'Argumentativo'
  });
  console.log('✓ redação em grupo, autor:', redGrupo.redacao.grupo?.nome);

  console.log('\n✅ SMOKE TEST OK');
}

main().catch((e) => {
  console.error('❌ FALHA:', e.message);
  process.exit(1);
});