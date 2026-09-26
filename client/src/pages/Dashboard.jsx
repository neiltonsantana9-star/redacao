import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import InstallButton from '../components/InstallButton.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.get('/turmas')
      .then((d) => setData(d))
      .catch((e) => setErro(e.message));
  }, []);

  if (erro) return <div className="container page"><div className="error-banner">{erro}</div></div>;
  if (!data) return <div className="container page"><div className="spinner spinner-dark" /></div>;

  const turmas = data.turmas || [];
  const qtdAlunos = turmas.reduce((a, t) => a + (t.qtd_alunos || 0), 0);
  const qtdAtv = turmas.reduce((a, t) => a + (t.qtd_atividades || 0), 0);

  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <h1>Olá, {user?.name?.split(' ')[0]} 👋</h1>
          <p>Acompanhe suas turmas, atividades e correções de redação.</p>
        </div>
        <div className="flex" style={{ gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <InstallButton compact />
        <Link to="/turmas" className="btn">Ver turmas</Link>
      </div>
      </div>

      <div className="stat-grid">
        <div className="stat"><div className="v">{turmas.length}</div><div className="l">Turmas</div></div>
        <div className="stat"><div className="v">{qtdAlunos}</div><div className="l">Alunos</div></div>
        <div className="stat"><div className="v">{qtdAtv}</div><div className="l">Atividades</div></div>
      </div>

      <div className="info-banner">
        📸 <strong>Como corrigir:</strong> abra uma turma → crie ou escolha uma atividade → <em>Corrigir redação</em> →
        fotografe a folha (ou envie uma imagem / digite o texto). O sistema identifica <strong>erros ortográficos</strong>,
        problemas de <strong>coesão</strong> e de <strong>semântica</strong>, e mostra o que está bom na redação.
      </div>

      <div className="info-banner">
        🧠 <strong>Novo — interpretação textual:</strong> na tela de correção de cada redação, use
        <em> Gerar questões</em> para criar questões de interpretação sobre o texto do aluno, ou monte o seu próprio
        <Link to="/questoes"> banco de questões por gênero</Link>. Depois é só <strong>imprimir</strong> (ou salvar em PDF)
        para os alunos responderem no papel.
      </div>

      <h2 style={{ fontSize: '1.1rem' }}>Suas turmas</h2>
      {turmas.length === 0 && (
        <div className="card empty">
          <div className="big">🏫</div>
          <p>Você ainda não tem turmas. <Link to="/turmas">Crie a primeira agora</Link>.</p>
        </div>
      )}
      <div className="grid">
        {turmas.map((t) => (
          <Link to={`/turmas/${t.id}`} className="turma card-link" key={t.id}>
            <div className="flex-between">
              <h3>🏫 {t.nome}</h3>
              <span className="tag">{t.serie || '—'}</span>
            </div>
            <p className="muted" style={{ margin: '2px 0 10px' }}>
              {t.turno || 'Turno não informado'} · foco em {t.genero_foco || 'gêneros textuais'}
            </p>
            <div className="flex" style={{ gap: 16 }}>
              <span className="muted"><strong>{t.qtd_alunos}</strong> alunos</span>
              <span className="muted"><strong>{t.qtd_atividades}</strong> atividades</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}