// Render one data-driven Reel: node scripts/reel.mjs <Composition> <props.json>
// Expects a fresh bundle in out/bundle (the `npm run reel` script bundles first).
// Output: out/reels/<YYYY-MM-DD>-<props basename>.mp4 (+ .txt caption if props.caption is set).
// --caption-only writes just the .txt, no render.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const COMPS = ['MythFact', 'Checklist', 'Quiz', 'EventList'];
const captionOnly = process.argv.includes('--caption-only');
const [comp, propsFile] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!COMPS.includes(comp) || !propsFile) {
  console.error(`usage: npm run reel -- <${COMPS.join('|')}> <props.json>`);
  process.exit(1);
}
const propsPath = path.resolve(propsFile);
const props = JSON.parse(fs.readFileSync(propsPath, 'utf8'));
// --props is merged over the Studio defaultProps, so an omitted optional field would leak the
// example text. Blank them explicitly.
for (const k of { MythFact: ['source'], Checklist: ['footnote'], EventList: ['subtitle'], Quiz: [] }[comp]) props[k] ??= '';
const resolvedProps = path.join('out', 'reels', `.props-${process.pid}.json`);

const date = new Date().toISOString().slice(0, 10);
const out = path.join('out', 'reels', `${date}-${path.basename(propsPath, '.json')}.mp4`);
fs.mkdirSync(path.dirname(out), { recursive: true });

// Copy-paste caption next to the video (props.caption; the templates ignore it).
if (props.caption) {
  fs.writeFileSync(out.replace(/\.mp4$/, '.txt'), props.caption.trim() + '\n');
  console.log(`✔ ${out.replace(/\.mp4$/, '.txt')}`);
}
if (captionOnly) process.exit(0);
fs.writeFileSync(resolvedProps, JSON.stringify(props));

const r = spawnSync('npx', ['remotion', 'render', 'out/bundle', comp, out, `--props=${path.resolve(resolvedProps)}`,
  '--codec', 'h264', '--crf', '18', '--audio-codec', 'aac', '--timeout=90000'], { stdio: 'inherit' });
fs.rmSync(resolvedProps, { force: true });
if (r.status === 0) console.log(`\n✔ ${out}`);
process.exit(r.status ?? 1);
