import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { GENEROS_TEXTUAIS, SERIES, TURNOS } from '../constants.js';

export default function Turmas() {
  const [turmas, setTurmas] = useState([]);
  const [erro, setErro] = useState('');
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({ nome: '', serie: '', turno: '', genero_foco: '' });

  async function carregar() {
    try {
      const d = await api.get('/turmas');
      setTurmas(d.turmas);
    } catch (e) {
      setErro(e.message);
    }
  }

  useEffect(() => { carregar(); }, []);

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      await api.post('/turmas', form);
      setForm({ nome: '', serie: '', turno: '', genero_foco: '' });
      setAberto(false);
      await carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  async function excluir(id) {
    if (!confirm('Excluir esta turma e todos os dados dela?')) return;
    try {
      await api.del(`/turmas/${id}`);
      await carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <h1>Turmas</h1>
          <p>Gerencie turmas, cadastre alunos e organize as atividades.</p>
        </div>
        <button className="btn" onClick={() => setAberto(!aberto)}>
          {aberto ? 'Cancelar' : '+ Nova turma'}
        </button>
      </div>

      {erro && <div className="error-banner">{erro}</div>}

      {aberto && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3>Nova turma</h3>
          <form onSubmit={salvar} className="grid-2" style={{ gap: 14 }}>
            <div>
              <label>Nome da turma *</label>
              <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: 9º Ano A" required />
            </div>
            <div>
              <label>Série</label>
              <select value={form.serie} onChange={(e) => setForm({ ...form, serie: e.target.value })}>
                <option value="">Selecione…</option>
                {SERIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label>Turno</label>
              <select value={form.turno} onChange={(e) => setForm({ ...form, turno: e.target.value })}>
                <option value="">Selecione…</option>
                {TURNOS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label>Gênero textual em foco</label>
              <select value={form.genero_foco} onChange={(e) => setForm({ ...form, genero_foco: e.target.value })}>
                <option value="">Nenhum específico</option>
                {GENEROS_TEXTUAIS.map((g) => <option key={g.chave} value={g.chave}>{g.chave}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button className="btn" disabled={!form.nome.trim()}>Criar turma</button>
            </div>
          </form>
        </div>
      )}

      {turmas.length === 0 && !aberto && (
        <div className="card empty">
          <div className="big">🏫</div>
          <p>Nenhuma turma cadastrada ainda.</p>
        </div>
      )}

      <div className="grid">
        {turmas.map((t) => (
          <div className="turma" key={t.id}>
            <Link to={`/turmas/${t.id}`}>
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
            <div className="flex" style={{ marginTop: 12, gap: 8 }}>
              <Link to={`/turmas/${t.id}`} className="btn btn-ghost btn-sm">Abrir</Link>
              <button className="btn btn-danger btn-sm" onClick={() => excluir(t.id)}>Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}