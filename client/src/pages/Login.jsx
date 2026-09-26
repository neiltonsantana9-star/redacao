import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import InstallButton from '../components/InstallButton.jsx';

export default function Login() {
  const { login, error } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const okk = await login(email, senha);
    setBusy(false);
    if (okk) nav('/');
  }

  return (
    <div className="layout" style={{ alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 40 }}>✍️</div>
          <h1 style={{ margin: '6px 0 2px' }}>Corretor de Redações</h1>
          <p className="muted">Fotografe a redação, veja os erros e acertos na hora.</p>
        </div>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
          <div>
            <label>E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label>Senha</label>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
          </div>
          <button className="btn btn-block" disabled={busy}>
            {busy ? <span className="spinner" /> : 'Entrar'}
          </button>
        </form>
        <p className="muted" style={{ marginTop: 16, textAlign: 'center' }}>
          Não tem conta? <Link to="/register">Cadastre-se</Link>
        </p>
        <div style={{ textAlign: 'center', marginTop: 6 }}>
          <Link to="/baixar" className="btn btn-ghost btn-sm">📲 Baixar / instalar o app</Link>
        </div>
        <InstallButton />
        <div className="info-banner" style={{ marginTop: 14, marginBottom: 0, fontSize: '0.82rem' }}>
          <strong>Conta demo</strong> (depois de rodar <code>npm run seed</code>) — basta clicar para preencher:
          <div className="flex" style={{ marginTop: 8 }}>
            <button type="button" className="btn btn-sm btn-ghost"
              onClick={() => { setEmail('professor@escola.com'); setSenha('prof123'); }}>
              Preencher demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}