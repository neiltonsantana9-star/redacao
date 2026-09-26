import express from 'express';
import path from 'node:path';
import { existsSync } from 'node:fs';
import cors from 'cors';
import { PORT, CORS_ORIGINS, AUTH_COOKIE } from './config.js';
import { db } from './db.js';
import { setupCookies } from './middleware/errorHandler.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import turmasRoutes from './routes/turmas.routes.js';
import atividadesRoutes from './routes/atividades.routes.js';
import redacoesRoutes from './routes/redacoes.routes.js';
import perguntasRoutes from './routes/perguntas.routes.js';
import textosRoutes from './routes/textos.routes.js';

const app = express();
app.set('trust proxy', Number(process.env.TRUST_PROXY || (process.env.NODE_ENV === 'production' ? 1 : 0)));
app.use(cors({ origin: CORS_ORIGINS.length ? CORS_ORIGINS : true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
setupCookies(app, AUTH_COOKIE);

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET não definido — usando segredo de desenvolvimento (não usar em produção).');
}

app.get('/api/health', (req, res) => res.json({ ok: true, db: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/turmas', turmasRoutes);
app.use('/api/atividades', atividadesRoutes);
app.use('/api/redacoes', redacoesRoutes);
app.use('/api/perguntas', perguntasRoutes);
app.use('/api/textos', textosRoutes);

const CLIENT_DIST = path.join(import.meta.dirname, '..', '..', 'client', 'dist');
if (existsSync(path.join(CLIENT_DIST, 'index.html'))) {
  app.use(express.static(CLIENT_DIST));
  app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
}

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Redações API rodando em http://localhost:${PORT}`);
});