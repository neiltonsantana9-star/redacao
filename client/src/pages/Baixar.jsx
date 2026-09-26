import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import InstallButton from '../components/InstallButton.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Baixar() {
  const { user } = useAuth();
  const [url, setUrl] = useState('');

  useEffect(() => {
    setUrl(window.location.origin);
  }, []);

  const qr = url ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(url)}` : '';
  const pwabuilder = `https://www.pwabuilder.com/createPWA?siteUrl=${encodeURIComponent(url)}`;

  return (
    <div className="layout" style={{ alignItems: 'center', justifyContent: 'flex-start', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 640 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 40 }}>📲</div>
          <h1 style={{ margin: '6px 0 2px' }}>Baixar / Instalar o Redações</h1>
          <p className="muted">O aplicativo funciona no celular, no tablet e no computador — com ou sem instalação.</p>
        </div>

        <div className="card">
          <h3>1 · Instalar no celular ou tablet (Android/iOS)</h3>
          <p className="muted" style={{ fontSize: '0.88rem' }}>
            O app é um <strong>PWA</strong>: a instalação é gratuita e ocupa pouco espaço.
            Depois de instalar, ele abre em tela cheia, como um aplicativo nativo — até sem internet para a parte de consulta.
          </p>
          <InstallButton />
          <p className="muted" style={{ fontSize: '0.82rem', margin: '12px 0 0' }}>
            <strong>Android/Chrome:</strong> toque no ⋮ (menu) → <em>Instalar aplicativo</em>.
            <br />
            <strong>iPhone/iPad (Safari):</strong> toque em <em>Compartilhar</em> → <em>Adicionar à Tela de Início</em>.
          </p>
        </div>

        <div className="card">
          <h3>2 · Baixar o APK para Android</h3>
          <p className="muted" style={{ fontSize: '0.88rem' }}>
            Quer um <strong>arquivo de instalação (.apk)</strong> para mandar para qualquer celular Android?
            Use o gerador gratuito <strong>PWABuilder</strong> — ele empacota este aplicativo em um APK pronto para instalar.
          </p>
          <a className="btn" href={pwabuilder} target="_blank" rel="noreferrer">⬇️ Gerar e baixar o APK (PWABuilder)</a>
          <ol className="muted" style={{ fontSize: '0.85rem', marginTop: 12, paddingLeft: 22 }}>
            <li>Clique no botão acima — o PWABuilder abre com o endereço deste app já preenchido.</li>
            <li>Clique em <strong>Start</strong> → <strong>Next</strong> (a página vai analisar o app).</li>
            <li>Em <strong>Package for stores</strong>, escolha <strong>Android</strong> → <strong>Generate package</strong>.</li>
            <li>Ao final, clique em <strong>Download</strong> para baixar o .apk e instale no celular.</li>
          </ol>
        </div>

        <div className="card">
          <h3>3 · Baixar PDFs (provas, questões e correções)</h3>
          <p className="muted" style={{ fontSize: '0.88rem' }}>
            Dentro do painel, cada <strong>prova, questão, texto de interpretação e correção de redação</strong> tem o
            botão <strong>⬇️ Baixar PDF</strong> — gera um arquivo .pdf pronto para imprimir ou compartilhar
            (o gabarito sai no final, só para o professor).
          </p>
          {user ? (
            <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
              <Link className="btn" to="/textos">Ir para Textos de interpretação</Link>
              <Link className="btn btn-ghost" to="/questoes">Ir para Banco de questões</Link>
            </div>
          ) : (
            <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
              <Link className="btn" to="/login">Entrar no painel</Link>
              <Link className="btn btn-ghost" to="/register">Criar conta</Link>
            </div>
          )}
        </div>

        {qr && (
          <div className="card" style={{ textAlign: 'center' }}>
            <h3>Acesse em outro aparelho</h3>
            <p className="muted" style={{ fontSize: '0.85rem' }}>Abra a câmera do celular e aponte para o QR code:</p>
            <img src={qr} alt="QR code do aplicativo" width={220} height={220} style={{ borderRadius: 10 }} />
            <p className="muted" style={{ fontSize: '0.82rem', wordBreak: 'break-all' }}>{url}</p>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: 18 }}>
          {user ? <Link to="/">← Voltar ao painel</Link> : <Link to="/login">← Voltar ao login</Link>}
        </p>
      </div>
    </div>
  );
}