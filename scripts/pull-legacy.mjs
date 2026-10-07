// Pull products, images and documents from the OLD WordPress/WooCommerce site.
// Run on your own machine (the old host blocks cloud servers):   npm run pull:legacy
//
// What it does
//   1. Products  -> src/data/products.json  (via the public WooCommerce Store API)
//   2. Product images -> public/images/products/<slug>/main.webp, 2.webp …  (re-encoded to WebP)
//   3. Media library images -> public/images/legacy/<name>.webp + public/images/legacy/manifest.json
//      Pick the ones you want and copy/rename them into public/images/site/<slot>.webp (see README for slot names).
//   4. PDFs (forms, catalogue, info sheets) -> .legacy-cache/pdfs/ (NOT published) for you to check and move.
//
// Safety: the old site has been compromised (injected spam). Everything is re-encoded with sharp (strips anything
// hidden in image files), only image/PDF types are downloaded, and product text is stripped of HTML. Products whose
// text still looks suspicious are listed at the end for a manual check.
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import sharp from 'sharp';

const SITE = process.env.LEGACY_URL || 'https://www.maxhealthcareequipment.com.au';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (url) => {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: '*/*' } });
    if (r.ok) return r;
    if (r.status === 400 || r.status === 404) return r;
    await sleep(1500 * (i + 1));
  }
  throw new Error(`Failed ${url}`);
};

// Old WooCommerce category slugs -> new category slugs
const CAT_MAP = {
  'mobility': 'mobility', 'electric-scooters-gophers': 'mobility', 'powered-wheelchairs': 'mobility', 'self-propelled-wheelchairs': 'mobility',
  'transit-wheelchairs': 'mobility', 'walkers': 'mobility', 'walking-aids': 'mobility', 'mobility-accessories': 'mobility',
  'bedroom': 'bedroom', 'bathroom-toilet': 'bathroom-toilet', 'chairs-seating': 'chairs-seating', 'chairs-kitchen': 'chairs-seating',
  'pressure-care': 'pressure-care', 'patient-lifters': 'patient-lifters', 'lifters': 'patient-lifters', 'slings': 'patient-lifters',
  'daily-living-aids': 'daily-living-aids', 'small-aids-personal-hygiene': 'daily-living-aids',
  'kitchen': 'kitchen', 'appliances': 'kitchen', 'cutlery': 'kitchen', 'kitchen-accessories': 'kitchen',
  'personal-hygiene': 'personal-hygiene', 'falls-prevention': 'falls-prevention',
  'exercise-rehabilitation': 'exercise-rehabilitation', 'braces': 'exercise-rehabilitation', 'exercise-equipment': 'exercise-rehabilitation', 'weights': 'exercise-rehabilitation',
  'bariatric-plus-size': 'bariatric', 'bariatric': 'bariatric',
  'bedroom-pressure-care-equipment': 'bedroom', 'electric-beds': 'bedroom', 'mattresses': 'bedroom', 'bed-accessories': 'bedroom', 'bedroom-furniture': 'bedroom',
  'air-mattresses': 'pressure-care', 'static-mattresses': 'pressure-care', 'foam-gel-cushions': 'pressure-care', 'air-cushions': 'pressure-care', 'comfort-care': 'pressure-care',
  'wheelchairs': 'mobility', 'electric-scooters': 'mobility', 'transfer-aids': 'mobility', 'ramps': 'mobility',
  'toileting': 'bathroom-toilet', 'bath-aids': 'bathroom-toilet', 'shower-chairs': 'bathroom-toilet', 'mobile-shower-commodes': 'bathroom-toilet', 'urinals': 'bathroom-toilet',
  'electric-recliners': 'chairs-seating', 'utility-chairs': 'chairs-seating', 'seating-accessories': 'chairs-seating',
  'dressing-aids': 'daily-living-aids', 'reaching-aids': 'daily-living-aids', 'clothing': 'daily-living-aids',
  'hygiene-accessories': 'personal-hygiene', 'safety': 'falls-prevention', 'exercise-and-rehabilitation': 'exercise-rehabilitation',
};
const SPAM = /(\bcialis|viagra|levitra|tadalafil|pharm|casino|betting|bookmaker|poker|loan|porn|crypto)/i;
const strip = (html = '') => html.replace(/\[maxbutton[^\]]*\]/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#8211;|&#8212;|&ndash;|&mdash;/g, '-').replace(/&#8217;|&rsquo;/g, "'")
  .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"').replace(/&#\d+;/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

async function saveImage(url, outPath, max = 1600) {
  const r = await get(url);
  const type = r.headers.get('content-type') || '';
  if (!r.ok || !type.startsWith('image/')) return false;
  const buf = Buffer.from(await r.arrayBuffer());
  await mkdir(join(outPath, '..'), { recursive: true });
  await sharp(buf).rotate().resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(outPath);
  return true;
}

