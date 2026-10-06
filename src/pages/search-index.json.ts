import { getProducts } from '../lib/catalogue';
export async function GET() {
  const items = (await getProducts()).map((p) => ({ s: p.slug, n: p.name, c: p.categories, h: p.hirePrice ?? null, b: p.buyPrice ?? null, i: p.images[0] ?? null, k: p.sku }));
  return new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json' } });
}
