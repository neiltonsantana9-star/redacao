import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const src = path.join(publicDir, 'icon.svg');

async function main() {
  await sharp(src).resize(192, 192, { fit: 'contain' }).flatten({ background: '#1e1b4b' }).png().toFile(path.join(publicDir, 'icon-192.png'));
  await sharp(src).resize(512, 512, { fit: 'contain' }).flatten({ background: '#1e1b4b' }).png().toFile(path.join(publicDir, 'icon-512.png'));
  const glyph = await sharp(src).resize(380, 380, { fit: 'contain' }).flatten({ background: '#312e81' }).png().toBuffer();
  await sharp({ create: { width: 512, height: 512, channels: 4, background: '#312e81' } })
    .composite([{ input: glyph, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-512.png'));
  console.log('Ícones PWA gerados: icon-192.png, icon-512.png, icon-maskable-512.png');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});