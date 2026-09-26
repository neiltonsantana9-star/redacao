export const GENEROS_TEXTUAIS = [
  { chave: 'Narrativo', descricao: 'Conta uma história com personagens, tempo e espaço (conto, crônica, fábula, romance).' },
  { chave: 'Argumentativo', descricao: 'Defende um ponto de vista com argumentos (dissertação, editorial, carta argumentativa, artigo de opinião).' },
  { chave: 'Descritivo', descricao: 'Descreve pessoas, lugares ou objetos com riqueza de detalhes.' },
  { chave: 'Expositivo', descricao: 'Apresenta informações e explicações sobre um tema (verbete, reportagem, texto didático).' },
  { chave: 'Injuntivo', descricao: 'Orienta a fazer algo (receita, manual de instruções, regimento, regulamento).' },
  { chave: 'Lírico', descricao: 'Texto poético expressivo (poema, letra de música).' },
  { chave: 'Teatral', descricao: 'Escrito para ser encenado, com rubricas e diálogos (peça, roteiro).' }
];

export const TURNOS = ['Manhã', 'Tarde', 'Noite'];

export const NIVEIS_QUESTAO = ['fácil', 'médio', 'difícil'];

export const QUANTIDADE_QUESTOES = [3, 4, 5, 6, 8, 10];

export const SERIES = [
  '6º ano EF', '7º ano EF', '8º ano EF', '9º ano EF',
  '1º ano EM', '2º ano EM', '3º ano EM', 'EJA', 'Ensino Superior'
];

export const ERRO_CATEGORIAS = [
  { id: 'ortografia', nome: 'Ortografia', cor: '#ef4444', bg: 'rgba(239,68,68,0.15)', borda: 'rgba(239,68,68,0.5)' },
  { id: 'coesao', nome: 'Coesão', cor: '#f59e0b', bg: 'rgba(245,158,11,0.15)', borda: 'rgba(245,158,11,0.5)' },
  { id: 'semantica', nome: 'Semântica', cor: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', borda: 'rgba(139,92,246,0.5)' },
  { id: 'positivo', nome: 'Ponto forte', cor: '#22c55e', bg: 'rgba(34,197,94,0.12)', borda: 'rgba(34,197,94,0.45)' }
];

export const EXEMPLO_TEXTO = `No meu bairro, todas as manha cedo a padaria ja esta cheia de gente apressada. Tem o seu Juca, que todo dia toma cafe e conversa sobre futebol. Eu acho muito legal essa rotina. Alem disso, as ruas sao limpas graças ao pessoal da faxina. Porem, tem um problema grande: o semafaro da avenida fica quebrado quase toda semana. Isso acaba atrapalhando muita coisa. As pessoas precisam ter mais cuidado. A prefeitura deveria fazer uma revisao no semafaro. Porque um semafaro quebrado causa acidentes de transito.`;