import { useEffect, useState } from 'react';

export default function InstallButton({ compact = false }) {
  const [deferred, setDeferred] = useState(null);
  const [instalado, setInstalado] = useState(false);
  const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (standalone) { setInstalado(true); return; }
    const onBefore = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => { setInstalado(true); setDeferred(null); };
    window.addEventListener('beforeinstallprompt', onBefore);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBefore);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function instalar() {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch { /* usuário cancelou */ }
    setDeferred(null);
  }

  if (instalado) return null;

  if (iOS) {
    return (
      <div className="info-banner" style={{ marginTop: 12, marginBottom: 0, fontSize: '0.82rem' }}>
        📱 <strong>Instalar no iPhone/iPad:</strong> toque no <strong>Compartilhar</strong> (ícone ↑ no navegador) →
        <strong> Adicionar à Tela de Início</strong>.
      </div>
    );
  }

  if (!('serviceWorker' in navigator)) return null;

  if (deferred) {
    return (
      <div style={{ marginTop: 12 }}>
        <button type="button" className={compact ? 'btn btn-sm' : 'btn btn-block'} onClick={instalar}>
          📲 Baixar / Instalar o app
        </button>
      </div>
    );
  }

  return (
    <p className="muted" style={{ fontSize: '0.8rem', margin: '12px 0 0' }}>
      📲 Para instalar no aparelho, use o menu do navegador → <strong>Instalar aplicativo</strong>.
    </p>
  );
}