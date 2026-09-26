import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, baixarArquivo } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { GENEROS_TEXTUAIS, NIVEIS_QUESTAO } from '../constants.js';

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function QuestoesImpressao() {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const ids = params.get('ids')?.split(',').map((s) => Number(s.trim())).filter(Number.isInteger) || [];
  const textoId = Number(params.get('texto_id')) || null;

  const [questoes, setQuestoes] = useState([]);
  const [texto, setTexto] = useState(null);
  const [erro, setErro] = useState('');
  const [titulo, setTitulo] = useState('Questões de interpretação textual');
  const [turma, setTurma] = useState('');
  const [atividade, setAtividade] = useState('');
  const [mostrarGabarito, setMostrarGabarito] = useState(params.get('gabarito') === '1');
  const hoje = new Date().toLocaleDateString('pt-BR');

  useEffect(() => {
    if (textoId) {
      api.get(`/textos/${textoId}`)
        .then((d) => {
          setTexto(d.texto);
          setTitulo(d.texto.titulo || 'Questões de interpretação textual');
        })
        .catch((e) => setErro(e.message));
      api.get(`/perguntas/por-texto/${textoId}`)
        .then((d) => setQuestoes(d.questoes || []))
        .catch((e) => setErro(e.message));
    } else if (ids.length) {
      api.get(`/perguntas?ids=${ids.join(',')}`)
        .then((d) => setQuestoes(d.questoes || []))
        .catch((e) => setErro(e.message));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  if (erro) return <div className="container page"><div className="error-banner">{erro}</div></div>;
  if (!ids.length && !textoId) {
    return <div className="container page"><div className="card empty"><p>Nenhuma questão selecionada para impressão.</p></div></div>;
  }

  async function baixarPdf() {
    const gabarito = mostrarGabarito ? '&gabarito=1' : '';
    const url = textoId
      ? `/textos/${textoId}/pdf?${gabarito.length ? gabarito.replace('&', '') : ''}`
      : `/perguntas/pdf?ids=${ids.join(',')}${gabarito}`;
    try {
      await baixarArquivo(url.replace(/\?$/, ''), `prova-${textoId ? `texto-${textoId}` : ids.length}.pdf`);
    } catch (e) { setErro(e.message); }
  }

  const generos = [...new Set(questoes.map((q) => q.genero).filter(Boolean))];
  const generoNome = generos.map((g) => {
    const found = GENEROS_TEXTUAIS.find((x) => x.chave === g);
    return found ? found.chave : g;
  }).join(' · ');

  return (
    <div className="container page no-app">
      <div className="no-print card" style={{ padding: 14, position: 'sticky', top: 0, zIndex: 5 }}>
        <div className="flex" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => window.print()}>🖨️ Imprimir / Salvar PDF</button>
          <button className="btn btn-ghost" onClick={baixarPdf}>⬇️ Baixar PDF</button>
          <button className="btn btn-ghost" onClick={() => window.history.back()}>← Voltar</button>
          <label className="flex" style={{ gap: 6, alignItems: 'center', marginLeft: 'auto' }}>
            <input type="checkbox" checked={mostrarGabarito} onChange={(e) => setMostrarGabarito(e.target.checked)} />
            Incluir gabarito para o professor
          </label>
        </div>
        <p className="muted" style={{ margin: '8px 0 0', fontSize: '0.85rem' }}>
          {questoes.length} questão(ões) {generoNome ? `· Gêneros: ${generoNome}` : ''} · Basta imprimir ou escolher "Salvar como PDF".
        </p>
      </div>

      <div className="print-area">
        <div className="print-head">
          <h1>{titulo}</h1>
          <p>Professor(a): <strong>{user?.name || ''}</strong> · Data: <strong>{hoje}</strong></p>
          <div className="print-lines">
            <span><input value={turma} onChange={(e) => setTurma(e.target.value)} placeholder="Turma: ______________" /></span>
            <span><input value={atividade} onChange={(e) => setAtividade(e.target.value)} placeholder="Atividade: ______________" /></span>
            <span><input placeholder="Aluno(a): ______________" /></span>
          </div>
        </div>

        {texto && (
          <div className="texto-base">
            <h2 className="texto-title">{texto.titulo}</h2>
            {(texto.autor || texto.fonte) && (
              <p className="muted texto-credito">
                {(texto.autor || '')}{texto.autor && texto.fonte ? ' · ' : ''}{texto.fonte || ''}
              </p>
            )}
            {String(texto.texto || '').split(/\n+/).filter(Boolean).map((par, i) => (
              <p key={i}>{par.trim()}</p>
            ))}
            {texto.orientacao && <p className="texto-ori"><strong>{texto.orientacao}</strong></p>}
          </div>
        )}

        {questoes.length === 0 && (
          <div className="card empty">
            <div className="big">🧠</div>
            <p>Carregando questões...</p>
          </div>
        )}

        {questoes.map((q, i) => (
          <div className="questao" key={q.id}>
            <p className="questao-num">{i + 1}. {q.enunciado}</p>
            {q.alternativas.length > 0 ? (
              <ol style={{ margin: '4px 0 0', paddingLeft: 22 }}>
                {q.alternativas.map((a, j) => (
                  <li key={j} style={{ marginBottom: 2 }}>
                    {LETRAS[j]}) {a}
                  </li>
                ))}
              </ol>
            ) : (
              <div className="linha-resposta" />
            )}
            <p className="questao-tag muted">{q.genero || ''} · {q.nivel}</p>
          </div>
        ))}

        {mostrarGabarito && (
          <div className="gabarito">
            <h3>Gabarito (para o professor)</h3>
            {questoes.map((q, i) => (
              <p key={q.id}>
                <strong>{i + 1}.</strong> {q.alternativas.length ? `Alternativa ${LETRAS[Number(q.correta)] || '—'}`
                  : 'Resposta dissertativa (ver explicação)'}
                {q.explicacao && <span className="muted"> — {q.explicacao}</span>}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}