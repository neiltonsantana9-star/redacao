import * as auth from './src/services/auth.service.js';

async function main() {
  const user = await auth.login({ email: 'professor@escola.com', password: 'prof123' });
  console.log('LOGIN OK ->', user.name, user.email);

  const { analisarRedacao } = await import('./src/services/analise/index.js');

  const bons = `A violência urbana tem crescido de forma preocupante nos grandes centros. Entretanto, muitas soluções ainda são ignoradas. Além disso, a educação é a base para transformar essa realidade. Portanto, o poder público deve investir em escolas e em políticas de inclusão social.`;
  const ruins = `no meu bairro todas as manha cedo a padaria ja esta cheia de gente apressada. Tem o seu Juca que todo dia toma cafe e conversa sobre futebol. Eu acho muito legal essa rotina. Alem disso as ruas sao limpas graças ao pessoal da faxina. Porem tem um problema grande o semafaro da avenida fica quebrado quase toda semana. Isso acaba atrapalhando muita coisa. As pessoas precisam ter cuidado cuidado cuidado cuidado cuidado. A prefeitura deveria fazer uma revisao no semafaro. Porque um semafaro quebrado causa acidentes de transito.`

  for (const [nome, tx] of [['BOM', bons], ['RUIM', ruins]]) {
    const r = await analisarRedacao(tx, { genero: 'Argumentativo' });
    console.log(`\n===== ${nome} =====`);
    console.log('nota:', r.nota, '(mecânica:', r.nota_mecanica + ')', '| IA:', r.ia, '| aviso:', r.aviso);
    console.log('ortografia:', r.ortografia.length, '| coesão:', r.coesao.problemas.length, '| semântica:', r.semantica.problemas.length);
    console.log('objetivos:', r.objetivos);
    if (r.ortografia[0]) console.log('  ex. ortografia:', String(r.ortografia[0].message).slice(0, 100), '->', r.ortografia[0].replacements?.slice(0, 2));
    if (r.coesao.problemas[0]) console.log('  ex. coesão:', r.coesao.problemas[0].tipo, '|', String(r.coesao.problemas[0].message).slice(0, 90));
    if (r.semantica.problemas[0]) console.log('  ex. semântica:', r.semantica.problemas[0].tipo, '|', String(r.semantica.problemas[0].message).slice(0, 90));
    console.log('competências:', r.competencias.map((c) => `${c.nome}: ${c.nota}`).join(' | '));
  }

  console.log('\nOK\n');
}

main().catch((e) => {
  console.error('FALHA:', e.message);
  console.error(e.stack);
  process.exit(1);
});