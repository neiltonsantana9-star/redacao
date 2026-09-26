import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { analisarRedacao } from './services/analise/index.js';

const EMAIL = process.env.SEED_EMAIL || 'professor@escola.com';
const SENHA = process.env.SEED_SENHA || 'prof123';

function ensureUser() {
  let user = db.prepare('SELECT id FROM users WHERE email = ?').get(EMAIL);
  if (!user) {
    const hash = bcrypt.hashSync(SENHA, 10);
    const info = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
      .run('Professora Demo', EMAIL, hash);
    user = { id: Number(info.lastInsertRowid) };
  }
  return user.id;
}

const QUESTAO_BANCO = [
  ['Narrativo', 'fácil', 'Em uma narrativa, o que é o narrador?', ['Quem conta a história', 'Quem desenha a capa', 'O personagem vilão', 'O leitor do texto'], 0, 'O narrador é a voz que conta a história.'],
  ['Narrativo', 'médio', 'Os elementos essenciais de um texto narrativo são:', ['Personagens, enredo, tempo e espaço', 'Rima, métrica e estrofes', 'Argumentos e dados estatísticos', 'Instruções passo a passo'], 0, 'A narrativa estrutura-se com enredo, personagens, tempo e espaço.'],
  ['Narrativo', 'difícil', 'A diferença entre narrador-personagem e narrador-observador é:', ['O tipo de fonte de texto', 'O tipo de eixo temático', 'A distância entre narrador e leitor', 'A participação da voz na história'], 3, 'O narrador-personagem participa da história; o observador apenas a conta.'],
  ['Argumentativo', 'fácil', 'Qual é a finalidade de um texto dissertativo-argumentativo?', ['Convencer o leitor por meio de argumentos', 'Narrar uma aventura', 'Descrever uma paisagem', 'Instruir sobre um procedimento'], 0, 'O objetivo é apresentar e defender um ponto de vista.'],
  ['Argumentativo', 'médio', 'O que é uma tese em um texto argumentativo?', ['Uma pergunta retórica', 'A ideia que se quer defender', 'O título da redação', 'A conclusão de um relatório'], 1, 'A tese é a ideia principal que o autor procura defender.'],
  ['Argumentativo', 'difícil', '“Argumento de autoridade” é:', ['Citar uma pessoa ou fonte especializada', 'Gritar com o leitor', 'Apelar para a emoção sem fundamento', 'Descrever um ambiente'], 0, 'Recorre a especialistas para sustentar a tese.'],
  ['Descritivo', 'fácil', 'Um texto descritivo tem como objetivo:', ['Detalhar características de pessoas, lugares ou objetos', 'Defender uma opinião', 'Contar fatos em ordem cronológica', 'Dar instruções de uso'], 0, 'A descrição evidencia atributos e detalhes.'],
  ['Descritivo', 'médio', 'As figuras de linguagem comuns em textos descritivos são:', ['Comparações e metáforas', 'Argumentos e contra-argumentos', 'Personagens e diálogos', 'Estrofes e versos'], 0, 'Sensações e comparações tornam a descrição viva.'],
  ['Expositivo', 'fácil', 'Qual é o principal objetivo de um texto expositivo?', ['Explicar um assunto', 'Vender um produto', 'Comover o leitor', 'Apresentar um personagem'], 0, 'O texto expositivo informa e explica de forma objetiva.'],
  ['Expositivo', 'médio', 'Uma característica da linguagem de um texto expositivo é:', ['Objetividade e linguagem clara', 'Uso frequente de rimas', 'Linguagem cifrada e secreta', 'Foco em sensações do autor'], 0, 'Clareza e objetividade favorecem a compreensão.'],
  ['Injuntivo', 'fácil', 'Textos injuntivos, como receitas e manuais, servem para:', ['Orientar a realização de tarefas', 'Defender uma opinião', 'Relatar uma memória', 'Fazer uma crítica'], 0, 'Eles indicam como fazer algo, passo a passo.'],
  ['Injuntivo', 'médio', 'Em uma receita culinária, os verbos costumam aparecer no modo:', ['Imperativo', 'Subjuntivo', 'Gerúndio', 'Infinitivo pessoal'], 0, 'O imperativo orienta ações: misture, asse, sirva.'],
  ['Lírico', 'fácil', 'O que caracteriza um poema?', ['O uso de versos e estrofes', 'A divisão em capítulos', 'As rubricas de palco', 'Os gráficos e tabelas'], 0, 'O poema organiza-se em versos, podendo ter estrofes e rimas.'],
  ['Lírico', 'médio', 'A “eu lírico” em um poema é:', ['A voz que expressa emoções no poema', 'O compositor da música', 'O personagem principal', 'O leitor do texto'], 0, 'O eu lírico é o sujeito que fala no poema.'],
  ['Teatral', 'fácil', 'As rubricas em um texto teatral servem para:', ['Indicar ações, gestos e cenário', 'Contar uma piada', 'Explicar uma conta', 'Apresentar estatísticas'], 0, 'Rubricas orientam a encenação.'],
  ['Teatral', 'médio', 'A diferença entre texto teatral e texto narrativo é:', ['O teatro é feito para ser encenado', 'O teatro tem rima obrigatória', 'O teatro não tem falas', 'O teatro não tem personagens'], 0, 'O texto teatral é escrito para representação no palco.']
];

