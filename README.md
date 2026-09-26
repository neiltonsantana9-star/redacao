# Redações — Corretor inteligente de redações

Aplicativo web (PWA instalável) para **corrigir redações a partir da foto da folha**: o sistema reconhece o texto (OCR), identifica **erros ortográficos**, problemas de **coesão** e de **semântica**, e ainda mostra os **acertos** da produção. Também organiza **turmas**, **alunos** e **atividades individuais ou em grupo** sobre **gêneros textuais**.

## Funcionalidades

- 📸 **Foto ou upload da redação** — tira a foto pela câmera do celular/tablet ou envia uma imagem;
- 🔤 **Reconhecimento de texto (OCR)** — feito no navegador (Tesseract.js, modelo `por`), o texto aparece para revisão e só depois é analisado;
- 🔎 **Análise automática**:
  - **Ortografia e gramática** — via API pública do LanguageTool (gratuita, sem chave);
  - **Coesão** — conectivos usados, repetições de palavras e de abertura de frases, parágrafos sem articulação;
  - **Semântica** — vocabulário repetido, coloquialismos, imprecisões, períodos longos (e análise qualitativa por IA, se configurada);
  - **Acertos** — destaca o que está bom na produção;
- 🏫 **Turmas** — cadastro de turma, série, turno e gênero em foco;
- 👧 **Alunos** — cadastro individual ou **importação em massa** (um nome por linha);
- 📋 **Atividades** — individuais ou em grupo, com **formação de grupos** e escolha do **gênero textual** (narrativo, argumentativo, descritivo, expositivo, injuntivo, lírico, teatral);
- 🧾 **Nota final** — calculada (heurísticas + IA) e ajustável manualmente; competências mostradas de 1 a 5;
- 📊 **Estatísticas** — palavras, parágrafos, frases, vocabulário único, índice de repetição;
- 🧠 **Interpretação textual** — gera questões de interpretação sobre o texto de cada redação (com IA), mantém um **banco de questões por gênero textual** (múltipla escolha ou dissertativa, com gabarito comentado) e imprime/salva em PDF para os alunos responderem no papel;
- 📚 **Acervo de textos complexos** — textos autorais longos e desafiadores (conto, ensaio, poema, crônica descritiva e cena teatral) com **questões de interpretação já elaboradas** (estilo ENEM/vestibular: inferência, ironia, conotação, tese implícita), todos editáveis e com opção de **gerar mais questões por IA**;
- ⬇️ **Baixar PDF** — provas, questões, textos de interpretação e correções de redação geram um `.pdf` (A4, formatado para impressão, com gabarito comentado no final só para o professor);
- 📲 **Instalável (PWA)** — botão **"Baixar/Instalar o app"** instala no celular/tablet (Android, Chrome, iOS) e abre em tela cheia como aplicativo nativo;
- 🤖 **APK Android** — a página pública `/baixar` gera/baixa o `.apk` para instalar em qualquer celular Android (via PWABuilder);
- 🖨️ **Impressão** do resultado para entregar ao aluno.

## Como está o funcionamento da Análise

1. O texto (vindo do OCR) é enviado ao `/api/redacoes`.
2. O servidor consulta o **LanguageTool** (pt-BR) e devolve as ocorrências com posição no texto.
3. Heurísticas locais calculam score de **coesão** e **semântica**.
4. Se `AI_API_URL` e `AI_API_KEY` estiverem configuradas, a **IA** analisa coesão/semântica e as **5 competências**; caso contrário o sistema usa apenas as heurísticas (e informa no resultado). Com `MOCK_AI=1` há uma IA "fake" local para testar o fluxo sem chave.

## Stack

| Camada  | Tecnologias |
| ------- | ----------- |
| Backend | Node.js 24 · Express · SQLite (`node:sqlite`, zero setup) |
| Análise | LanguageTool (público) + heurísticas locais + IA (OpenAI-compatível, opcional) |
| OCR     | Tesseract.js (no navegador) |
| Frontend| React 18 · Vite · React Router · PWA (manifest + service worker) |
| Auth    | JWT + cookie HttpOnly |

