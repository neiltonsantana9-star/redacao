import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, notaCor } from '../api.js';
import { GENEROS_TEXTUAIS } from '../constants.js';

export default function TurmaDetalhe() {
  const { id } = useParams();
  const [turma, setTurma] = useState(null);
  const [redacoes, setRedacoes] = useState([]);
  const [erro, setErro] = useState('');
  const [tab, setTab] = useState('alunos');

  async function carregar() {
    const [t, r] = await Promise.all([
      api.get(`/turmas/${id}`).then((d) => d.turma),
      api.get(`/redacoes/turma/${id}`).then((d) => d.redacoes)
    ]);
    setTurma(t);
    setRedacoes(r);
  }

  useEffect(() => {
    carregar().catch((e) => setErro(e.message));
  }, [id]);

  if (erro) return <div className="container page"><div className="error-banner">{erro}</div></div>;
  if (!turma) return <div className="container page"><div className="spinner spinner-dark" /></div>;

  const genero = GENEROS_TEXTUAIS.find((g) => g.chave === turma.genero_foco);

  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <div className="flex" style={{ gap: 8 }}>
            <Link to="/turmas" className="muted">← Turmas</Link>
            <span className="muted">/</span>
          </div>
          <h1>🏫 {turma.nome}</h1>
          <p>
            {turma.serie || 'Série não informada'} · {turma.turno || 'Turno não informado'}
            {genero ? ` · Foco: ${turma.genero_foco} — ${genero.descricao}` : ''}
          </p>
        </div>
        <div className="flex">
          <Link to={`/turmas/${id}/atividades/nova`} className="btn btn-ghost">+ Atividade</Link>
          <Link to={`/turmas/${id}/corrigir`} className="btn">📸 Corrigir redação</Link>
        </div>
      </div>

      <div className="flex" style={{ gap: 8, marginBottom: 22 }}>
        {[
          ['alunos', `Alunos (${turma.alunos.length})`],
          ['atividades', `Atividades (${turma.atividades.length})`],
          ['redacoes', `Redações (${redacoes.length})`]
        ].map(([k, nome]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`btn btn-sm ${tab === k ? '' : 'btn-ghost'}`}
          >
            {nome}
          </button>
        ))}
      </div>

      {tab === 'alunos' && <AlunosTab turma={turma} onChanged={carregar} />}
      {tab === 'atividades' && <AtividadesTab turma={turma} />}
      {tab === 'redacoes' && <RedacoesTab redacoes={redacoes} />}
    </div>
  );
}

