const BASE = '/api';

async function req(method, url, body) {
  const opts = {
    method,
    credentials: 'include',
    headers: {}
  };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(BASE + url, opts);
  let data = {};
  try {
    data = await res.json();
  } catch {
    /* corpo vazio */
  }
  if (!res.ok) {
    throw new Error(data.message || `Erro ${res.status}`);
  }
  return data;
}

export const api = {
  get: (url) => req('GET', url),
  post: (url, body) => req('POST', url, body),
  put: (url, body) => req('PUT', url, body),
  del: (url) => req('DELETE', url)
};

export async function baixarArquivo(url, nome) {
  const res = await fetch(BASE + url, { credentials: 'include' });
  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const d = await res.json();
      msg = d.message || msg;
    } catch { /* corpo não é json */ }
    throw new Error(msg);
  }
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nome || 'arquivo.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

export function notaCor(nota) {
  if (nota === null || nota === undefined) return '#7c7c96';
  if (nota >= 8) return '#22c55e';
  if (nota >= 6) return '#eab308';
  if (nota >= 4) return '#f97316';
  return '#ef4444';
}