import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register, error } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const okk = await register(form.name, form.email, form.password);
    setBusy(false);
    if (okk) nav('/');
  }

  return (
    <div className="layout" style={{ alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 40 }}>🧑‍🏫</div>
          <h1 style={{ margin: '6px 0 2px' }}>Criar conta de professor(a)</h1>
          <p className="muted">Gerencie turmas, atividades e correções.</p>
        </div>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
          <div>
            <label>Nome</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label>E-mail</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label>Senha (mín. 6 caracteres)</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button className="btn btn-block" disabled={busy}>
            {busy ? <span className="spinner" /> : 'Cadastrar'}
          </button>
        </form>
        <p className="muted" style={{ marginTop: 16, textAlign: 'center' }}>
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}