## Como rodar

Pré-requisitos: **Node.js 22+**.

```bash
npm install

# Cria conta demo com turma, alunos, atividade e redação já corrigida
npm run seed

# Desenvolvimento (API em :4020 + Vite em :5173 com proxy /api)
npm run dev
```

- Em desenvolvimento acesse **http://localhost:5185** (porta própria do projeto — não conflita com os outros apps que usam a 5173).
- Em produção: `npm run build && npm start` e acesse **http://localhost:4020** (o Express serve a SPA + API na mesma origem).

### Conta demo

- **E-mail:** `professor@escola.com`
- **Senha:** `prof123`

### Questões de interpretação

1. Entre em **Turmas** → turma → redação corrigida (ou o menu **Banco de questões**);
2. Em **Gerar questões** escolha a quantidade e clique em **"Gerar"** — a IA cria questões de interpretação sobre aquele texto (múltipla escolha com gabarito comentado; com `MOCK_AI=1` usa a IA local de teste);
3. O professor pode **editar/excluir** cada questão ou revisá-las no **Banco de questões** (filtros por gênero, nível e busca);
4. **Imprimir / PDF** — as questões saem em folha A4 para os **alunos responderem no papel**, com opção de imprimir o **gabarito** embaixo ou em folha separada.

### Textos complexos de interpretação

O menu **Textos de interpretação** traz um acervo de leitura difícil (o seed grava 5 textos: narração com narrador não confiável, ensaio argumentativo, poema, crônica descritiva e cena teatral — cada um com 5 questões autorais):

1. Abra o texto e revise as **questões** ou gere as suas com IA (**🤖 Gerar**);
2. **Imprimir texto + questões** sai em folha A4 com o texto base na frente (fonte serifada, justificado) e as questões numeradas — gabarito comentado fica no final, **apenas para o professor**;
3. Use **+ Novo texto** para montar seu próprio acervo (cole o texto e depois crie questões pelo botão "+ Nova questão" dela);
4. Ao **excluir** um texto, as questões dele são apagadas junto.

O banco já vem com **16 questões de exemplo** dos principais gêneros (narrativo, argumentativo, descritivo, expositivo, injuntivo, poético e teatral).

### Baixar / instalar o app (página pública `/baixar`)

1. **Instalar no celular/tablet (PWA)** — o botão **"📲 Baixar / Instalar o app"** (na tela de login, no painel e na página `/baixar`) instala o app em tela cheia. No Android o Chrome oferece o botão sozinho (menu ⋮ → *Instalar aplicativo*); no iPhone/iPad use *Compartilhar* → *Adicionar à Tela de Início*;
2. **Baixar APK Android** — na página `/baixar`, o botão **"⬇️ Gerar e baixar o APK (PWABuilder)"** abre o gerador gratuito já preenchido com o endereço do app; lá é só clicar em *Start* → *package for Android* → *Generate package* → *Download* (obtém o `.apk` para instalar em qualquer Android);
3. **Baixar PDFs** — dentro do painel, cada prova, questão, texto e correção tem o botão **"⬇️ Baixar PDF"** (gera A4 com gabarito no final, só para o professor). A página `/baixar` também mostra um **QR code** para abrir o app em outro aparelho.

## Configuração (arquivo `.env` na raiz do projeto)

| Variável | Descrição |
| -------- | --------- |
| `PORT` | Porta do servidor (padrão `4020`) |
| `JWT_SECRET` | Segredo do JWT (defina em produção) |
| `DB_PATH` | Caminho do SQLite (padrão `server/data/redacoes.db`) |
| `LANGUAGETOOL_URL` | Endpoint do LanguageTool (padrão `https://api.languagetool.org/v2/check`) |
| `AI_API_URL` / `AI_API_KEY` / `AI_MODEL` | IA para coesão/semântica/competências — qualquer API compatível com OpenAI: `https://api.openai.com/v1` + `gpt-4o-mini`, DeepSeek, Ollama (`http://localhost:11434/v1`) etc. |
| `MOCK_AI` | `1` = usa análise de IA "fake" local (teste sem chave) |
| `SEED_EMAIL` / `SEED_SENHA` | Credenciais criadas pelo `npm run seed` |
| `CORS_ORIGINS` | Origens separadas por vírgula (ex.: `http://localhost:5185`) |
| `TRUST_PROXY` | `1` = o servidor fica atrás de proxy (ex.: Railway), necessário para HTTPS/cookies corretos |
| `AUTH_COOKIE_SECURE` | `1` = cookie de sessão só via HTTPS (recomendado em produção) |
| `ALLOW_REGISTER` | `0` = desativa cadastro público (acesso restrito só ao professor) |

