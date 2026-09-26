import PDFDocument from 'pdfkit';

const FONT = 'Helvetica';
const FONT_B = 'Helvetica-Bold';
const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];

function conteudoBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

function baseDoc() {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 56, bottom: 64, left: 56, right: 56 },
    bufferPages: true
  });
  doc.font(FONT);
  doc.fillColor('#111');
  return doc;
}

function areaUtil(doc) {
  return {
    width: doc.page.width - doc.page.margins.left - doc.page.margins.right
  };
}

function quebraSeNecessario(doc, minBottom = 72) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y > bottom - minBottom) {
    doc.addPage();
  }
}

function linhasSeparadoras(doc) {
  doc.moveDown(0.6);
  const w = areaUtil(doc).width;
  const larguraCol = (w - 20) / 3;
  doc.text('', { continued: false });
  doc.x = doc.page.margins.left + 20;
  doc.text('Turma: ________________________________', { width: larguraCol, lineGap: 2 });
  doc.x = doc.page.margins.left + 20 + larguraCol + 10;
  doc.text('Atividade: ____________________________', { width: larguraCol, lineGap: 2 });
  doc.x = doc.page.margins.left + 20 + (larguraCol + 10) * 2;
  doc.text('Aluno(a): _____________________________', { width: larguraCol, lineGap: 2 });
  doc.x = doc.page.margins.left;
  doc.moveDown(0.8);
}

function desenhaNumeroPagina(doc) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const texto = String(i + 1);
    const largura = doc.widthOfString(texto, { font: FONT });
    doc.font(FONT).fillColor('#888')
      .text(texto, doc.page.width - doc.page.margins.right - largura / 2 - 12, doc.page.height - 32, {
        width: 24, align: 'center'
      });
    doc.fillColor('#111');
  }
}

function cabecalhoProva(doc, { titulo, professor, data }) {
  doc.font(FONT_B).fontSize(16).fillColor('#1e1b4b')
    .text(titulo || 'Questões de interpretação textual', { align: 'center' });
  doc.moveDown(0.4);
  doc.font(FONT).fontSize(10).fillColor('#444')
    .text(`Professor(a): ${professor || ''}    ·    Data: ${data || ''}`, { align: 'center' });
  doc.moveDown(0.8);
  doc.fillColor('#111');
}

function escreveQuestao(doc, q, i) {
  const w = areaUtil(doc).width;
  quebraSeNecessario(doc);
  doc.font(FONT_B).fontSize(11).fillColor('#111')
    .text(`${i + 1}. ${q.enunciado}`, { width: w, lineGap: 3 });
  doc.moveDown(0.3);

  const alternativas = Array.isArray(q.alternativas) ? q.alternativas : [];
  if (alternativas.length > 0) {
    doc.font(FONT).fontSize(10.5);
    alternativas.forEach((alt, j) => {
      quebraSeNecessario(doc);
      doc.text(`  ${LETRAS[j]}) ${alt}`, { width: w - 16, indent: 8, lineGap: 2 });
    });
    doc.moveDown(0.26);
  } else {
    doc.moveDown(0.2);
    doc.font(FONT).fontSize(10)
      .fillColor('#444')
      .text('  R.: ____________________________________________________', { width: w, lineGap: 4 });
    doc.fillColor('#111');
  }
  doc.moveDown(0.5);
}

function escreveTextoBase(doc, { texto, orientacao }) {
  const w = areaUtil(doc).width;
  if (!texto) return;
  doc.addPage();
  doc.font(FONT_B).fontSize(15).fillColor('#1e1b4b').text(texto.titulo, { width: w, lineGap: 4 });
  doc.font(FONT).fontSize(10).fillColor('#555')
    .text([texto.autor, texto.fonte].filter(Boolean).join(' · '), { width: w });
  doc.moveDown(0.6);
  doc.font(FONT).fontSize(11).fillColor('#111');
  String(texto.texto || '').split(/\n+/).filter(Boolean).map((p) => p.trim()).forEach((par) => {
    quebraSeNecessario(doc);
    doc.text(par, { width: w, lineGap: 6, align: 'justify' });
    doc.moveDown(0.45);
  });
  if (orientacao) {
    doc.moveDown(0.7);
    doc.font(FONT_B).text(orientacao, { width: w, lineGap: 3 });
  }
  doc.addPage();
}

