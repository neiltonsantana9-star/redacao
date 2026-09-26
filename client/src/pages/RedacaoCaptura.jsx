import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { EXEMPLO_TEXTO } from '../constants.js';

const MAX_W = 1600;

function preprocess(img) {
  const scale = Math.min(1, MAX_W / img.naturalWidth);
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const val = g * 1.2 + 10;
    const v = val > 255 ? 255 : val < 0 ? 0 : val;
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(imageData, 0, 0);
  return { canvas: cv, dataUrl: cv.toDataURL('image/jpeg', 0.85) };
}

async function ocrFromImage(source, logger) {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker(['por'], 1, {
    logger: (m) => logger?.(m)
  });
  const { data } = await worker.recognize(source);
  await worker.terminate();
  return data.text || '';
}

export default function RedacaoCaptura() {
  const { id, atvId } = useParams();
  const nav = useNavigate();

  const [turma, setTurma] = useState(null);
  const [atividade, setAtividade] = useState(null);
  const [erro, setErro] = useState('');
  const [busy, setBusy] = useState(false);
  const [progresso, setProgresso] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [captured, setCaptured] = useState(null); // { dataUrl }
  const fotoRef = useRef(null);

  const [autor, setAutor] = useState('');
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [etapa, setEtapa] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const [t, a] = await Promise.all([
          api.get(`/turmas/${id}`).then((d) => d.turma),
          atvId ? api.get(`/atividades/${atvId}`).then((d) => d.atividade) : Promise.resolve(null)
        ]);
        setTurma(t);
        setAtividade(a);
      } catch (e) {
        setErro(e.message);
      }
    })();
    return () => pararCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, atvId]);

  async function pararCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  }

  async function ligarCamera() {
    setErro('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch (e) {
      setErro('Não foi possível acessar a câmera. Use o upload de imagem ou digite o texto: ' + e.message);
    }
  }

  function capturar() {
    const video = videoRef.current;
    if (!video) return;
    const cv = document.createElement('canvas');
    cv.width = video.videoWidth;
    cv.height = video.videoHeight;
    cv.getContext('2d').drawImage(video, 0, 0);
    const img = new Image();
    img.onload = () => {
      const { dataUrl } = preprocess(img);
      setCaptured({ dataUrl });
      pararCamera();
      setEtapa(2);
      runOcr(dataUrl);
    };
    img.src = cv.toDataURL('image/jpeg', 0.95);
  }

  function selecionarArquivo(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const { dataUrl } = preprocess(img);
        setCaptured({ dataUrl });
        setEtapa(2);
        runOcr(dataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  async function runOcr(dataUrl) {
    setBusy(true);
    setProgresso('Carregando OCR…');
    try {
      const textoOCR = await ocrFromImage(dataUrl, (m) => {
        if (m.status === 'recognizing text') {
          setProgresso(`Reconhecendo texto… ${Math.round(m.progress * 100)}%`);
        } else if (m.status === 'loading language traineddata') {
          setProgresso(`Baixando modelo de língua portuguesa… ${Math.round(m.progress * 100)}%`);
        }
      });
      const limpo = textoOCR
        .replace(/\n{3,}/g, '\n\n')
        .split('\n')
        .map((l) => l.trimEnd())
        .join('\n')
        .trim();
      setTexto(limpo);
      if (!limpo.trim()) setErro('Não foi possível reconhecer texto na imagem. Tente melhorar a foto ou ajuste o texto abaixo.');
    } catch (e) {
      setErro('Erro no OCR: ' + e.message);
    } finally {
      setBusy(false);
      setProgresso('');
    }
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    if (!texto.trim()) {
      setErro('Digite ou reconheça o texto da redação.');
      return;
    }
    if (atividade?.tipo === 'grupo' && !autor) {
      setErro('Selecione o grupo que produziu a redação.');
      return;
    }
    if ((!atividade || atividade.tipo === 'individual') && !autor) {
      setErro('Selecione o aluno.');
      return;
    }
    setBusy(true);
    setProgresso('Analisando redação (ortografia, coesão, semântica)…');
    try {
      const body = {
        turmaId: turma.id,
        atividadeId: atividade?.id || null,
        alunoId: atividade?.tipo === 'grupo' ? null : autor || null,
        grupoId: atividade?.tipo === 'grupo' ? autor || null : null,
        titulo: titulo || atividade?.titulo || '',
        texto,
        textoOcr: '',
        imagePath: captured?.dataUrl || '',
        genero: atividade?.genero_textual || turma.genero_foco || ''
      };
      const d = await api.post('/redacoes', body);
      setProgresso('');
      nav(`/redacoes/${d.redacao.id}`);
    } catch (e) {
      setErro(e.message);
      setBusy(false);
      setProgresso('');
    }
  }

  if (erro && !turma) return <div className="container page"><div className="error-banner">{erro}</div></div>;
  if (!turma) return <div className="container page"><div className="spinner spinner-dark" /></div>;

  const precisaGrupo = atividade?.tipo === 'grupo';
  const opcoesAutor = precisaGrupo
    ? (atividade.grupos || []).map((g) => ({ v: String(g.id), nome: g.nome, extra: `grupo` }))
    : turma.alunos.map((a) => ({ v: String(a.id), nome: a.nome, extra: '' }));

  return (
    <div className="container page container-narrow">
      <div className="flex" style={{ gap: 8, marginBottom: 8 }}>
        <Link to={`/turmas/${id}`} className="muted">← {turma.nome}</Link>
        {atividade && <span className="muted">/ {atividade.titulo}</span>}
      </div>
      <div className="page-head">
        <div>
          <h1>📸 Corrigir redação</h1>
          <p>{atividade
            ? `Atividade ${atividade.tipo === 'grupo' ? 'em grupo' : 'individual'} · Gênero: ${atividade.genero_textual}`
            : 'Correção avulsa (sem atividade)'}</p>
        </div>
      </div>

      {erro && <div className="error-banner">{erro}</div>}

      <div className="steps">
        <div className={`step ${etapa >= 1 ? 'active' : ''}`}><span className="n">1</span><strong>Autor</strong><p className="muted" style={{ margin: '4px 0 0' }}>Aluno ou grupo e título.</p></div>
        <div className={`step ${etapa >= 2 ? 'active' : ''}`}><span className="n">2</span><strong>Foto</strong><p className="muted" style={{ margin: '4px 0 0' }}>Tire a foto ou envie a imagem.</p></div>
        <div className={`step ${etapa >= 3 ? 'active' : ''}`}><span className="n">3</span><strong>Texto</strong><p className="muted" style={{ margin: '4px 0 0' }}>Confira o texto reconhecido.</p></div>
        <div className={`step ${etapa >= 4 ? 'active' : ''}`}><span className="n">4</span><strong>Análise</strong><p className="muted" style={{ margin: '4px 0 0' }}>Veja erros e acertos.</p></div>
      </div>

      <form onSubmit={salvar} style={{ display: 'grid', gap: 16 }}>
        <div className="grid-2" style={{ gap: 14 }}>
          <div>
            <label>{precisaGrupo ? 'Grupo que produziu *' : 'Aluno *'}</label>
            <select value={autor} onChange={(e) => setAutor(e.target.value)} required>
              <option value="">Selecione…</option>
              {opcoesAutor.map((o) => <option key={o.v} value={o.v}>{o.nome}</option>)}
            </select>
            {opcoesAutor.length === 0 && !precisaGrupo && (
              <p className="muted">Cadastre alunos na turma primeiro.</p>
            )}
          </div>
          <div>
            <label>Título (opcional)</label>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder={atividade?.titulo || 'Título da redação'} />
          </div>
        </div>

        {/* Foto */}
        <div className="card" style={{ display: captured ? 'none' : undefined }}>
          <h3 style={{ fontSize: '1rem' }}>Foto da redação</h3>
          <div className="camera" style={{ minHeight: cameraOn ? 320 : 220 }}>
            {cameraOn ? (
              <video ref={videoRef} playsInline muted style={{ maxHeight: 420 }} />
            ) : (
              <div className="overlay">
                <span style={{ fontSize: 40 }}>📷</span>
                <p style={{ margin: '0 0 6px', textAlign: 'center' }}>Posicione a folha para reconhecimento</p>
                <div className="flex" style={{ justifyContent: 'center' }}>
                  <button type="button" className="btn" onClick={ligarCamera}>Abrir câmera</button>
                </div>
              </div>
            )}
          </div>

          {cameraOn ? (
            <div className="flex" style={{ marginTop: 12 }}>
              <button type="button" className="btn" onClick={capturar}>📸 Capturar foto</button>
              <button type="button" className="btn btn-ghost" onClick={pararCamera}>Cancelar</button>
            </div>
          ) : (
            <div className="flex" style={{ marginTop: 12 }}>
              <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
                📁 Enviar imagem (upload)
                <input ref={fotoRef} type="file" accept="image/*" hidden
                  onChange={(e) => selecionarArquivo(e.target.files?.[0])} />
              </label>
            </div>
          )}
        </div>

        {/* Texto */}
        {captured && (
          <div className="card">
            <div className="flex-between">
              <h3 style={{ fontSize: '1rem' }}>Texto da redação</h3>
              <div className="flex">
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setCaptured(null)}>
                  Trocar foto
                </button>
                <button type="button" className="btn btn-sm btn-ghost"
                  onClick={() => setTexto(EXEMPLO_TEXTO)}>
                  Usar texto de exemplo
                </button>
              </div>
            </div>
            {captured && (
              <img src={captured.dataUrl} alt="Redação capturada"
                style={{ maxWidth: '100%', maxHeight: 260, borderRadius: 8, border: '1px solid var(--border)', margin: '8px 0' }} />
            )}
            <label>Texto reconhecido (corrija se necessário)</label>
            {busy ? (
              <div className="flex" style={{ gap: 10, margin: '10px 0' }}>
                <span className="spinner spinner-dark" /> {progresso && <span className="muted">{progresso}</span>}
              </div>
            ) : (
              <textarea rows={14} value={texto} onChange={(e) => setTexto(e.target.value)}
                placeholder="O texto reconhecido aparecerá aqui para revisão…" />
            )}
            <div className="aviso">
              💡 Dica: a precisão do reconhecimento é melhor com foto boa, sem sombra e com letra clara.
              Antes de salvar, revise o texto — a análise de erros funciona sobre o texto corrigido por você.
            </div>
          </div>
        )}

        {(texto.trim() || captured) && (
          <button className="btn btn-block" style={{ fontSize: '1.02rem', padding: 14 }}
            disabled={busy || !texto.trim() || (opcoesAutor.length > 0 && !autor)}>
            {busy ? <span className="spinner" /> : '🔍 Analisar e salvar correção'}
          </button>
        )}
        {busy && progresso && (
          <p className="muted" style={{ textAlign: 'center' }}>{progresso}</p>
        )}
      </form>
    </div>
  );
}