## Estrutura

```
redacoes/
├── package.json          # workspaces + scripts
├── server/src/
│   ├── index.js          # Express: API + SPA (produção)
│   ├── config.js         # variáveis de ambiente
│   ├── db.js             # SQLite (node:sqlite)
│   ├── utils.js          # sentenças, tokens, conectivos…
│   ├── seed.js           # conta demo + dados
│   ├── middleware/       # auth (JWT/cookie), errorHandler
│   ├── routes/           # auth, turmas (com alunos), atividades, redações, perguntas, textos
│   └── services/
│       ├── perguntas.service.js  # banco de questões + geração por redação
│       ├── textos.service.js     # acervo de textos + geração de questões por texto
│       ├── pdf.service.js        # geração de PDFs (prova, texto, correção) com pdfkit
│       └── analise/      # ortografia (LanguageTool), heurísticas de
│                          # coesão/semântica, IA (também gera questões), composição do resultado
└── client/
    ├── public/           # manifest PWA, ícones PNG/SVG, service worker
    ├── scripts/          # gen-icons.mjs (geração dos ícones do PWA com sharp)
    └── src/
        ├── pages/        # Login, Dashboard, Turmas, TurmaDetalhe,
        │                  # AtividadeForm, RedacaoCaptura (foto+OCR), RedacaoResultado,
        │                  # BancoQuestoes, QuestoesImpressao, TextosAcervo, Baixar
        ├── components/   # Navbar, HighlightedText, InstallButton
        └── constants.js / api.js / context/AuthContext.jsx
```

## API

| Método | Rota | Descrição |
| ------ | ---- | --------- |
| POST | `/api/auth/register` | Cria conta de professor(a) |
| POST | `/api/auth/login` | Login (cookie + token no corpo) |
| POST | `/api/auth/logout` | Sair |
| GET  | `/api/auth/me` | Usuário logado |
| GET  | `/api/turmas` | Lista turmas (com contagens) |
| POST | `/api/turmas` | Cria turma |
| GET/PUT/DELETE | `/api/turmas/:id` | Turma (detalhe inclui alunos e atividades) |
| GET/POST/PUT/DELETE | `/api/turmas/:id/alunos` | Alunos da turma |
| POST | `/api/turmas/:id/alunos/importar` | Importa alunos (um nome por linha) |
| GET/POST | `/api/atividades/turma/:turmaId` | Atividades da turma |
| GET/PUT/DELETE | `/api/atividades/:id` | Atividade (com grupos de alunos) |
| GET/POST | `/api/redacoes` | Redações (POST analisa e salva) |
| GET/PUT/DELETE | `/api/redacoes/:id` | Redação / ajuste de nota |
| GET | `/api/redacoes/turma/:turmaId` e `/atividade/:atividadeId` | Listas de redações |
| GET | `/api/perguntas` | Banco de questões (filtros `genero`, `nivel`, `busca`, `ids`, `texto_id`) |
| GET/PUT/DELETE | `/api/perguntas/:id` | Questão do banco |
| GET | `/api/perguntas/por-redacao/:redacaoId` | Questões geradas para uma redação |
| GET | `/api/perguntas/por-texto/:textoId` | Questões de um texto do acervo |
| POST | `/api/perguntas` | Cria questão manualmente (aceita `textoId` para ligá-la a um texto) |
| POST | `/api/perguntas/redacao/:redacaoId/gerar` | Gera questões com IA (substitui as anteriores da redação) |
| GET | `/api/textos` | Acervo de textos (filtros `genero`, `nivel`, `busca`) |
| GET/PUT/DELETE | `/api/textos/:id` | Texto do acervo (DELETE apaga as questões ligadas) |
| GET | `/api/textos/:id/questoes` | Questões de um texto |
| POST | `/api/textos/:id/gerar` | Gera questões com IA para o texto (substitui as geradas anteriores) |
| POST | `/api/textos` | Cria texto no acervo |
| GET | `/api/perguntas/pdf?ids=1,2,3&gabarito=1` | Baixa PDF da prova (questões selecionadas) |
| GET | `/api/textos/:id/pdf?gabarito=1` | Baixa PDF do texto + questões |
| GET | `/api/redacoes/:id/pdf` | Baixa PDF do relatório de correção |