function escreveGabarito(doc, questoes) {
  const w = areaUtil(doc).width;
  doc.addPage();
  doc.font(FONT_B).fontSize(15).fillColor('#1e1b4b')
    .text('GABARITO (para o professor)', { width: w });
  doc.moveDown(0.5);
  doc.font(FONT).fontSize(10.5).fillColor('#111');
  questoes.forEach((q, i) => {
    const alternativas = Array.isArray(q.alternativas) ? q.alternativas : [];
    const correta = alternativas.length
      ? `Letra ${LETRAS[Number(q.correta)] || '—'}`
      : 'Resposta dissertativa';
    quebraSeNecessario(doc);
    doc.font(FONT_B).text(`${i + 1}. ${correta}`, { width: w, lineGap: 3 });
    doc.font(FONT).fillColor('#444')
      .text(q.explicacao || '—', { width: w, lineGap: 3 });
    doc.moveDown(0.35);
    doc.fillColor('#111');
  });
}

export async function provaPDF({ titulo, professor, data, questoes, mostrarGabarito }) {
  const doc = baseDoc();
  cabecalhoProva(doc, { titulo, professor, data });
  linhasSeparadoras(doc);
  questoes.forEach((q, i) => escreveQuestao(doc, q, i));
  if (mostrarGabarito) escreveGabarito(doc, questoes);
  desenhaNumeroPagina(doc);
  doc.end();
  return conteudoBuffer(doc);
}

export async function textoPDF({ texto, questoes, professor, data, mostrarGabarito }) {
  const doc = baseDoc();
  cabecalhoProva(doc, { titulo: texto.titulo, professor, data });
  escreveTextoBase(doc, { texto, orientacao: texto.orientacao });
  questoes.forEach((q, i) => escreveQuestao(doc, q, i));
  if (mostrarGabarito) escreveGabarito(doc, questoes);
  desenhaNumeroPagina(doc);
  doc.end();
  return conteudoBuffer(doc);
}

export function nomeArquivo(nome) {
  const limpo = String(nome || 'arquivo')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .slice(0, 60);
  return `${limpo || 'arquivo'}.pdf`;
}

export function respostaPdf(res, buf, nome) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo(nome)}"`);
  res.setHeader('Content-Length', buf.length);
  res.end(buf);
}

