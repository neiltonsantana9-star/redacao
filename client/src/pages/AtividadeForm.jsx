import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { GENEROS_TEXTUAIS } from '../constants.js';

export default function AtividadeForm() {
  const { id, atvId } = useParams();
  const editando = Boolean(atvId);
  const nav = useNavigate();

  const [turma, setTurma] = useState(null);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    genero_textual: '',
    tipo: 'individual',
    tema: '',
    data_prevista: ''
  });
  const [grupos, setGrupos] = useState([{ nome: 'Grupo 1', alunos: [] }]);

  useEffect(() => {
    api.get(`/turmas/${id}`)
      .then((d) => setTurma(d.turma))
      .catch((e) => setErro(e.message));
  }, [id]);

  useEffect(() => {
    if (!editando) return;
    api.get(`/atividades/${atvId}`)
      .then((d) => {
        const a = d.atividade;
        setForm({
          titulo: a.titulo,
          descricao: a.descricao,
          genero_textual: a.genero_textual,
          tipo: a.tipo,
          tema: a.tema,
          data_prevista: a.data_prevista || ''
        });
        if (a.grupos?.length) {
          setGrupos(a.grupos.map((g) => ({ nome: g.nome, alunos: g.alunos.map((al) => al.id) })));
        }
      })
      .catch((e) => setErro(e.message));
  }, [atvId, editando]);

  function toggleAluno(gIdx, alunoId) {
    setGrupos((gs) => gs.map((g, i) => {
      if (i !== gIdx) return g;
      const tem = g.alunos.includes(alunoId);
      return { ...g, alunos: tem ? g.alunos.filter((a) => a !== alunoId) : [...g.alunos, alunoId] };
    }));
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      const body = {
        ...form,
        grupos: form.tipo === 'grupo' ? grupos.filter((g) => g.nome.trim()) : undefined
      };
      if (editando) await api.put(`/atividades/${atvId}`, body);
      else await api.post(`/atividades/turma/${id}`, body);
      nav(`/turmas/${id}`);
    } catch (err) {
      setErro(err.message);
    }
  }

  if (erro && !turma) return <div className="container page"><div className="error-banner">{erro}</div></div>;
  if (!turma) return <div className="container page"><div className="spinner spinner-dark" /></div>;

  return (
    <div className="container page container-narrow">
      <div className="flex" style={{ gap: 8, marginBottom: 8 }}>
        <Link to={`/turmas/${id}`} className="muted">← {turma.nome}</Link>
      </div>
      <div className="page-head">
        <div>
          <h1>{editando ? 'Editar atividade' : 'Nova atividade'}</h1>
          <p>Atividades individuais ou em grupo sobre gêneros textuais.</p>
        </div>
      </div>

      {erro && <div className="error-banner">{erro}</div>}

      <form onSubmit={salvar} className="card" style={{ display: 'grid', gap: 14 }}>
        <div>
          <label>Título *</label>
          <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex.: Crônica: meu bairro" required />
        </div>
        <div className="grid-2" style={{ gap: 14 }}>
          <div>
            <label>Gênero textual *</label>
            <select value={form.genero_textual} onChange={(e) => setForm({ ...form, genero_textual: e.target.value })} required>
              <option value="">Selecione…</option>
              {GENEROS_TEXTUAIS.map((g) => <option key={g.chave} value={g.chave}>{g.chave}</option>)}
            </select>
          </div>
          <div>
            <label>Tipo *</label>
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              <option value="individual">Individual</option>
              <option value="grupo">Em grupo</option>
            </select>
          </div>
        </div>
        <div className="grid-2" style={{ gap: 14 }}>
          <div>
            <label>Tema da redação</label>
            <input value={form.tema} onChange={(e) => setForm({ ...form, tema: e.target.value })} placeholder="Ex.: O bairro onde moro" />
          </div>
          <div>
            <label>Data prevista</label>
            <input type="date" value={form.data_prevista} onChange={(e) => setForm({ ...form, data_prevista: e.target.value })} />
          </div>
        </div>
        <div>
          <label>Descrição / proposta</label>
          <textarea rows={3} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            placeholder="Orientações para os alunos…" />
        </div>

        {form.tipo === 'grupo' && (
          <div style={{ background: 'rgba(79,70,229,0.04)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
            <div className="flex-between" style={{ marginBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Formação de grupos</h3>
              <button type="button" className="btn btn-sm btn-ghost"
                onClick={() => setGrupos([...grupos, { nome: `Grupo ${grupos.length + 1}`, alunos: [] }])}>
                + Grupo
              </button>
            </div>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {grupos.map((g, gi) => (
                <div key={gi} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 12, background: '#fff' }}>
                  <div className="flex" style={{ marginBottom: 8 }}>
                    <input value={g.nome} onChange={(ev) => {
                      const gs = [...grupos]; gs[gi].nome = ev.target.value; setGrupos(gs);
                    }} style={{ fontWeight: 700 }} />
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => {
                      setGrupos(grupos.filter((_, i) => i !== gi));
                    }}>🗑️</button>
                  </div>
                  <div style={{ maxHeight: 180, overflowY: 'auto', display: 'grid', gap: 4 }}>
                    {turma.alunos.map((a) => (
                      <label key={a.id} className="flex" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input type="checkbox" style={{ width: 16, height: 16 }}
                          checked={g.alunos.includes(a.id)}
                          onChange={() => toggleAluno(gi, a.id)} />
                        {a.nome}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {turma.alunos.length === 0 && (
              <p className="muted">Cadastre alunos na aba <strong>Alunos</strong> da turma para montar os grupos.</p>
            )}
          </div>
        )}

        <div className="flex">
          <button className="btn">{editando ? 'Salvar alterações' : 'Criar atividade'}</button>
          <Link to={`/turmas/${id}`} className="btn btn-ghost">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}