O resultado de cada correção fica em `redacao.resultado` (JSON): `ortografia[]`, `coesao{}`, `semantica{}`, `competencias[]`, `estatisticas{}`, `nota` e `resumo`.

## Publicar (Railway — público na internet)

O app é um **único serviço** (o Express serve a SPA + API na mesma origem), então nublar é direto — sem CORS nem cookies cross-site. O repositório já tem **Dockerfile** pronto.

### Passo a passo no Railway

1. **Git e GitHub** — com o projeto versionado no GitHub:
   ```bash
   git init && git add -A && git commit -m "app publico"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/redacoes.git
   git push -u origin main
   ```
2. **Crie o projeto** em [railway.app](https://railway.app) → *New Project* → *Deploy from GitHub repo* → escolha o repositório → *Deploy now*.
3. **Variáveis** (aba *Variables* → *New Variable*):
   - `JWT_SECRET` — uma senha longa qualquer (ex.: 64 caracteres aleatórios);
   - `DB_PATH=/data/redacoes.db` — aponta o SQLite para o volume persistente;
   - `TRUST_PROXY=1` e `AUTH_COOKIE_SECURE=1` — HTTPS correto atrás do proxy;
   - `ALLOW_REGISTER=0` — desativa o cadastro público (só o professor entra). Crie a conta com `npm run seed` no console do Railway.
   - *(IA)* `AI_API_URL` + `AI_API_KEY` para correção/geração de questões reais por IA (opcional).
4. **Volume persistente** (Settings do serviço → *Volumes* → *Add volume*) — monte em **`/data`** (assim o banco sobrevive a reinícios e deploys).
5. **Aguarde o deploy** (~2 min). O Railway fornece uma URL `https://redacoes-production-xxxx.up.railway.app` — publique-a ou defina um domínio próprio (Settings → *Networking* → *Generate Domain*). O healthcheck para o serviço é `GET /api/health`.
6. **Seed inicial** — no Railway, abra o *Deployments* → Menu do deploy (⋮) → *Redeploy with previous image* não serve; rode o seed uma vez com a aba *Shell/Console*: `npm run seed`. (Crie o usuário com `SEED_EMAIL`/`SEED_SENHA` via variáveis ou registre pela própria tela de login.)

> A partir daí **qualquer pessoa** abre a URL pública e vê a tela de entrada; quem tem acesso ao painel usa como no seu computador — inclusive **instalar o app (PWA)**, **baixar o APK** e **baixar PDFs** da página `/baixar`.

> **Local/HTTPS com a câmera ao vivo:** na rede local o tablet/celular usa `http://IP_do_PC:4020` — tudo funciona, exceto a **câmera ao vivo** do navegador (que pede HTTPS). No Railway o app já nasce com HTTPS, então a câmera funciona normalmente.

## Testes utilitários

- `node server/test-analise.mjs` — valida o motor de análise (login + texto bom/ruim) sem servidor;
- `node server/test-questoes.mjs` — valida o gerador de questões (mock) sem servidor;
- `node server/test-perguntas-api.mjs` — valida a API de questões de ponta a ponta (requer servidor em `:4020`);
- `node server/test-textos-api.mjs` — valida o acervo de textos + questões ligadas (requer servidor em `:4020`);
- `node server/smoke-test.mjs` — valida a API HTTP de ponta a ponta (requer o servidor rodando em `:4020`).