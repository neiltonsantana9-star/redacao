import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, baixarArquivo } from '../api.js';
import { GENEROS_TEXTUAIS, NIVEIS_QUESTAO } from '../constants.js';

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];

const NIVEL_COR = { 'fácil': '#16a34a', 'médio': '#d97706', 'difícil': '#dc2626' };

function letraCorreta(q) {
  const idx = Number(q.correta);
  return Number.isInteger(idx) ? LETRAS[idx] : '—';
}

export default function BancoQuestoes() {
  const nav = useNavigate();
  const [questoes, setQuestoes] = useState([]);
  const [erro, setErro] = useState('');
  const [fGenero, setFGenero] = useState('todos');
  const [fNivel, setFNivel] = useState('todos');
  const [fBusca, setFBusca] = useState('');
  const [selecionadas, setSelecionadas] = useState({});
  const [editando, setEditando] = useState(null);

  async function carregar() {
    const q = new URLSearchParams();
    if (fGenero !== 'todos') q.set('genero', fGenero);
    if (fNivel !== 'todos') q.set('nivel', fNivel);
    if (fBusca.trim()) q.set('busca', fBusca.trim());
    const d = await api.get(`/perguntas?${q}`);
    setQuestoes(d.questoes || []);
  }

  useEffect(() => {
    carregar().catch((e) => setErro(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fGenero, fNivel, fBusca]);

  const idsSelecionadas = useMemo(() => {
    const ids = questoes.filter((q) => selecionadas[q.id]).map((q) => q.id);
    return ids;
  }, [selecionadas, questoes]);

  function toggleSel(id) {
    setSelecionadas((s) => ({ ...s, [id]: !s[id] }));
  }

  function imprimir(ids) {
    if (!ids.length) return alert('Selecione ao menos uma questão para imprimir.');
    nav(`/questoes/imprimir?ids=${ids.join(',')}`);
  }

  async function baixar(ids) {
    if (!ids.length) return alert('Selecione ao menos uma questão para baixar o PDF.');
    try {
      await baixarArquivo(`/perguntas/pdf?ids=${ids.join(',')}&gabarito=1`, `prova-${ids.length}-questoes.pdf`);
    } catch (e) { setErro(e.message); }
  }

  async function excluir(q) {
    if (!confirm('Excluir esta questão?')) return;
    try {
      await api.del(`/perguntas/${q.id}`);
      await carregar();
    } catch (e) { setErro(e.message); }
  }

  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <h1>🧠 Banco de questões de interpretação</h1>
          <p>Crie questões por gênero textual ou gere com IA a partir de uma redação corrigida.</p>
        </div>
        <div className="flex">
          <button className="btn btn-ghost" onClick={() => imprimir(idsSelecionadas)}>
            🖨️ Imprimir selecionadas ({idsSelecionadas.length})
          </button>
          <button className="btn btn-ghost" onClick={() => baixar(idsSelecionadas)}>
            ⬇️ Baixar PDF ({idsSelecionadas.length})
          </button>
          <button className="btn" onClick={() => setEditando({})}>+ Nova questão</button>
        </div>
      </div>

      {erro && <div className="error-banner" onClick={() => setErro('')} style={{ cursor: 'pointer' }}>{erro} ✕</div>}

      {editando && (
        <QuestaoEditor
          valor={editando}
          isNew={!editando.id}
          onCancel={() => setEditando(null)}
          onSaved={async () => { setEditando(null); await carregar(); }}
          onErro={setErro}
        />
      )}

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
          placeholder="Buscar por palavra-chave..."
          style={{ flex: 1, minWidth: 200 }}
        />
      </div>

      <div className="info-banner" style={{ marginBottom: 16 }}>
        💡 Para gerar <strong>questões com IA sobre a redação do aluno</strong>, abra a correção de uma redação
        e use o botão <em>Gerar questões</em>. As questões criadas aqui ficam salvas para reutilizar.
      </div>

      {questoes.length === 0 && (
        <div className="card empty">
          <div className="big">🧠</div>
          <p>Nenhuma questão encontrada com esses filtros.</p>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: '1fr', gap: 12 }}>
        {questoes.map((q) => (
          <div className="card questao-line" key={q.id}>
            <div className="flex-between" style={{ gap: 10 }}>
              <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
                <span className="tag">{q.genero || 'Sem gênero'}</span>
                <span style={{ fontWeight: 700, color: NIVEL_COR[q.nivel] || '#475569' }}>{q.nivel}</span>
                <span className={q.origem === 'ia' ? 'tag tag-warn' : 'tag'}>
                  {q.origem === 'ia' ? 'Gerada por IA' : 'Banco'}
                </span>
              </div>
              <label className="flex" style={{ gap: 6, alignItems: 'center', fontSize: '0.85rem' }} title="Incluir na impressão">
                <input type="checkbox" checked={!!selecionadas[q.id]} onChange={() => toggleSel(q.id)} />
                Imprimir
              </label>
            </div>

            <p style={{ fontWeight: 600, margin: '10px 0 8px' }}>{q.enunciado}</p>

            {q.alternativas.length > 0 ? (
              <ol style={{ margin: 0, paddingLeft: 22 }}>
                {q.alternativas.map((a, i) => (
                  <li key={i} style={{ marginBottom: 3 }}>
                    <span>{LETRAS[i]}) {a}</span>
                    {String(i) === String(q.correta) && <span style={{ color: '#16a34a', fontWeight: 700 }}> ✓</span>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="muted" style={{ margin: 0 }}>Questão dissertativa — <strong>gabarito:</strong> {q.explicacao}</p>
            )}

            {q.alternativas.length > 0 && q.explicacao && (
              <p className="muted" style={{ margin: '8px 0 0', fontSize: '0.9rem' }}>
                <strong>Gabarito:</strong> {letraCorreta(q)} · <strong>Explicação:</strong> {q.explicacao}
              </p>
            )}

            <div className="flex" style={{ gap: 8, marginTop: 12 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => imprimir([q.id])}>🖨️ Imprimir</button>
              <button className="btn btn-ghost btn-sm" onClick={() => baixar([q.id])}>⬇️ PDF</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditando(q)}>✏️ Editar</button>
              {q.origem !== 'ia' && (
                <button className="btn btn-danger btn-ghost btn-sm" onClick={() => excluir(q)}>🗑️ Excluir</button>
              )}
              {q.origem === 'ia' && q.redacao_id && (
                <Link className="btn btn-ghost btn-sm" to={`/redacoes/${q.redacao_id}`}>Ver redação</Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuestaoEditor({ valor, isNew, onCancel, onSaved, onErro }) {
  const [f, setF] = useState({
    genero: valor.genero || '',
    nivel: valor.nivel || 'fácil',
    enunciado: valor.enunciado || '',
    alternativas: valor.alternativas?.length
      ? valor.alternativas
      : ['', '', '', ''],
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
    const enunciado = f.enunciado.trim();
    if (!enunciado) return onErro('Informe o enunciado da questão.');
    try {
      setSalvando(true);
      const body = {
        genero: f.genero,
        nivel: f.nivel,
        enunciado,
        alternativas: discursiva ? [] : f.alternativas.map((a) => a.trim()).filter(Boolean),
        correta: discursiva ? '' : f.correta,
        explicacao: f.explicacao
      };
      if (isNew) await api.post('/perguntas', body);
      else await api.put(`/perguntas/${valor.id}`, body);
      await onSaved();
    } catch (err) {
      onErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: 16, border: '1px solid var(--primary, #6366f1)' }}>
      <h3>{isNew ? '+ Nova questão' : `✏️ Editar questão #${valor.id}`}</h3>
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
          <textarea rows={3} value={f.enunciado} onChange={onClick(setF)} placeholder="Ex.: Qual é a finalidade principal de uma crônica?" required />
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