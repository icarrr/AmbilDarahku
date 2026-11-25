// Save a static, script-free snapshot of the live landing page for the video iframe.
// The landing page is server-rendered, so plain fetch is enough (no headless browser).
//   SITE_URL=https://ambildarahku.vercel.app node scripts/snapshot.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, '..', 'snapshot');
const BASE = (process.env.SITE_URL || 'https://ambildarahku.vercel.app').replace(/\/$/, '');
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';

async function get(p, binary = false) {
  const res = await fetch(BASE + p, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${p}`);
  return binary ? Buffer.from(await res.arrayBuffer()) : res.text();
}
async function save(p) {
  const dest = path.join(OUT, decodeURIComponent(p));
  if (fs.existsSync(dest)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, await get(p, true));
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

let html = await get('/');
if (!html.includes('Temukan Donor Darah')) throw new Error('unexpected landing page (maintenance mode?)');

// stylesheets + the fonts they reference (relative ../media/ urls)
const css = [...new Set([...html.matchAll(/href="(\/_next\/static\/[^"]+\.css)"/g)].map((m) => m[1]))];
for (const p of css) {
  await save(p);
  const body = fs.readFileSync(path.join(OUT, p), 'utf8');
  const dir = path.posix.dirname(p);
  for (const m of body.matchAll(/url\(([^)"']+)\)/g)) {
    const u = m[1];
    if (u.startsWith('data:')) continue;
    await save(u.startsWith('/') ? u : path.posix.normalize(`${dir}/${u}`));
  }
}
for (const m of html.matchAll(/(?:src|href)="(\/(?:images\/[^"]+|favicon\.svg))"/g)) await save(m[1]);

html = html
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '') // no hydration, no API calls
  .replace(/<link[^>]*rel="(?:preload|modulepreload|preconnect|dns-prefetch)"[^>]*>/g, '')
  .replace(/(src|href)="\/(_next|images|favicon)/g, '$1="./$2')
  .replace(/<a ([^>]*?)href="([^"]*)"/g, '<a $1href="#" data-href="$2"') // clicks never navigate
  .replace(/ target="_blank"/g, '');
fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log(`snapshot of ${BASE}/ -> ${OUT} (${css.length} css)`);
