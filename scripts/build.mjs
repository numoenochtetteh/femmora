import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { applySocialMetadata, resolveSiteOrigin } from './metadata.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'dist');
const sourceFiles = ['index.html', 'app.js', 'catalog.js', 'styles.css', 'favicon.ico'];
const { products } = await import(new URL('../catalog.js', import.meta.url));
const requiredAssets = ['femmora-film.mp4', 'film-poster.jpg', 'femmora-wide-film.mp4', 'wide-film-poster.jpg', 'femmora-logo.png', 'femmora-share-logo.jpg', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png', 'fonts/dm-sans-400.woff', 'fonts/DM-Sans-OFL.txt', ...products.map((product) => product.image)];

for (const file of [...sourceFiles, ...requiredAssets.map((asset) => `assets/${asset}`)]) {
  const info = await stat(join(root, file));
  if (!info.isFile() || !info.size) throw new Error(`Missing or empty project file: ${file}`);
}
const html = await readFile(join(root, 'index.html'), 'utf8');
if (!html.includes('FEMMORA')) throw new Error('Unexpected entrypoint.');
const origin = resolveSiteOrigin();
const renderedHtml = applySocialMetadata(html, origin);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of sourceFiles) await cp(join(root, file), join(output, file));
await cp(join(root, 'assets'), join(output, 'assets'), { recursive: true });
await writeFile(join(output, 'index.html'), renderedHtml);
console.log(`Social preview origin: ${origin}`);
console.log('FEMMORA is ready. Deploy the dist folder, or run npm run preview.');
