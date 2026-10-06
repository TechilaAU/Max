// Product catalogue.
// At build time products come from Salesforce when SF_* env vars are set, otherwise from src/data/products.json
// (which `npm run pull:legacy` fills from the old WooCommerce store).
// Images are NOT stored in Salesforce: they live in /public/images/products/<slug>/ and Salesforce only holds the slug
// (or an explicit path in Primary_Image_Path__c).
import localProducts from '../data/products.json';
import { hasPublic } from './assets';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export type Product = {
  slug: string;
  name: string;
  sku: string;
  categories: string[];
  package?: boolean;
  exHire?: boolean;
  summary?: string;
  description?: string;
  buyPrice?: number | null;
  hirePrice?: number | null; // per week
  inStock?: boolean;
  specs?: Record<string, string>;
  images: string[];
  infoSheet?: string | null;
};

// TODO: confirm field API names in the Max org before switching this on.
const SF_FIELDS = {
  slug: 'Web_Slug__c',
  categories: 'Web_Categories__c',      // multi-select picklist of category slugs
  hirePrice: 'Hire_Weekly_Price__c',
  showOnWeb: 'Show_On_Website__c',
  exHire: 'Ex_Hire__c',
  isPackage: 'Is_Package__c',
  summary: 'Web_Summary__c',
  imagePath: 'Primary_Image_Path__c',
};

const slugify = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

async function fromSalesforce(): Promise<Product[] | null> {
  const { SF_LOGIN_URL, SF_CLIENT_ID, SF_CLIENT_SECRET } = process.env;
  if (!SF_LOGIN_URL || !SF_CLIENT_ID || !SF_CLIENT_SECRET) return null;
  try {
    const tok = await fetch(`${SF_LOGIN_URL}/services/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: SF_CLIENT_ID, client_secret: SF_CLIENT_SECRET }),
    }).then((r) => r.json());
    if (!tok.access_token) throw new Error(JSON.stringify(tok));
    const f = SF_FIELDS;
    const soql = `SELECT Id, Name, ProductCode, Description, ${f.slug}, ${f.categories}, ${f.hirePrice}, ${f.exHire}, ${f.isPackage}, ${f.summary}, ${f.imagePath},
      (SELECT UnitPrice FROM PricebookEntries WHERE Pricebook2.IsStandard = true AND IsActive = true LIMIT 1)
      FROM Product2 WHERE IsActive = true AND ${f.showOnWeb} = true ORDER BY Name`;
    const out: Product[] = [];
    let url = `${tok.instance_url}/services/data/v62.0/query?q=${encodeURIComponent(soql)}`;
    while (url) {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${tok.access_token}` } }).then((r) => r.json());
      if (!res.records) throw new Error(JSON.stringify(res));
      for (const r of res.records) {
        out.push({
          slug: r[f.slug] || slugify(r.Name),
          name: r.Name,
          sku: r.ProductCode || '',
          categories: (r[f.categories] || '').split(';').filter(Boolean),
          package: !!r[f.isPackage],
          exHire: !!r[f.exHire],
          summary: r[f.summary] || '',
          description: r.Description || '',
          buyPrice: r.PricebookEntries?.records?.[0]?.UnitPrice ?? null,
          hirePrice: r[f.hirePrice] ?? null,
          inStock: true,
          specs: {},
          images: r[f.imagePath] ? [r[f.imagePath]] : [],
        });
      }
      url = res.nextRecordsUrl ? `${tok.instance_url}${res.nextRecordsUrl}` : '';
    }
    console.log(`[catalogue] ${out.length} products from Salesforce`);
    return out;
  } catch (e) {
    console.warn('[catalogue] Salesforce fetch failed, using products.json:', e);
    return null;
  }
}

/** Add any images found in /public/images/products/<slug>/ (main first). */
function withImages(p: Product): Product {
  const dir = join(process.cwd(), 'public', 'images', 'products', p.slug);
  let found: string[] = [];
  if (existsSync(dir)) {
    found = readdirSync(dir)
      .filter((f) => /\.(webp|avif|jpe?g|png)$/i.test(f))
      .sort((a, b) => (a.startsWith('main') ? -1 : b.startsWith('main') ? 1 : a.localeCompare(b, undefined, { numeric: true })))
      .map((f) => `/images/products/${p.slug}/${f}`);
  }
  const listed = (p.images || []).filter((i) => hasPublic(i));
  return { ...p, images: [...new Set([...listed, ...found])] };
}

let cache: Product[] | null = null;
export async function getProducts(): Promise<Product[]> {
  if (cache) return cache;
  const sf = await fromSalesforce();
  cache = (sf ?? (localProducts as Product[])).map(withImages);
  return cache;
}

export async function productsFor(slug: string): Promise<Product[]> {
  const all = await getProducts();
  if (slug === 'hire') return all.filter((p) => p.hirePrice);
  if (slug === 'ex-hire-stock') return all.filter((p) => p.exHire);
  if (slug === 'packages') return all.filter((p) => p.package);
  return all.filter((p) => p.categories.includes(slug));
}

export const money = (n?: number | null) =>
  n == null ? '' : n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: n % 1 ? 2 : 0 });
