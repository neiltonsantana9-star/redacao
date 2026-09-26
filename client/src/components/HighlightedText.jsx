import { useMemo, useState } from 'react';
import { ERRO_CATEGORIAS } from '../constants.js';

const catClasse = {
  ortografia: 'mark-ortografia',
  coesao: 'mark-coesao',
  semantica: 'mark-semantica',
  positivo: 'mark-positivo'
};

export function categoriaInfo(id) {
  return ERRO_CATEGORIAS.find((c) => c.id === id) || ERRO_CATEGORIAS[0];
}

export default function HighlightedText({ texto, ortografia = [], coesao = [], semantica = [], positivos = [] }) {
  const [tip, setTip] = useState(null);

  const marks = useMemo(() => {
    const list = [
      ...ortografia.map((m) => ({ ...m, categoria: 'ortografia', nome: m.categoria || 'Ortografia' })),
      ...coesao.map((m) => ({ ...m, categoria: 'coesao', nome: m.categoria || 'Coesão' })),
      ...semantica.map((m) => ({ ...m, categoria: 'semantica', nome: m.categoria || 'Semântica' }))
    ].filter((m) => Number.isFinite(m.start) && Number.isFinite(m.end) && m.end > m.start);
    list.sort((a, b) => a.start - b.start || b.end - a.end);
    return list;
  }, [ortografia, coesao, semantica]);

  const segments = useMemo(() => {
    const segs = [];
    let p = 0;
    const usados = new Set();
    for (const m of marks) {
      if (m.start < p) continue;
      if (segs.length) {
        const prev = segs[segs.length - 1];
        if (prev.mark && m.start < prev.mark.end) continue;
      }
      segs.push({ text: texto.slice(p, m.start) });
      segs.push({ text: texto.slice(m.start, m.end), mark: m });
      usados.add(m.start + '|' + m.end);
      p = m.end;
    }
    if (p < texto.length) segs.push({ text: texto.slice(p) });
    return segs;
  }, [texto, marks]);

  function mostrarTip(m, e) {
    if (!m) return setTip(null);
    const rect = e.target.getBoundingClientRect();
    setTip({ m, x: rect.left, y: rect.bottom + 6 });
  }

  return (
    <div>
      <div className="legend">
        {ERRO_CATEGORIAS.slice(0, 3).map((c) => (
          <span key={c.id}><i style={{ background: c.cor }} /> {c.nome}</span>
        ))}
        <span className="muted">— clique em um trecho destacado para ver a sugestão</span>
      </div>
      <div className="redacao-paper" style={{ position: 'relative' }}>
        {segments.map((s, i) =>
          s.mark ? (
            <span
              key={i}
              className={catClasse[s.mark.categoria] || 'mark-ortografia'}
              onMouseEnter={(e) => mostrarTip(s.mark, e)}
              onMouseLeave={() => setTip(null)}
              onClick={(e) => mostrarTip(s.mark, e)}
            >
              {s.text}
            </span>
          ) : (
            <span key={i}>{s.text}</span>
          )
        )}
        {positivos.length > 0 && (
          <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px dashed #cde6d2' }}>
            <strong style={{ color: '#15803d', fontSize: '0.9rem' }}>✅ Acertos da produção</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: '#166534', fontSize: '0.92rem' }}>
              {positivos.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        )}
      </div>

      {tip && (
        <div className="tooltip" style={{ left: Math.min(tip.x, window.innerWidth - 360), top: tip.y }}>
          <div className="tt-title">
            <span style={{ width: 10, height: 10, borderRadius: 3, background: categoriaInfo(tip.m.categoria).cor, display: 'inline-block' }} />
            {tip.m.nome}
          </div>
          <div>{tip.m.message || 'Sugestão de correção.'}</div>
          {tip.m.replacements?.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <em>sugestões: </em>
              {tip.m.replacements.map((r, i) => <span key={i} style={{ background: 'rgba(255,255,255,0.14)', padding: '1px 6px', borderRadius: 4, marginRight: 4 }}>{r}</span>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}