async function pullProducts() {
  const products = [];
  const flagged = [];
  for (let page = 1; page < 100; page++) {
    const r = await get(`${SITE}/wp-json/wc/store/v1/products?per_page=100&page=${page}`);
    if (!r.ok) break;
    const batch = await r.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    for (const p of batch) {
      const cats = (p.categories || []).map((c) => c.slug);
      const unit = 10 ** (p.prices?.currency_minor_unit ?? 2);
      const price = p.prices?.price ? Number(p.prices.price) / unit : null;
      const isHire = cats.includes('hire');
      const summary = strip(p.short_description);
      const description = strip(p.description);
      if (SPAM.test(`${p.name} ${summary} ${description}`) || /https?:\/\//.test(description)) flagged.push(p.slug);
      const prod = {
        slug: p.slug, name: strip(p.name), sku: p.sku || '',
        categories: [...new Set(cats.map((c) => CAT_MAP[c]).filter(Boolean))],
        package: /package/i.test(p.name), exHire: cats.includes('sale-stock'),
        summary: summary.split('\n')[0].slice(0, 300), description,
        buyPrice: isHire ? null : price, hirePrice: isHire ? price : null,
        inStock: p.is_in_stock !== false, specs: {}, images: [], infoSheet: null,
        legacyId: p.id, legacyCategories: cats,
      };
      let n = 0;
      for (const img of p.images || []) {
        n++;
        const file = n === 1 ? 'main.webp' : `${n}.webp`;
        const out = join('public', 'images', 'products', p.slug, file);
        if (!existsSync(out)) {
          try { await saveImage(img.src, out); await sleep(150); } catch (e) { console.warn('  image failed', img.src); }
        }
      }
      products.push(prod);
      process.stdout.write(`\r  products: ${products.length}`);
    }
    await sleep(400);
  }
  console.log('');
  return { products, flagged };
}

async function pullMedia() {
  const manifest = [];
  const pdfs = [];
  for (let page = 1; page < 200; page++) {
    const r = await get(`${SITE}/wp-json/wp/v2/media?per_page=100&page=${page}`);
    if (!r.ok) break;
    const batch = await r.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    for (const m of batch) {
      const url = m.source_url;
      const mime = m.mime_type || '';
      const name = basename(url, extname(url)).toLowerCase().replace(/[^a-z0-9-]+/g, '-');
      if (mime.startsWith('image/') && !/svg/.test(mime)) {
        const out = join('public', 'images', 'legacy', `${name}.webp`);
        if (!existsSync(out)) { try { await saveImage(url, out, 2000); await sleep(120); } catch { continue; } }
        manifest.push({ file: `/images/legacy/${name}.webp`, alt: strip(m.alt_text || m.title?.rendered || ''), original: url });
      } else if (mime === 'application/pdf') {
        const out = join('.legacy-cache', 'pdfs', `${name}.pdf`);
        if (!existsSync(out)) {
          const pr = await get(url);
          if (pr.ok && (pr.headers.get('content-type') || '').includes('pdf')) {
            await mkdir(join(out, '..'), { recursive: true });
            await writeFile(out, Buffer.from(await pr.arrayBuffer()));
          }
        }
        pdfs.push({ file: out, title: strip(m.title?.rendered || name), original: url });
      }
      process.stdout.write(`\r  media: ${manifest.length} images, ${pdfs.length} PDFs`);
    }
    await sleep(400);
  }
  console.log('');
  await mkdir(join('public', 'images', 'legacy'), { recursive: true });
  await writeFile(join('public', 'images', 'legacy', 'manifest.json'), JSON.stringify(manifest, null, 2));
  await mkdir('.legacy-cache', { recursive: true });
  await writeFile(join('.legacy-cache', 'pdfs.json'), JSON.stringify(pdfs, null, 2));
}

console.log(`Pulling from ${SITE}`);
const { products, flagged } = await pullProducts();
if (products.length) {
  const path = join('src', 'data', 'products.json');
  const existing = JSON.parse(await readFile(path, 'utf8'));
  const bySlug = new Map(existing.map((p) => [p.slug, p]));
  for (const p of products) bySlug.set(p.slug, { ...bySlug.get(p.slug), ...p });
  await writeFile(path, JSON.stringify([...bySlug.values()], null, 2));
  console.log(`Wrote ${bySlug.size} products to ${path}`);
} else {
  console.log('No products returned. The Store API may be disabled; export products as CSV from WooCommerce instead.');
}
await pullMedia();
if (flagged.length) console.log(`\nCheck these products for injected spam text before publishing:\n  ${flagged.join('\n  ')}`);
console.log('\nDone. Review public/images/legacy/manifest.json and .legacy-cache/pdfs.json');