export async function redacaoPDF({ redacao }) {
  const doc = baseDoc();
  const w = areaUtil(doc).width;
  const r = redacao;
  const res = r.resultado || {};
  const estat = res.estatisticas || {};

  const quem = r.aluno?.nome
    || (r.grupo ? `${r.grupo.nome}${r.grupo.alunos?.length ? ` (${r.grupo.alunos.map((a) => a.nome).join(', ')})` : ''}` : '')
    || '—';

  doc.font(FONT_B).fontSize(16).fillColor('#1e1b4b').text('Relatório de correção da redação', { align: 'center' });
  doc.moveDown(0.6);
  doc.font(FONT).fontSize(11).fillColor('#111');
  doc.text(`Título: ${r.titulo || 'Redação'}`, { width: w });
  doc.text(`Aluno(a)/Grupo: ${quem}`, { width: w });
  doc.text(`Nota final: ${r.nota_final ?? '—'} de 10`, { width: w });
  if (r.created_at) doc.text(`Corrigida em: ${String(r.created_at).slice(0, 10)}`, { width: w });
  doc.moveDown(0.6);

  doc.font(FONT_B).text(`Estatísticas: ${estat.palavras ?? 0} palavras · ${estat.paragrafos ?? 0} parágrafos · ${estat.sentencas ?? 0} frases · vocabulário único ${estat.palavras_unicas ?? 0} · repetição ${estat.repeticao_ratio ?? 0}%`, { width: w });

  if (res.aviso) {
    doc.moveDown(0.5);
    doc.font(FONT_B).fillColor('#b45309').text(`Aviso: ${res.aviso}`, { width: w });
    doc.fillColor('#111');
  }
  if (res.resumo) {
    doc.moveDown(0.5);
    doc.font(FONT_B).text('Resumo da avaliação', { width: w });
    doc.font(FONT).text(res.resumo, { width: w, lineGap: 3 });
  }

  if (res.competencias?.length) {
    doc.moveDown(0.6);
    doc.font(FONT_B).text('Competências (1 a 5)', { width: w });
    doc.font(FONT);
    for (const c of res.competencias) {
      quebraSeNecessario(doc);
      doc.text(`• ${c.nome}: ${typeof c.nota === 'number' ? c.nota.toFixed(1) : c.nota}${c.comentario ? ` — ${c.comentario}` : ''}`, { width: w, lineGap: 3 });
    }
  }

  const coesao = res.coesao || {};
  if (coesao.score !== undefined || coesao.avaliacao || coesao.problemas?.length) {
    doc.moveDown(0.6);
    quebraSeNecessario(doc);
    doc.font(FONT_B).text(`Coesão: ${coesao.score ?? 0}/10`, { width: w });
    if (coesao.avaliacao) doc.font(FONT).text(coesao.avaliacao, { width: w, lineGap: 3 });
    for (const p of coesao.problemas || []) {
      quebraSeNecessario(doc);
      doc.font(FONT).fillColor('#444')
        .text(`“${p.trecho}” — ${p.message}`, { width: w, lineGap: 3 });
      doc.fillColor('#111');
    }
  }

  const semantica = res.semantica || {};
  if (semantica.score !== undefined || semantica.avaliacao || semantica.problemas?.length) {
    doc.moveDown(0.6);
    quebraSeNecessario(doc);
    doc.font(FONT_B).text(`Semântica: ${semantica.score ?? 0}/10`, { width: w });
    if (semantica.avaliacao) doc.font(FONT).text(semantica.avaliacao, { width: w, lineGap: 3 });
    for (const p of semantica.problemas || []) {
      quebraSeNecessario(doc);
      doc.font(FONT).fillColor('#444')
        .text(`“${p.trecho}” — ${p.message}`, { width: w, lineGap: 3 });
      doc.fillColor('#111');
    }
  }

  if (res.ortografia?.length) {
    doc.moveDown(0.6);
    quebraSeNecessario(doc);
    doc.font(FONT_B).text(`Ortografia e gramática (${res.ortografia.length})`, { width: w });
    doc.font(FONT).fontSize(8.5);
    for (const m of res.ortografia) {
      quebraSeNecessario(doc);
      const trecho = String(r.texto || '').slice(m.start, m.end) || m.trecho || '';
      doc.text(`• “${trecho}” — ${m.message}${m.replacements?.length ? ` → sugerido: ${m.replacements.join(', ')}` : ''} (${m.categoria || 'info'})`, { width: w, lineGap: 2 });
    }
  }

  doc.addPage();
  doc.font(FONT_B).fontSize(11).fillColor('#1e1b4b').text('Produção do aluno', { width: w });
  doc.moveDown(0.5);
  doc.font(FONT).fontSize(10.5).fillColor('#111');
  String(r.texto || '').split(/\n+/).filter(Boolean).map((p) => p.trim()).forEach((par) => {
    quebraSeNecessario(doc);
    doc.text(par, { width: w, lineGap: 5, align: 'justify' });
    doc.moveDown(0.4);
  });

  desenhaNumeroPagina(doc);
  doc.end();
  return conteudoBuffer(doc);
}