import cookieParser from 'cookie-parser';

export default function errorHandler(err, req, res, _next) {
  console.error('[erro]', err);
  if (res.headersSent) return;
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ ok: false, message: err.message || 'Erro interno no servidor' });
}

export function setupCookies(app, cookieName) {
  app.use(cookieParser(cookieName));
}