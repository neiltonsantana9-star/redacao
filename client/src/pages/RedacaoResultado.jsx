import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, baixarArquivo, notaCor } from '../api.js';
import HighlightedText from '../components/HighlightedText.jsx';
import { QUANTIDADE_QUESTOES } from '../constants.js';

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];

function Nota({ nota, size = 64 }) {
  const cor = notaCor(nota);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg viewBox="0 0 36 36" width={size} height={size}>
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e7e9f5" strokeWidth="4" />
        <circle
          cx="18" cy="18" r="15.9" fill="none"
          stroke={cor} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={`${((nota ?? 0) / 10) * 100} 100`}
          transform="rotate(-90 18 18)"
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: size / 3.2, color: cor }}>
        {nota ?? '—'}
      </div>
    </div>
  );
}

export default function RedacaoResultado() {
  const { id } = useParams();
  const nav = useNavigate();
  const [r, setR] = useState(null);
  const [erro, setErro] = useState('');
  const [notaEdit, setNotaEdit] = useState('');
  const [editing, setEditing] = useState(false);
  const [questoes, setQuestoes] = useState([]);
  const [gerando, setGerando] = useState(false);
  const [qtd, setQtd] = useState(5);

  async function carregar() {
    const d = await api.get(`/redacoes/${id}`);
    setR(d.redacao);
  }

  async function carregarQuestoes() {
    try {
      const d = await api.get(`/perguntas/por-redacao/${id}`);
      setQuestoes(d.questoes || []);
    } catch { setQuestoes([]); }
  }

  async function gerar() {
    setGerando(true);
    setErro('');
    try {
      await api.post(`/perguntas/redacao/${id}/gerar`, { quantidade: qtd });
      await carregarQuestoes();
    } catch (e) { setErro(e.message); } finally { setGerando(false); }
  }

  useEffect(() => {
    carregar().catch((e) => setErro(e.message));
    carregarQuestoes();
  }, [id]);

  if (erro) return <div className="container page"><div className="error-banner">{erro}</div></div>;
  if (!r) return <div className="container page"><div className="spinner spinner-dark" /></div>;

  const res = r.resultado || {};
  const estat = res.estatisticas || {};
  const quem = r.aluno ? r.aluno.nome : (r.grupo ? `${r.grupo.nome} (${r.grupo.alunos.map((a) => a.nome).join(', ')})` : '—');

  async function salvarNota(e) {
    e.preventDefault();
    const n = Number(notaEdit);
    if (Number.isNaN(n) || n < 0 || n > 10) { setErro('Nota deve ser entre 0 e 10.'); return; }
    try {
      await api.put(`/redacoes/${r.id}`, { notaFinal: n });
      setEditing(false);
      await carregar();
    } catch (err) { setErro(err.message); }
  }

  async function excluir() {
    if (!confirm('Excluir esta redação?')) return;
    await api.del(`/redacoes/${r.id}`);
    nav(`/turmas/${r.turma_id}`);
  }

  return (
    <div className="container page">
      <div className="flex" style={{ gap: 8, marginBottom: 8 }}>
        <Link to={`/turmas/${r.turma_id}`} className="muted">← Voltar para a turma</Link>
      </div>
      <div className="page-head">
        <div>
          <h1>{r.titulo || 'Redação'}</h1>
          <p><strong>{quem}</strong> · Nota final: <strong style={{ color: notaCor(r.nota_final) }}>{r.nota_final ?? '—'}</strong></p>
        </div>
        <div className="flex">
          <button className="btn btn-ghost" onClick={() => window.print()}>🖨️ Imprimir</button>
          <button className="btn btn-ghost" onClick={() => baixarArquivo(`/redacoes/${r.id}/pdf`, `redacao-${r.id}-correcao.pdf`).catch((e) => setErro(e.message))}>
            ⬇️ Baixar PDF
          </button>
          <button className="btn btn-danger btn-ghost" onClick={excluir}>Excluir</button>
        </div>
      </div>

      {erro && <div className="error-banner">{erro}</div>}

      {res.aviso && <div className="aviso">⚠️ {res.aviso}</div>}

      <div className="grid-2" style={{ marginBottom: 18 }}>
        <div className="card flex" style={{ gap: 16 }}>
          <Nota nota={r.nota_final} />
          <div className="grow">
            <h3 style={{ margin: '0 0 6px' }}>Nota da redação</h3>
            <p className="muted" style={{ margin: 0 }}>
              {res.ia ? 'Correção por IA + heurísticas' : 'Correção heurística (configure IA no .env para análise completa)'}
            </p>
            {editing ? (
              <form onSubmit={salvarNota} className="flex" style={{ marginTop: 10 }}>
                <input type="number" step="0.1" min="0" max="10" value={notaEdit} onChange={(e) => setNotaEdit(e.target.value)} style={{ width: 90 }} />
                <button className="btn btn-sm">Salvar</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>X</button>
              </form>
            ) : (
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }}
                onClick={() => { setNotaEdit(String(r.nota_final ?? '')); setEditing(true); }}>
                ✏️ Ajustar nota
              </button>
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ margin: '0 0 10px' }}>Estatísticas</h3>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
            <div><strong>{estat.palavras ?? 0}</strong><br /><span className="muted">palavras</span></div>
            <div><strong>{estat.paragrafos ?? 0}</strong><br /><span className="muted">parágrafos</span></div>
            <div><strong>{estat.sentencas ?? 0}</strong><br /><span className="muted">frases</span></div>
            <div><strong>{estat.palavras_unicas ?? 0}</strong><br /><span className="muted">vocabulário único</span></div>
            <div><strong>{estat.repeticao_ratio ?? 0}%</strong><br /><span className="muted">repetição</span></div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h3 style={{ margin: '0 0 12px' }}>✍️ Produção com erros e acertos</h3>
        <HighlightedText
          texto={r.texto}
          ortografia={res.ortografia || []}
          coesao={res.coesao?.problemas || []}
          semantica={res.semantica?.problemas || []}
          positivos={[
            ...(res.coesao?.positivos || []),
            ...(res.semantica?.positivos || [])
          ]}
        />
      </div>

      {res.resumo && (
        <div className="card" style={{ marginBottom: 18 }}>
          <h3 style={{ margin: '0 0 8px' }}>📋 Resumo da avaliação</h3>
          <p style={{ margin: 0 }}>{res.resumo}</p>
        </div>
      )}

      {(res.competencias?.length > 0) && (
        <div className="card" style={{ marginBottom: 18 }}>
          <h3 style={{ margin: '0 0 12px' }}>🎯 Competências (1 a 5)</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {res.competencias.map((c, i) => (
              <div key={i}>
                <div className="flex-between">
                  <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>{c.nome}</span>
                  <strong style={{ color: notaCor((c.nota / 5) * 10) }}>{c.nota.toFixed ? c.nota.toFixed(1) : c.nota}</strong>
                </div>
                <div className="progress-row" style={{ marginTop: 5 }}>
                  <div className="progress">
                    <div style={{ width: `${(c.nota / 5) * 100}%`, background: notaCor((c.nota / 5) * 10) }} />
                  </div>
                </div>
                {c.comentario && <p className="muted" style={{ margin: '5px 0 0' }}>{c.comentario}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <h3 style={{ margin: '0 0 6px' }}>🔗 Coesão — {res.coesao?.score ?? 0}/10</h3>
          {res.coesao?.conectivos && (
            <div style={{ marginBottom: 10 }}>
              <span className="muted">Conectivos encontrados: <strong>{res.coesao.conectivos.total || 0}</strong>
                {res.coesao.conectivos.funcoes?.length > 0 && ` (${res.coesao.conectivos.funcoes.join(', ')})`}</span>
            </div>
          )}
          {res.coesao?.avaliacao && <p className="muted">{res.coesao.avaliacao}</p>}
          {res.coesao?.problemas?.length === 0 ? (
            <p style={{ color: '#15803d' }}>✅ A coesão está adequada.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {res.coesao?.problemas.map((p, i) => (
                <li key={i} style={{ marginBottom: 8, fontSize: '0.92rem' }}>
                  <strong>“{p.trecho}”</strong> — {p.message}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h3 style={{ margin: '0 0 6px' }}>🔮 Semântica — {res.semantica?.score ?? 0}/10</h3>
          {res.semantica?.avaliacao && <p className="muted">{res.semantica.avaliacao}</p>}
          {res.semantica?.problemas?.length === 0 ? (
            <p style={{ color: '#15803d' }}>✅ Sentido e vocabulário sem problemas relevantes.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {res.semantica?.problemas.map((p, i) => (
                <li key={i} style={{ marginBottom: 8, fontSize: '0.92rem' }}>
                  <strong>“{p.trecho}”</strong> — {p.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {(res.ortografia?.length > 0) && (
        <div className="card" style={{ marginTop: 18 }}>
          <h3 style={{ margin: '0 0 6px' }}>🔤 Ortografia e gramática ({res.ortografia.length})</h3>
          <table className="table">
            <thead><tr><th>Trecho</th><th>Problema</th><th>Sugestão</th><th>Categoria</th></tr></thead>
            <tbody>
              {res.ortografia.map((m, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'Georgia, serif' }}>“{r.texto.slice(m.start, m.end)}”</td>
                  <td className="muted">{m.message}</td>
                  <td>{m.replacements?.join(', ') || '—'}</td>
                  <td>{m.categoria}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card" style={{ marginTop: 18 }}>
        <div className="flex-between" style={{ gap: 10, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: '0 0 4px' }}>🧠 Interpretação textual</h3>
            <p className="muted" style={{ margin: 0 }}>
              A IA gera questões sobre o texto desta redação para os alunos responderem no papel.
            </p>
          </div>
          <div className="flex" style={{ gap: 8 }}>
            <select value={qtd} onChange={(e) => setQtd(Number(e.target.value))} style={{ width: 90 }}>
              {QUANTIDADE_QUESTOES.map((n) => <option key={n} value={n}>{n} questões</option>)}
            </select>
            {questoes.length > 0 && (
              <button className="btn btn-ghost"
                onClick={() => nav(`/questoes/imprimir?ids=${questoes.map((q) => q.id).join(',')}&gabarito=1`)}>
                🖨️ Imprimir
              </button>
            )}
            <button className="btn" onClick={gerar} disabled={gerando}>
              {gerando ? 'Gerando...' : `🤖 Gerar ${qtd} questões`}
            </button>
          </div>
        </div>

        <div className="info-banner" style={{ margin: '12px 0 0', background: 'rgba(99,102,241,0.08)' }}>
          {questoes.length > 0
            ? `${questoes.length} questão(ões) gerada(s). Clique em "Imprimir" para imprimir/salvar em PDF (o gabarito vem no final para o professor).`
            : 'Clique em "Gerar questões" para criar questões de interpretação sobre o texto do aluno. Em modo de teste (sem chave de IA) as questões são exemplos; configure a chave no .env para questões reais.'}
        </div>

        {questoes.length > 0 && (
          <div className="grid" style={{ gridTemplateColumns: '1fr', gap: 10, marginTop: 14 }}>
            {questoes.map((q, qi) => (
              <div key={q.id} className="questao-line">
                <p style={{ margin: 0, fontWeight: 600 }}>{qi + 1}. {q.enunciado}</p>
                {q.alternativas.length > 0 ? (
                  <ol style={{ margin: '6px 0 0', paddingLeft: 22 }}>
                    {q.alternativas.map((a, ai) => (
                      <li key={ai} style={{ marginBottom: 2 }}>
                        {LETRAS[ai]}) {a}{' '}
                        {String(ai) === String(q.correta) && <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="muted" style={{ margin: '6px 0 0' }}>Dissertativa — resposta esperada: {q.explicacao}</p>
                )}
                {q.explicacao && q.alternativas.length > 0 && (
                  <p className="muted" style={{ margin: '6px 0 0', fontSize: '0.85rem' }}>
                    <strong>Gabarito:</strong> {LETRAS[Number(q.correta)]} · {q.explicacao}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {r.image_path && (
        <div className="card" style={{ marginTop: 18 }}>
          <h3 style={{ margin: '0 0 8px' }}>📄 Imagem original</h3>
          <img src={r.image_path} alt="Redação original" style={{ maxWidth: '100%', borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}