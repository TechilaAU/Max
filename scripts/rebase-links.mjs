// Post-build: prefix root-relative links with BASE_PATH (GitHub Pages project sites).
// No-op when BASE_PATH is unset or '/'. Astro already prefixes its own /_astro assets.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const base = (process.env.BASE_PATH || '/').replace(/\/$/, '');
if (!base) process.exit(0);

const esc = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const notBase = `(?!${esc.slice(1)}/)(?!/)`; // skip already-prefixed and protocol-relative
const rules = [
  [new RegExp(`((?:href|src|action|content)=["'])/${notBase}`, 'g'), `$1${base}/`],
  [new RegExp(`(url\\(["']?)/${notBase}`, 'g'), `$1${base}/`],
  [new RegExp(`(location\\.href\\s*=\\s*["'])/${notBase}`, 'g'), `$1${base}/`],
];

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p); else yield p;
  }
}
let n = 0;
for await (const f of walk('dist')) {
  if (!['.html', '.css', '.js'].includes(extname(f))) continue;
  const src = await readFile(f, 'utf8');
  const out = rules.reduce((s, [re, rep]) => s.replace(re, rep), src);
  if (out !== src) { await writeFile(f, out); n++; }
}
console.log(`rebase-links: prefixed ${base} in ${n} files`);
