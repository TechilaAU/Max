# Max Healthcare Equipment website

Astro static site for Max Healthcare Equipment (Adelaide). Rebuild of maxhealthcareequipment.com.au with the new brand look (Max Red #ED1B24, Max Charcoal #231F20, Max Grey #929296).

## Run it

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # outputs to dist/
```

Pushing to `main` deploys a preview to GitHub Pages (https://techilaau.github.io/Max/) via `.github/workflows/deploy.yml`.

## Pull images and products from the old site

The old host blocks cloud servers, so run this on your own machine:

```bash
npm run pull:legacy
```

- Products from the WooCommerce Store API go into `src/data/products.json`, with images saved to `public/images/products/<slug>/` as WebP.
- Every image in the WordPress media library goes into `public/images/legacy/` with a `manifest.json`. Copy the ones you want into the photo slots below.
- PDFs go to `.legacy-cache/pdfs/` (not published). Check them, rename and move them into `public/docs/` (see "Documents").
- **The old site is compromised** (spam injected into the homepage). The script re-encodes every image, only downloads image and PDF types, strips HTML from product text and lists any product that still looks suspicious. Check that list before publishing.

## Photo slots

Pages show a labelled placeholder until a file exists. Drop a `.webp` (or `.jpg`/`.png`) with these names into `public/images/site/`:

| Slot | Used on |
| --- | --- |
| `hero-delivery` | Homepage hero |
| `showroom` | Homepage, trials page |
| `hire` | How hire works |
| `delivery` | Delivery and collection |
| `referrers` | Referrers hub |
| `imprest` | Imprest cabinet |
| `team` | About |
| `team-ot`, `team-service`, `team-delivery` | Our team |
| `location-adelaide` | Adelaide location page |

Category tiles use `public/images/categories/<category-slug>.webp`. Funding logos: `public/images/brand/ndis.png`, `dva.png`, `support-at-home.png`.

## Documents

| Path | What |
| --- | --- |
| `public/docs/forms/` | `equipment-request-form-sa.pdf`, `equipment-request-form-sa-editable.pdf`, `dva-direct-order-form.pdf` |
| `public/docs/` | `max-equipment-brochure.pdf`, `equipment-catalogue.pdf` |
| `public/docs/info-sheets/` | File names listed in `src/data/infoSheets.ts` |

## Salesforce

**Products (build time).** Set `SF_LOGIN_URL`, `SF_CLIENT_ID`, `SF_CLIENT_SECRET` (repo secrets for GitHub Actions, or env vars on the host) and the build reads active Product2 records with `Show_On_Website__c = true`. Field API names are in `src/lib/catalogue.ts` (`SF_FIELDS`): confirm or create them in the org. Without the env vars it falls back to `src/data/products.json`.

**Images stay out of Salesforce.** Product images live in `public/images/products/<Web_Slug__c>/`. Salesforce only stores the slug, or an explicit path in `Primary_Image_Path__c`.

**Forms.** Every form posts to `/api/enquiry` (`functions/api/enquiry.js`, a Cloudflare Pages Function) which creates a web Case in Salesforce. Env vars: `SF_LOGIN_URL`, `SF_CLIENT_ID`, `SF_CLIENT_SECRET`, optional `SF_CASE_RECORD_TYPE_ID`, optional `NOTIFY_WEBHOOK`. On GitHub Pages the forms render but cannot submit; host on Cloudflare Pages (build `npm run build`, output `dist`) for the live site.

**Ordering.** Product pages link to `/order-request/` (creates an order Case) until the Salesforce checkout is designed.

## Where things live

| Path | What |
| --- | --- |
| `src/data/site.ts` | Phone, email, address, hours, portal URL, nav, testimonials |
| `src/data/categories.ts` | 12 categories plus Hire, Ex-hire stock and Packages filter pages |
| `src/data/locations.ts` | Service areas. Central Coast NSW is `draft: true` |
| `src/lib/catalogue.ts` | Salesforce product loader, JSON fallback, image discovery |
| `src/styles/global.css` | Brand tokens and shared styles |
| `src/layouts/Base.astro` | SEO head, schema, header, footer |
| `astro.config.mjs` | 301 redirects from old WooCommerce URLs |

## Before launch (search the code for `TODO`)

- [ ] Run `npm run pull:legacy`, review flagged products, fill photo slots and PDFs
- [ ] Confirm showroom address (Keswick vs Panorama) and opening hours in `site.ts`, then set `addressConfirmed: true`
- [ ] Hire portal URL in `site.ts`
- [ ] Delivery fees, NDIS provider number, RAP partner, Support at Home wording, imprest details
- [ ] Max to approve terms, returns and privacy wording
- [ ] Decide on merging the Central Coast site (flip `draft` in `locations.ts`)
- [ ] Salesforce fields, Connected App and Case routing for forms
- [ ] Host on Cloudflare Pages, point DNS, submit `sitemap-index.xml` in Search Console and request a review of the spam-hacked pages
