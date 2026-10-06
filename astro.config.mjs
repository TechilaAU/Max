import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Defaults = live domain at the root. GitHub Pages preview sets SITE_URL + BASE_PATH (see .github/workflows/deploy.yml).
const SITE = process.env.SITE_URL || 'https://www.maxhealthcareequipment.com.au';
const BASE = process.env.BASE_PATH || '/';

// Old WordPress / WooCommerce URLs -> new structure, so existing Google rankings carry over.
const legacy = {
  'mobility': 'mobility',
  'bathroom-toilet': 'bathroom-toilet',
  'bedroom': 'bedroom',
  'chairs-seating': 'chairs-seating',
  'kitchen': 'kitchen',
  'daily-living-aids': 'daily-living-aids',
  'personal-hygiene': 'personal-hygiene',
  'pressure-care': 'pressure-care',
  'patient-lifters': 'patient-lifters',
  'exercise-rehabilitation': 'exercise-rehabilitation',
  'falls-prevention': 'falls-prevention',
  'bariatric-plus-size': 'bariatric',
  'hire': 'hire',
  'sale-stock': 'ex-hire-stock',
};
const redirects = Object.fromEntries(
  Object.entries(legacy).map(([from, to]) => [`/product-category/${from}/`, `/equipment/${to}/`]),
);
redirects['/shop/'] = '/equipment/';
redirects['/my-account/'] = '/portal/';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  redirects,
  integrations: [
    sitemap({ filter: (p) => !p.includes('/thank-you/') && !p.includes('/product-category/') && !p.includes('/shop/') && !p.includes('/my-account/') }),
  ],
});