function AlunosTab({ turma, onChanged }) {
  const [erro, setErro] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [imp, setImp] = useState(false);
  const [importa, setImporta] = useState('');
  const [editId, setEditId] = useState(null);
  const [editNome, setEditNome] = useState('');

  async function adicionar(e) {
    e.preventDefault();
    try {
      await api.post(`/turmas/${turma.id}/alunos`, { nome, email });
      setNome(''); setEmail('');
      await onChanged();
    } catch (err) { setErro(err.message); }
  }

  async function importar(e) {
    e.preventDefault();
    try {
      await api.post(`/turmas/${turma.id}/alunos/importar`, { texto: importa });
      setImporta(''); setImp(false);
      await onChanged();
    } catch (err) { setErro(err.message); }
  }

  async function salvarEdit(alunoId) {
    try {
      await api.put(`/turmas/${turma.id}/alunos/${alunoId}`, { nome: editNome });
      setEditId(null); setEditNome('');
      await onChanged();
    } catch (err) { setErro(err.message); }
  }

  async function excluir(alunoId) {
    if (!confirm('Excluir este aluno?')) return;
    try {
      await api.del(`/turmas/${turma.id}/alunos/${alunoId}`);
      await onChanged();
    } catch (err) { setErro(err.message); }
  }

  return (
    <div>
      {erro && <div className="error-banner">{erro}</div>}
      <div className="grid-2">
        <div className="card">
          <h3>Adicionar aluno</h3>
          <form onSubmit={adicionar} style={{ display: 'grid', gap: 12 }}>
            <div>
              <label>Nome completo</label>
              <input value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div>
              <label>E-mail (opcional)</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button className="btn" disabled={!nome.trim()}>Adicionar</button>
          </form>

          <div style={{ marginTop: 16 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setImp(!imp)}>
              Importar em massa (um nome por linha)
            </button>
            {imp && (
              <form onSubmit={importar} style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                <textarea rows={6} value={importa} onChange={(e) => setImporta(e.target.value)}
                  placeholder={'Maria Souza\nJoão Silva\nPedro Costa'} />
                <button className="btn" disabled={!importa.trim()}>Importar alunos</button>
              </form>
            )}
          </div>
        </div>

        <div className="card">
          <h3>Alunos ({turma.alunos.length})</h3>
          <table className="table">
            <thead>
              <tr><th>Nome</th><th style={{ width: 90 }}></th></tr>
            </thead>
            <tbody>
              {turma.alunos.map((a) => (
                <tr key={a.id}>
                  <td>
                    {editId === a.id ? (
                      <div className="flex">
                        <input value={editNome} onChange={(e) => setEditNome(e.target.value)} />
                        <button className="btn btn-sm" onClick={() => salvarEdit(a.id)}>Salvar</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>X</button>
                      </div>
                    ) : (
                      <span>{a.nome}</span>
                    )}
                  </td>
                  <td>
                    <div className="flex" style={{ gap: 6 }}>
                      <button className="btn btn-ghost btn-sm"
                        onClick={() => { setEditId(a.id); setEditNome(a.nome); }}>
                        ✏️
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => excluir(a.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {turma.alunos.length === 0 && (
                <tr><td colSpan={2} className="muted">Nenhum aluno ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AtividadesTab({ turma }) {
  return (
    <div>
      {turma.atividades.length === 0 && (
        <div className="card empty">
          <div className="big">📝</div>
          <p>Nenhuma atividade ainda. <Link to={`/turmas/${turma.id}/atividades/nova`}>Crie uma atividade</Link> para trabalhar um gênero textual.</p>
        </div>
      )}
      <div className="grid">
        {turma.atividades.map((a) => (
          <div className="atv" key={a.id}>
            <div className="flex-between">
              <h3>{a.titulo}</h3>
              <span className={`tag ${a.tipo === 'grupo' ? 'tag-warn' : ''}`}>
                {a.tipo === 'grupo' ? 'Em grupo' : 'Individual'}
              </span>
            </div>
            <p className="muted" style={{ margin: '2px 0 8px' }}>
              Gênero: <strong>{a.genero_textual}</strong>
              {a.tema ? ` · Tema: ${a.tema}` : ''}
            </p>
            <p className="muted" style={{ margin: '0 0 14px' }}>{a.descricao}</p>
            {a.tipo === 'grupo' && a.grupos?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <span className="muted" style={{ fontWeight: 700 }}>Grupos: </span>
                <div className="conect-list" style={{ marginTop: 6 }}>
                  {a.grupos.map((g) => (
                    <span className="conect-chip" key={g.id}>{g.nome} ({g.alunos.map((al) => al.nome.split(' ')[0]).join(', ')})</span>
                  ))}
                </div>
              </div>
            )}
            <Link to={`/turmas/${turma.id}/atividades/${a.id}`} className="btn btn-ghost btn-sm">Editar</Link>
            {' '}
            <Link to={`/turmas/${turma.id}/corrigir/${a.id}`} className="btn btn-sm">📸 Corrigir redações</Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function RedacoesTab({ redacoes }) {
  return (
    <div>
      {redacoes.length === 0 && (
        <div className="card empty">
          <div className="big">📄</div>
          <p>Nenhuma redação corrigida ainda. Use <em>Corrigir redação</em> para fotografar a produção dos alunos.</p>
        </div>
      )}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Aluno / Grupo</th>
              <th>Título</th>
              <th>Atividade</th>
              <th>Nota</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {redacoes.map((r) => {
              const quem = r.aluno ? r.aluno.nome : (r.grupo ? r.grupo.nome : '—');
              return (
                <tr key={r.id}>
                  <td><strong>{quem}</strong></td>
                  <td>{r.titulo || 'Sem título'}</td>
                  <td className="muted">{r.atividade_id ? 'Atividade' : 'Avulsa'}</td>
                  <td>
                    <span style={{ fontWeight: 800, color: notaCor(r.nota_final) }}>{r.nota_final ?? '—'}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link to={`/redacoes/${r.id}`} className="btn btn-sm">Ver correção</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}