const TEXTO_BANCO = [
  {
    titulo: 'O inventário das horas mortas',
    autor: 'Acervo',
    fonte: 'Conto',
    genero: 'Narrativo',
    nivel: 'difícil',
    orientacao: 'Leia o conto com atenção e responda às questões de 1 a 5. As perguntas exigem leitura atenta de conotações e ironias.',
    texto: `Minha mãe sempre disse que nasci com um defeito de fábrica: eu via as coisas grandes demais.
Para ela, o mundo cabia em uma gaveta bem arrumada. Para mim, a gaveta era um oceano onde tudo afundava e, ao mesmo tempo, boiava.
Herdamos juntas a casa dos avós, e ali comecei a fazer o inventário das horas mortas. Inventariar, para mim, não era somar os móveis; era anotar os silêncios: o piso que rangia às três da manhã, o cheiro de pó na claraboia que ninguém abria, os olhos da minha mãe quando ela fingia não ter pressa.
Quando a firma de avaliação enviou o perito para a partilha, ele não enxergava nada além de metros quadrados. Coçava a cabeça diante do meu caderno de capa azul, onde eu registrava, em letra miúda, o peso da sombra da bananeira sobre o tanque.
— Quanto vale esta bananeira, senhora?
— Depende — respondi. — Ela vale a conversa que eu tinha com a minha avó, todas as tardes, às cinco.
O perito ergueu as sobrancelhas, como quem anota uma despesa imprevista.
No laudo, a bananeira entrou como “arborização ornamental, valor depreciado”.
Minha mãe guardou o laudo na gaveta, com a certeza de quem organiza o mundo. Eu, porém, fiquei com a sombra, e descobri que a sombra é a única herança que não se divide.
Hoje, quando me perguntam o que sobrou da casa, digo que sobrou uma bananeira de valor depreciado. E graças a esse “defeito de fábrica”, ela ainda me dá frutos todas as tardes, às cinco.`,
    questoes: [
      ['difícil', 'No texto, a expressão “defeito de fábrica”, dita pela mãe da narradora, adquire sentido:', ['figurado e afetivo: indica uma percepção incomum da realidade', 'mecânico: indica um problema técnico de fabricação', 'matemático: indica um erro de medição do imóvel', 'jurídico: indica uma avaliação indevida da partilha'], 0, 'A expressão é irônica: o que a mãe considera um capricho é, para a narradora, a origem de seu modo singular e sensível de ver o mundo.'],
      ['médio', 'No conto, "fazer o inventário das horas mortas" equivale a:', ['registrar afetos, silêncios e lembranças sem preço', 'sombrar os móveis da casa herdada', 'organizar a documentação da partilha', 'pagar as dívidas da família'], 0, 'O "inventário" da narradora não é de bens materiais, e sim de memórias e sensações — por isso ela anota silêncios, cheiros e olhares.'],
      ['difícil', 'No laudo, a bananeira entra como "arborização ornamental, valor depreciado". Esse registro revela:', ['a impossibilidade de converter o valor afetivo em cifras', 'o rigor científico da avaliação dos avaliadores', 'o erro de cálculo do perito', 'o desprezo da mãe pela própria filha'], 0, 'Há ironia: para o perito a bananeira é decoração; para a narradora, é memória viva. O laudo só consegue medir o que perdeu o sentido.'],
      ['difícil', 'A frase final — "ela ainda me dá frutos todas as tardes, às cinco" — pode ser lida como:', ['metáfora da memória que continua viva e fértil', 'informação factual sobre a produção da bananeira', 'instrução de plantio', 'resposta técnica ao perito'], 0, 'Os "frutos" são as lembranças da avó; o horário remete à conversa diária. A metáfora encerra a herança afetiva que sobrevive à venda da casa.'],
      ['médio', 'Ao narrar o episódio em primeira pessoa, a narradora faz com que o leitor perceba:', ['a parcialidade afetiva de seu ponto de vista', 'a imparcialidade dos fatos', 'a objetividade técnica do laudo', 'a precisão cronológica dos acontecimentos'], 0, 'O narrador-personagem conta por um filtro emotivo: a mesma casa que o perito mede, ela sente. A perspectiva é deliberadamente subjetiva.']
    ]
  },
  {
    titulo: 'O conforto da desinformação',
    autor: 'Acervo',
    fonte: 'Ensaio',
    genero: 'Argumentativo',
    nivel: 'difícil',
    orientacao: 'Leia o ensaio e responda às questões de 6 a 10. Preste atenção à tese, ao repertório e às metáforas.',
    texto: `Heródoto conta que Xerxes ofereceu a um homem a escolha entre a verdade e a ignorância; o homem escolheu a ignorância, convencido de que ela o faria mais feliz. O que era anedota antiga virou fisiologia moderna: desligar-se das notícias tornou-se uma estratégia de sobrevivência afetiva, e não um sintoma de alienação.
Dizer “não quero saber” deixou de ser confissão de desinteresse para se erguer como direito reivindicado — um direito ao sossego. Com tal deslocamento, invertem-se os sinais que a tradição atribuía à informação: o excesso de conhecer passou a adoecer, e a ignorância, a curar.
O preço dessa terapêutica, contudo, é pago em moeda coletiva. Aquele que se afasta do debate público não desaparece do mundo; apenas abdica, por procuração, das decisões que depois o governam. Com a sutil diferença de que a procuração é concedida sem assinatura, e o que se assina em seu nome, às vezes, não é um documento, e sim o silêncio.
Os defensores da fadiga informativa têm razão num ponto: a celeuma midiática raramente distingue o fundamental do ruído. Mas a resposta competente a um ruído não é o silêncio; é a afinação. Esquecer como se afina é entregar o instrumento.
Talvez nos falte, menos informação, e mais discernimento. A virtude não está em saber tudo, nem em nada saber, mas em escolher o que merece ser conhecido. A ignorância que conforta é a mesma que cobra caro — e, ao contrário do que prometeu a Xerxes, a paz que ela oferece é do tamanho de uma fatura que nunca chegamos a abrir.`,
    questoes: [
      ['difícil', 'A tese defendida pelo ensaísta é:', ['o problema não é escolher não saber, mas abdicar do discernimento', 'a ignorância é um direito inalienável do cidadão', 'as notícias são prejudiciais à saúde coletiva', 'a mídia deve ser silenciada para garantir o sossego'], 0, 'O autor admite que desconectar-se pode ser legítimo, mas insiste na diferença entre "não saber" e "não exercer discernimento" — a virtude estaria em escolher o que merece ser conhecido.'],
      ['médio', 'A referência inicial a Heródoto e Xerxes tem a função de:', ['mostrar que o tema da ignorância deliberada já existia na Antiguidade', 'ensinar história antiga ao leitor', 'criticar o historiador Heródoto', 'atribuir a Xerxes a invenção dos noticiários'], 0, 'O repertório clássico é usado como ponto de partida: a "anedota antiga" antecipa um comportamento que hoje se tornou uma "fisiologia moderna".'],
      ['difícil', 'No trecho "Esquecer como se afina é entregar o instrumento", recorre-se a uma:', ['metáfora: o debate público é o instrumento que se entrega ao esquecê-lo', 'hipérbole: o autor exagera para chocar', 'eufemismo: suaviza uma crítica', 'pleonasmo: repete ideia desnecessária'], 0, 'A vida pública é comparada a um instrumento musical: quem esquece como "afinar" (discernir, criticar) entrega o instrumento (a cidadania) nas mãos de outros.'],
      ['difícil', 'A última frase — "a paz que ela oferece é do tamanho de uma fatura que nunca chegamos a abrir" — sugere que:', ['o custo da ignorância virá a ser cobrado, mesmo que não percebido', 'a paz proporcionada pela ignorância é gratuita e definitiva', 'a fatura relativa à desinformação é pequena', 'a ignorância gera dívidas estritamente financeiras'], 0, 'Há uma ironia: a ignorância vende calma, mas cobra em moeda coletiva — as decisões alheias que passam a nos governar.'],
      ['difícil', 'Na expressão "a procuração é concedida sem assinatura", o autor se refere:', ['à delegação silenciosa das escolhas coletivas a outros', 'a um contrato inválido perante a justiça', 'à obrigatoriedade do voto', 'à compra de votos por influenciadores'], 0, 'Quem se afasta do debate público não sai do mundo: passa a ser governado por decisões de outros, como se assinasse uma procuração sem consentimento formal.']
    ]
  },
  {
    titulo: 'Geografia do breu',
    autor: 'Acervo',
    fonte: 'Poema',
    genero: 'Lírico',
    nivel: 'difícil',
    orientacao: 'Leia o poema atentamente e responda às questões de 11 a 15. Atenção às figuras de linguagem e ao sentido conotativo.',
    texto: `Mapa impresso num bolso
que não guarda endereço:
a cidade que carrego
tem o nome que esqueço.

Lembro o beco, não a rua,
lembro a pedra, não o muro;
guardo a noite numa estrutura
de clarões pouco seguros.

Perdi a chave de casa,
mas encontrei outra cova:
toda espera que se alonga
vira um território à toa.

Breu não é não-ver;
é ver sem testemunha.
Quem não tem mapa nem luz
inventa um mapa de suor.`,
    questoes: [
      ['difícil', 'O eu lírico representa alguém que:', ['vive o estranhamento de não se reconhecer no próprio espaço', 'conhece perfeitamente a cidade em que mora', 'acaba de se mudar e comemora', 'trabalha como guia turístico'], 0, 'As contradições do poema (lembrar do beco e não da rua, da pedra e não do muro, ter "mapa impresso num bolso" que não guarda endereço) expressam desenraizamento e estranhamento.'],
      ['médio', 'Nos versos "Breu não é não-ver; / é ver sem testemunha", predomina o recurso do:', ['paradoxo', 'eufemismo', 'pleonasmo', 'onomatopeia'], 0, 'O poema afirma algo aparentemente contraditório (ver sem testemunha) e o apresenta como definição da escuridão — é o paradoxo.'],
      ['difícil', 'Em "toda espera que se alonga / vira um território à toa", a expressão "território à toa" significa:', ['um espaço esvaziado de sentido, uma espera inútil', 'um terreno baldio da cidade', 'um lugar muito distante', 'uma terra sem proprietário'], 0, 'A espera prolongada perde o propósito; por isso se torna um "território vazio" de significado, reforçando o desnorteamento do eu lírico.'],
      ['difícil', 'Na segunda estrofe, as oposições "beco/rua" e "pedra/muro" produzem um efeito de:', ['deslocamento que reforça o tema do desenraizamento', 'descrição precisa do urbanismo', 'progressão cronológica do passeio', 'encantamento pela arquitetura'], 0, 'O eu lírico lembra o que é parcial, áspero e desordenado (beco, pedra) e esquece o que organiza o espaço (rua, muro) — sinal de que sua relação com o lugar é fraturada.'],
      ['médio', 'O título "Geografia do breu" articula "geografia" (mapas e lugares) e "breu" (escuridão) para sugerir:', ['a tentativa de se orientar na ausência de referências', 'um atlas ilustrado de cidades', 'um passeio diurno pela cidade', 'uma classificação das capitais do mundo'], 0, 'O poema é um "mapa" que se constrói justamente onde não há luz: uma cartografia da desorientação, "inventada" pelo esforço ("mapa de suor").']
    ]
  },
  {
    titulo: 'A rua que se conta',
    autor: 'Acervo',
    fonte: 'Crônica',
    genero: 'Descritivo',
    nivel: 'difícil',
    orientacao: 'Leia a crônica com atenção e responda às questões de 16 a 20. Observe como a descrição mistura observação e julgamento.',
    texto: `Quem descreve uma rua, em geral, descreve prédios. Eu descrevo janelas, porque são as janelas que contam quem espreita a vida dos outros e quem se deixa espreitar.
No número 3, as venezianas ficam cerradas a partir das seis. É a casa de dona Aurora, que acende a luz da sala para ninguém ver e dorme com a televisão ligada, solitária como uma antena captando outras conversas. Sua rua interior, deduzo, tem o tamanho do quarto: um metro e meio de espera por dia.
No 9, o quintal transborda roupa no varal e vozes de criança até tarde. Ali a rua é extensa, cheia de idas e vindas, e qualquer descrição de fachada soaria mentirosa diante do cheiro de bolo que atravessa o concreto.
No 15, o muro alto é recoberto de cacos de vidro que, ao sol, parecem pedras preciosas; ninguém nota que a beleza é, na verdade, uma sentença — o caco é o avesso do convite.
E no fim da rua, o bar do Seu Zé, onde a calçada vira varanda e a varanda vira tribunal de opiniões. O bar é o único ponto em que essa rua, tão partida em fachadas, se costura.
Se me perguntam o que é minha rua, respondo com a síntese dos desencontros: uma quadra onde cada casa é um horizonte e o único horizonte comum é aquele que se conversa. Descrever rua é, no fundo, descrever o engenho com que cada um se arranja para não estar só.`,
    questoes: [
      ['difícil', 'A descrição da rua é predominantemente:', ['subjetiva, construída por impressões e deduções do narrador', 'técnica e isométrica', 'estatística e documental', 'jurídica e notarial'], 0, 'O narrador não descreve fachadas, mas deduções sobre a vida das casas ("solitária como uma antena", "deduzo"), o que marca a subjetividade da crônica.'],
      ['difícil', 'Ao comparar "cacos de vidro" a "pedras preciosas" e chamá-los de "o avesso do convite", o narrador:', ['critica ironicamente a aparência que esconde a hostilidade', 'elogia o capricho dos moradores', 'sugere a instalação de câmeras de segurança', 'descreve a mineração do bairro'], 0, 'A ironia está em ver beleza onde há violência contida: o que se enfeita com luz ("pedras preciosas") é na verdade uma defesa ("avesso do convite").'],
      ['médio', 'Na expressão "a varanda vira tribunal de opiniões", a palavra "tribunal" é empregada em sentido:', ['metafórico, para indicar um espaço de julgamento e conversa', 'denotativo, designando o fórum do bairro', 'histórico, referindo-se ao período colonial', 'jurídico, indicando um processo judicial'], 0, '"Tribunal" é metáfora do bate-papo da calçada, onde as opiniões do bairro são "julgadas" e "costuradas".'],
      ['médio', 'No trecho "uma quadra onde cada casa é um horizonte e o único horizonte comum é aquele que se conversa", o narrador revela:', ['a valorização da troca que acontece no espaço comum', 'total indiferença pelos vizinhos', 'desprezo pela convivência', 'temor do julgamento alheio'], 0, 'Apesar da descrição de isolamento, o narrador conclui que o que une a rua é a conversa no bar — o "horizonte comum".'],
      ['difícil', 'As casas apresentadas (nº 3, nº 9, nº 15) e o bar, no fim da rua, organizam a crônica como uma:', ['gradação que conduz da casa isolada ao espaço de encontro', 'ordem cronológica dos fatos', 'enumeração de endereços em ordem alfabética', 'sucessão aleatória de lugares'], 0, 'O narrador parte da solidão contida (nº 3) para a vida em excesso (nº 9), depois a defesa (nº 15) e encerra no bar, único lugar de encontro — construção em gradação.']
    ]
  },
  {
    titulo: 'O tribunal do corredor',
    autor: 'Acervo',
    fonte: 'Cena teatral',
    genero: 'Teatral',
    nivel: 'difícil',
    orientacao: 'Leia a cena e responda às questões de 21 a 25. Repare nas rubricas e no que as falas deixam entrelinhas.',
    texto: `CENA ÚNICA — Corredor de um hospital. Manhã. As luzes são frias.
(ANTÔNIA, com um copo de café que não bebe, sentada. LUIZ chega com o jaleco, para em frente a ela e consulta uma prancheta.)
LUIZ — (sem erguer os olhos) As visitas não podem permanecer mais de duas horas.
ANTÔNIA — (amassando o copo) Eu sei quanto vale uma hora.
LUIZ — Os horários estão no painel.
ANTÔNIA — O painel não me disse o nome do menino da cama sete.
LUIZ — (erguendo os olhos, enfim) Isso é prontuário.
ANTÔNIA — E isto é silêncio, doutor. Também guardo prontuário.
LUIZ — (pausa) Como se chama a senhora?
ANTÔNIA — Chamo-me como a senhora que espera. É só ciência.
(Silêncio. Luiz olha o café que Antônia não bebe.)
LUIZ — O senhor da cama sete é meu paciente.
ANTÔNIA — E o senhor da cama sete é meu marido.
(As luzes baixam como quem não quer testemunhar. Antônia continua sentada, o café esfriando.)
FIM`,
    questoes: [
      ['médio', 'As indicações entre parênteses, como "(sem erguer os olhos)" e "(amassando o copo)", são rubricas cuja função é:', ['orientar gestos, tom e ambientação para a encenação', 'resumir o enredo da peça', 'listar os integrantes do elenco', 'indicar o intervalo da apresentação'], 0, 'Rubricas são didascálias: orientam a atuação, o ritmo e o ambiente da cena no palco.'],
      ['difícil', 'Ao afirmar "Eu sei quanto vale uma hora", Antônia comunica, pelo subtexto:', ['o receio de ver esgotar o tempo que restaria ao marido', 'a insatisfação com o preço do café', 'um elogio aos horários do hospital', 'a indiferença em relação à espera'], 0, 'O que a personagem diz de fato é que conhece o valor do tempo diante da morte do marido — a fala tem carga emocional oculta.'],
      ['difícil', 'A tensão entre LUIZ e ANTÔNIA nasce principalmente:', ['do choque entre dois modos de lidar com a dor: a norma institucional e o afeto', 'de uma divergência política', 'de uma dívida financeira', 'do desacordo sobre o nome do paciente'], 0, 'Luiz representa a ciência e o regulamento; Antônia, o vínculo afetivo. O embate é entre a prancheta e a memória, a regra e a vida.'],
      ['difícil', 'Quando Antônia responde "Também guardo prontuário", ela:', ['ironiza os registros hospitalares e afirma a história íntima como igualmente válida', 'concorda em entregar exames ao médico', 'solicita uma cópia do documento', 'elogia a organização do arquivo'], 0, 'Se o "prontuário" de Luiz é ficha técnica, o de Antônia é a memória afetiva: ela disputa qual "documento" tem o direito de dizer quem é aquele homem.'],
      ['médio', 'No desfecho, a luz que baixa "como quem não quer testemunhar" e o café que "esfria" funcionam como símbolos:', ['da espera que se alonga e do desfecho incerto', 'de retomada da rotina do hospital', 'de uma crítica ao sistema de iluminação', 'do início de uma nova consulta'], 0, 'Os elementos cênicos reforçam o tema: a escuridão se esquiva do sofrimento e o café esfriado sinaliza a passagem do tempo sem notícias.']
    ]
  }
];

