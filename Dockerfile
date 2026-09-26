# Rodado no Railway (e em qualquer host Node 22)
FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV PORT=4020
EXPOSE 4020

# Banco SQLite no volume persistente (configurar volume em /data)
ENV DB_PATH=/data/redacoes.db

# Healthcheck usado pelo Railway
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||4020)+'/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["npm", "run", "start"]