import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, baixarArquivo } from '../api.js';
import { GENEROS_TEXTUAIS, NIVEIS_QUESTAO, QUANTIDADE_QUESTOES } from '../constants.js';

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];
const NIVEL_COR = { 'fácil': '#16a34a', 'médio': '#d97706', 'difícil': '#dc2626' };

function letraCorreta(q) {
  const idx = Number(q.correta);
  return Number.isInteger(idx) ? LETRAS[idx] : '—';
}

export default function TextosAcervo() {
  const nav = useNavigate();
  const [textos, setTextos] = useState([]);
  const [erro, setErro] = useState('');
  const [fGenero, setFGenero] = useState('todos');
  const [fNivel, setFNivel] = useState('todos');
  const [fBusca, setFBusca] = useState('');
  const [abre, setAbre] = useState(null);      // { texto, questoes }
  const [editandoTexto, setEditandoTexto] = useState(null);
  const [editandoQuestao, setEditandoQuestao] = useState(null); // { textoId, questao? }
  const [gerando, setGerando] = useState(false);
  const [qtd, setQtd] = useState(5);

  async function carregar() {
    const q = new URLSearchParams();
    if (fGenero !== 'todos') q.set('genero', fGenero);
    if (fNivel !== 'todos') q.set('nivel', fNivel);
    if (fBusca.trim()) q.set('busca', fBusca.trim());
    const d = await api.get(`/textos?${q}`);
    setTextos(d.textos || []);
  }

  useEffect(() => {
    carregar().catch((e) => setErro(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fGenero, fNivel, fBusca]);

  async function ver(id) {
    try {
      const [dTexto, dQuestoes] = await Promise.all([
        api.get(`/textos/${id}`),
        api.get(`/perguntas/por-texto/${id}`)
      ]);
      setAbre({ texto: dTexto.texto, questoes: dQuestoes.questoes || [] });
    } catch (e) { setErro(e.message); }
  }

  async function gerar() {
    if (!abre) return;
    setGerando(true);
    setErro('');
    try {
      await api.post(`/textos/${abre.texto.id}/gerar`, { quantidade: qtd });
      await ver(abre.texto.id);
    } catch (e) { setErro(e.message); } finally { setGerando(false); }
  }

  async function excluirTexto(t) {
    if (!confirm(`Excluir o texto "${t.titulo}"? As ${t.qtd_questoes} questão(ões) dele também serão apagadas.`)) return;
    try {
      await api.del(`/textos/${t.id}`);
      if (abre?.texto.id === t.id) setAbre(null);
      await carregar();
    } catch (e) { setErro(e.message); }
  }

  async function excluirQuestao(q) {
    if (!confirm('Excluir esta questão?')) return;
    try {
      await api.del(`/perguntas/${q.id}`);
      await ver(abre.texto.id);
    } catch (e) { setErro(e.message); }
  }

  function baixarPdfTexto(id, nome) {
    baixarArquivo(`/textos/${id}/pdf?gabarito=1`, `texto-${id}-questoes.pdf`).catch((e) => setErro(e.message));
  }

  async function salvarQuestao(q) {
    try {
      if (q.id) await api.put(`/perguntas/${q.id}`, q);
      else await api.post('/perguntas', { ...q, textoId: q.textoId });
      setEditandoQuestao(null);
      await ver(abre.texto.id);
    } catch (e) { setErro(e.message); }
  }

  if (editandoTexto) {
    return (
      <div className="container page">
        <div className="page-head">
          <h1>{editandoTexto.id ? `✏️ Editar texto "${editandoTexto.titulo}"` : '+ Novo texto'}</h1>
        </div>
        <TextoEditor
          valor={editandoTexto}
          onCancel={() => setEditandoTexto(null)}
          onSaved={async () => { setEditandoTexto(null); await carregar(); }}
          onErro={setErro}
        />
      </div>
    );
  }

  if (abre) {
    const t = abre.texto;
    return (
      <div className="container page">
        <div className="flex" style={{ gap: 8, marginBottom: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setAbre(null)}>← Voltar para o acervo</button>
        </div>
        <div className="page-head">
          <div>
            <h1>📄 {t.titulo}</h1>
            <p>
              {t.autor && <><strong>{t.autor}</strong> · </>}{t.fonte} · {t.genero || 'Sem gênero'} ·{' '}
              <span style={{ fontWeight: 700, color: NIVEL_COR[t.nivel] || '#475569' }}>{t.nivel}</span> ·{' '}
              {abre.questoes.length} questão(ões)
            </p>
          </div>
          <div className="flex" style={{ gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => nav(`/questoes/imprimir?texto_id=${t.id}&gabarito=1`)}>
              🖨️ Imprimir texto + questões
            </button>
            <button className="btn btn-ghost" onClick={() => baixarPdfTexto(t.id, t.titulo)}>⬇️ Baixar PDF</button>
            <button className="btn btn-ghost" onClick={() => setEditandoTexto(t)}>✏️ Editar texto</button>
          </div>
        </div>

        {erro && <div className="error-banner" onClick={() => setErro('')} style={{ cursor: 'pointer' }}>{erro} ✕</div>}

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="texto-base">
            <h2 className="texto-title">{t.titulo}</h2>
            {(t.autor || t.fonte) && (
              <p className="muted texto-credito">{(t.autor || '')}{t.autor && t.fonte ? ' · ' : ''}{t.fonte || ''}</p>
            )}
            {String(t.texto || '').split(/\n+/).filter(Boolean).map((par, i) => (
              <p key={i}>{par.trim()}</p>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex-between" style={{ gap: 10, flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ margin: '0 0 4px' }}>🧠 Questões de interpretação</h3>
              <p className="muted" style={{ margin: 0 }}>{t.orientacao || 'Leia o texto atentamente e responda.'}</p>
            </div>
            <div className="flex" style={{ gap: 8 }}>
              <select value={qtd} onChange={(e) => setQtd(Number(e.target.value))} style={{ width: 110 }}>
                {QUANTIDADE_QUESTOES.map((n) => <option key={n} value={n}>{n} qtd.</option>)}
              </select>
              <button className="btn" onClick={gerar} disabled={gerando}>
                {gerando ? 'Gerando...' : `🤖 Gerar ${qtd} questões`}
              </button>
              <button className="btn btn-ghost" onClick={() => setEditandoQuestao({ textoId: t.id })}>+ Nova questão</button>
            </div>
          </div>

          {editandoQuestao && (
            <QuestaoEditor
              valor={editandoQuestao.id ? editandoQuestao : { genero: t.genero, textoId: t.id }}
              onCancel={() => setEditandoQuestao(null)}
              onSave={salvarQuestao}
              onErro={setErro}
            />
          )}

          <div className="grid" style={{ gridTemplateColumns: '1fr', gap: 10, marginTop: 14 }}>
            {abre.questoes.map((q, i) => (
              <div key={q.id} className="questao-line">
                <div className="flex-between" style={{ gap: 8 }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>{i + 1}. {q.enunciado}</p>
                  <div className="flex" style={{ gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditandoQuestao({ ...q, textoId: t.id })}>✏️</button>
                    <button className="btn btn-danger btn-ghost btn-sm" onClick={() => excluirQuestao(q)}>🗑️</button>
                  </div>
                </div>
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
                {q.alternativas.length > 0 && q.explicacao && (
                  <p className="muted" style={{ margin: '6px 0 0', fontSize: '0.85rem' }}>
                    <strong>Gabarito:</strong> {letraCorreta(q)} · {q.explicacao}
                  </p>
                )}
                <span className="tag" style={{ marginTop: 8 }}>
                  {q.origem === 'ia' ? 'Gerada por IA' : 'Banco'} · {q.nivel}
                </span>
              </div>
            ))}
            {abre.questoes.length === 0 && (
              <p className="muted">Nenhuma questão ainda. Use "🤖 Gerar questões" ou "+ Nova questão".</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <h1>📚 Textos complexos de interpretação</h1>
          <p>Acervo de textos autorais com questões elaboradas — imprima e aplique para os alunos responderem no papel.</p>
        </div>
        <button className="btn" onClick={() => setEditandoTexto({})}>+ Novo texto</button>
      </div>

      {erro && <div className="error-banner" onClick={() => setErro('')} style={{ cursor: 'pointer' }}>{erro} ✕</div>}

      <div className="flex" style={{ gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={fGenero} onChange={(e) => setFGenero(e.target.value)} style={{ width: 190 }}>
          <option value="todos">Todos os gêneros</option>
          {GENEROS_TEXTUAIS.map((g) => <option key={g.chave} value={g.chave}>{g.chave}</option>)}
        </select>
        <select value={fNivel} onChange={(e) => setFNivel(e.target.value)} style={{ width: 130 }}>
          <option value="todos">Todos os níveis</option>
          {NIVEIS_QUESTAO.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <input
          value={fBusca}
          onChange={(e) => setFBusca(e.target.value)}
          placeholder="Buscar por título, autor ou trecho..."
          style={{ flex: 1, minWidth: 200 }}
        />
      </div>

      {textos.length === 0 && (
        <div className="card empty">
          <div className="big">📚</div>
          <p>Nenhum texto encontrado com esses filtros.</p>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: '1fr', gap: 12 }}>
        {textos.map((t) => (
          <div className="card questao-line" key={t.id}>
            <div className="flex-between" style={{ gap: 10 }}>
              <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
                <span className="tag">{t.genero || 'Sem gênero'}</span>
                <span style={{ fontWeight: 700, color: NIVEL_COR[t.nivel] || '#475569' }}>{t.nivel}</span>
                <span className="tag">{t.qtd_questoes} questão(ões)</span>
              </div>
              <div className="flex" style={{ gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => nav(`/questoes/imprimir?texto_id=${t.id}&gabarito=1`)}>🖨️ Imprimir</button>
                <button className="btn btn-ghost btn-sm" onClick={() => baixarPdfTexto(t.id, t.titulo)}>⬇️ PDF</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditandoTexto(t)}>✏️</button>
                <button className="btn btn-danger btn-ghost btn-sm" onClick={() => excluirTexto(t)}>🗑️</button>
              </div>
            </div>
            <h3 style={{ margin: '10px 0 4px' }}>{t.titulo}</h3>
            <p className="muted" style={{ margin: '0 0 8px', fontSize: '0.85rem' }}>
              {t.autor}{t.autor && t.fonte ? ' · ' : ''}{t.fonte}
            </p>
            <p style={{ margin: 0, whiteSpace: 'pre-line' }}>
              {String(t.texto || '').slice(0, 220)}{(t.texto || '').length > 220 ? '…' : ''}
            </p>
            <div className="flex" style={{ gap: 8, marginTop: 12 }}>
              <button className="btn btn-sm" onClick={() => ver(t.id)}>📄 Abrir texto + questões</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Editor de texto do acervo (novo/editar)
function TextoEditor({ valor, onCancel, onSaved, onErro }) {
  const [f, setF] = useState({
    titulo: valor.titulo || '',
    autor: valor.autor !== undefined ? valor.autor : 'Acervo',
    fonte: valor.fonte || '',
    genero: valor.genero || 'Narrativo',
    nivel: valor.nivel || 'difícil',
    orientacao: valor.orientacao || '',
    texto: valor.texto || ''
  });
  const [salvando, setSalvando] = useState(false);
  const onClick = (setFn) => (e) => setFn(e.target.value);

  async function salvar(e) {
    e.preventDefault();
    if (!f.titulo.trim()) return onErro('Informe o título do texto.');
    if (!f.texto.trim()) return onErro('Informe o texto.');
    try {
      setSalvando(true);
      const body = { ...f, titulo: f.titulo.trim(), texto: f.texto.trim() };
      if (valor.id) await api.put(`/textos/${valor.id}`, body);
      else await api.post('/textos', body);
      await onSaved();
    } catch (err) { onErro(err.message); } finally { setSalvando(false); }
  }

  return (
    <form onSubmit={salvar} className="card" style={{ display: 'grid', gap: 12 }}>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 180px 130px', gap: 10 }}>
        <div>
          <label>Título *</label>
          <input value={f.titulo} onChange={onClick(setF)} placeholder="Ex.: A noite que não terminou" required />
        </div>
        <div>
          <label>Autor</label>
          <input value={f.autor} onChange={onClick(setF)} placeholder="Autor ou deixe 'Acervo'" />
        </div>
        <div>
          <label>Fonte</label>
          <input value={f.fonte} onChange={onClick(setF)} placeholder="Ex.: Conto, Ensaio, Poema..." />
        </div>
        <div>
          <label>Nível</label>
          <select value={f.nivel} onChange={onClick(setF)}>
            {NIVEIS_QUESTAO.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label>Gênero textual</label>
        <select value={f.genero} onChange={onClick(setF)}>
          <option value="">Selecione...</option>
          {GENEROS_TEXTUAIS.map((g) => <option key={g.chave} value={g.chave}>{g.chave}</option>)}
        </select>
      </div>
      <div>
        <label>Orientação para o aluno</label>
        <input value={f.orientacao} onChange={onClick(setF)} placeholder="Ex.: Leia o texto com atenção e responda às questões de 1 a 5." />
      </div>
      <div>
        <label>Texto completo *</label>
        <textarea rows={14} value={f.texto} onChange={onClick(setF)} placeholder="Cole aqui o texto. Separe os parágrafos com uma linha em branco." required />
      </div>
      <div className="flex" style={{ gap: 8 }}>
        <button className="btn" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar texto'}</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}

// Editor de questão ligada a um texto
function QuestaoEditor({ valor, onCancel, onSave, onErro }) {
  const isNew = !valor.id;
  const [f, setF] = useState({
    genero: valor.genero || '',
    nivel: valor.nivel || 'difícil',
    enunciado: valor.enunciado || '',
    alternativas: valor.alternativas?.length ? valor.alternativas : ['', '', '', ''],
    correta: valor.correta !== undefined && valor.correta !== '' ? valor.correta : '0',
    explicacao: valor.explicacao || ''
  });
  const [discursiva, setDiscursiva] = useState(!valor.alternativas?.length);
  const [salvando, setSalvando] = useState(false);
  const onClick = (setFn) => (e) => setFn(e.target.value);

  function gravarCorreta(idx) {
    setF((s) => ({ ...s, correta: String(idx) }));
  }

  async function salvar(e) {
    e.preventDefault();
    if (!f.enunciado.trim()) return onErro('Informe o enunciado da questão.');
    try {
      setSalvando(true);
      const body = {
        genero: f.genero,
        nivel: f.nivel,
        enunciado: f.enunciado.trim(),
        alternativas: discursiva ? [] : f.alternativas.map((a) => a.trim()).filter(Boolean),
        correta: discursiva ? '' : f.correta,
        explicacao: f.explicacao
      };
      if (valor.id) await onSave({ ...body, id: valor.id, textoId: valor.textoId });
      else await onSave({ ...body, textoId: valor.textoId });
    } catch (err) { onErro(err.message); } finally { setSalvando(false); }
  }

  return (
    <div className="card" style={{ margin: '12px 0', border: '1px solid var(--primary, #6366f1)' }}>
      <h3>{isNew ? '+ Nova questão para este texto' : `✏️ Editar questão`}</h3>
      <form onSubmit={salvar} style={{ display: 'grid', gap: 12 }}>
        <div className="grid" style={{ gridTemplateColumns: '200px 140px', gap: 10 }}>
          <div>
            <label>Gênero textual</label>
            <select value={f.genero} onChange={onClick(setF)} required>
              <option value="">Selecione...</option>
              {GENEROS_TEXTUAIS.map((g) => <option key={g.chave} value={g.chave}>{g.chave}</option>)}
            </select>
          </div>
          <div>
            <label>Nível</label>
            <select value={f.nivel} onChange={onClick(setF)}>
              {NIVEIS_QUESTAO.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label>Enunciado</label>
          <textarea rows={3} value={f.enunciado} onChange={onClick(setF)} placeholder="Ex.: A expressão 'defeito de fábrica' adquire no texto o sentido de..." required />
        </div>
        <div className="flex" style={{ gap: 8 }}>
          <label className="flex" style={{ gap: 6, alignItems: 'center' }}>
            <input type="radio" checked={!discursiva} onChange={() => setDiscursiva(false)} /> Múltipla escolha
          </label>
          <label className="flex" style={{ gap: 6, alignItems: 'center' }}>
            <input type="radio" checked={discursiva} onChange={() => setDiscursiva(true)} /> Dissertativa (resposta escrita)
          </label>
        </div>
        {!discursiva && (
          <div style={{ display: 'grid', gap: 6 }}>
            {[0, 1, 2, 3].map((i) => (
              <div className="flex" key={i} style={{ gap: 8, alignItems: 'center' }}>
                <label style={{ display: 'flex', gap: 6, alignItems: 'center', minWidth: 80 }}>
                  <input type="radio" checked={String(f.correta) === String(i)} onChange={() => gravarCorreta(i)} />
                  <strong>{LETRAS[i]})</strong>
                </label>
                <input
                  value={f.alternativas[i] || ''}
                  onChange={(e) => setF((s) => {
                    const alt = [...s.alternativas];
                    alt[i] = e.target.value;
                    return { ...s, alternativas: alt };
                  })}
                  placeholder={`Alternativa ${LETRAS[i]}`}
                />
              </div>
            ))}
            <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>Marque o círculo da alternativa correta.</p>
          </div>
        )}
        <div>
          <label>{discursiva ? 'Resposta esperada / gabarito' : 'Explicação (gabarito comentado)'}</label>
          <textarea rows={2} value={f.explicacao} onChange={onClick(setF)} placeholder="Por que essa é a resposta certa?" />
        </div>
        <div className="flex" style={{ gap: 8 }}>
          <button className="btn" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar questão'}</button>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}