const BANCO_ORIGINAL_COUNT = QUESTAO_BANCO.length;

async function run() {
  const userId = ensureUser();

  db.prepare('DELETE FROM perguntas').run();
  db.prepare('DELETE FROM redacoes').run();
  db.prepare('DELETE FROM grupo_alunos').run();
  db.prepare('DELETE FROM grupos').run();
  db.prepare('DELETE FROM atividades').run();
  db.prepare('DELETE FROM alunos').run();
  db.prepare('DELETE FROM turmas').run();
  db.prepare('DELETE FROM textos').run();

  const info = db.prepare('INSERT INTO turmas (user_id, nome, serie, turno, genero_foco) VALUES (?, ?, ?, ?, ?)')
    .run(userId, '9º Ano A', '9º ano EF', 'Manhã', 'Narrativo');
  const turmaId = Number(info.lastInsertRowid);

  const nomes = [
    'Ana Beatriz Souza', 'Bruno Carvalho Lima', 'Camila Ferreira', 'Daniel Oliveira',
    'Eduarda Martins', 'Felipe Santana', 'Gabriela Rocha', 'Heitor Almeida',
    'Isabela Prado', 'João Pedro Ramos', 'Larissa Nunes', 'Marcos Vinícius Teixeira'
  ];
  const alunos = [];
  for (const nome of nomes) {
    const a = db.prepare('INSERT INTO alunos (turma_id, nome) VALUES (?, ?)').run(turmaId, nome);
    alunos.push(Number(a.lastInsertRowid));
  }

  const atvInfo = db.prepare(`
    INSERT INTO atividades (turma_id, titulo, descricao, genero_textual, tipo, tema, data_prevista)
    VALUES (?, ?, ?, ?, 'individual', ?, ?)
  `).run(turmaId, 'Crônica: meu bairro', 'Escrever uma crônica narrando uma situação do dia a dia do bairro.', 'Narrativo', 'O bairro onde moro', '');
  const atvId = Number(atvInfo.lastInsertRowid);

  const textoExemplo = `No meu bairro, todas as manha cedo a padaria ja esta cheia de gente apressada. Tem o seu Juca, que todo dia toma cafe e conversa sobre futebol. Eu acho muito legal essa rotina. Alem disso, as ruas sao limpas graças ao pessoal da faxina. Porem, tem um problema grande: o semafaro da avenida fica quebrado quase toda semana. Isso acaba atrapalhando muita coisa. As pessoas precisam ter mais cuidado. A prefeitura deveria fazer uma revisao no semafaro. Porque um semafaro quebrado causa acidentes de transito.`

  const resultado = await analisarRedacao(textoExemplo, { genero: 'Narrativo' });

  const r = db.prepare(`
    INSERT INTO redacoes (user_id, turma_id, atividade_id, aluno_id, titulo, status, nota_final, texto, resultado)
    VALUES (?, ?, ?, ?, ?, 'corrigida', ?, ?, ?)
  `).run(userId, turmaId, atvId, alunos[0], 'Crônica: meu bairro', resultado.nota ?? null, textoExemplo, JSON.stringify(resultado));

  const qInsert = db.prepare(`
    INSERT INTO perguntas (user_id, genero, origem, nivel, enunciado, alternativas, correta, explicacao)
    VALUES (?, ?, 'banco', ?, ?, ?, ?, ?)
  `);
  for (const [genero, nivel, enunciado, alternativas, correta, explicacao] of QUESTAO_BANCO) {
    qInsert.run(userId, genero, nivel, enunciado, JSON.stringify(alternativas), String(correta), explicacao);
  }

  const tInsert = db.prepare(`
    INSERT INTO textos (user_id, titulo, autor, fonte, genero, nivel, orientacao, texto)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const qTInsert = db.prepare(`
    INSERT INTO perguntas (user_id, texto_id, genero, origem, nivel, enunciado, alternativas, correta, explicacao)
    VALUES (?, ?, ?, 'banco', ?, ?, ?, ?, ?)
  `);
  let qtdQuestoesTextos = 0;
  for (const t of TEXTO_BANCO) {
    const ti = tInsert.run(userId, t.titulo, t.autor, t.fonte, t.genero, t.nivel, t.orientacao, t.texto);
    const textoId = Number(ti.lastInsertRowid);
    for (const [nivel, enunciado, alternativas, correta, explicacao] of t.questoes) {
      qTInsert.run(userId, textoId, t.genero, nivel, enunciado, JSON.stringify(alternativas), String(correta), explicacao);
      qtdQuestoesTextos++;
    }
  }

  console.log('✅ Seed concluído!');
  console.log(`   Professor: ${EMAIL} / ${SENHA}`);
  console.log(`   Turma "9º Ano A" com ${alunos.length} alunos, 1 atividade individual.`);
  console.log(`   Exemplo de redação na turma.`);
  console.log(`   Banco com ${BANCO_ORIGINAL_COUNT} questões de interpretação por gênero.`);
  console.log(`   Acervo com ${TEXTO_BANCO.length} textos complexos de interpretação (${qtdQuestoesTextos} questões autorais).`);
}

run().catch((e) => {
  console.error('❌ Erro no seed:', e.message);
  process.exit(1);
});