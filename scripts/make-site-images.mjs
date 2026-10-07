// Build category tiles and photo slots from the pulled legacy images (run after npm run pull:legacy).
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const P = (slug) => `public/images/products/${slug}/main.webp`;
const L = (name) => `public/images/legacy/${name}.webp`;

// [category slug, source, 'cutout' = product on white (padded), 'photo' = fill the tile]
const categories = [
  ['mobility', P('aspire-xl-seat-walker-rollator-silver'), 'cutout'],
  ['bedroom', P('casero-vogue-electric-beds'), 'photo'],
  ['bathroom-toilet', P('etac-clean-mobile-shower-commode'), 'cutout'],
  ['chairs-seating', P('golden-rhea-power-lift-recliner'), 'cutout'],
  ['pressure-care', P('vicair-adjuster-02-wheelchair-seat-cushion-with-comfair-cover'), 'cutout'],
  ['patient-lifters', P('patient-lifter-liftaid320'), 'cutout'],
  ['daily-living-aids', P('arthrigrip-pro-reacher'), 'cutout'],
  ['kitchen', P('gilia-tipping-kettle'), 'photo'],
  ['personal-hygiene', P('carequip-bottom-wiper-buckingham'), 'cutout'],
  ['falls-prevention', P('conni-anti-slip-floor-mat-marthon-runner'), 'photo'],
  ['exercise-rehabilitation', P('actipro-folding-pedal-exerciser'), 'cutout'],
  ['bariatric', P('oscar-m5-bariatric-lift-chair-recliner'), 'cutout'],
  ['hire', L('showroom'), 'photo'],
  ['ex-hire-stock', L('showroom-pano-scaled'), 'photo'],
  ['packages', L('in-home-trials'), 'photo'],
];

// Old homepage banners are 1920x600 with a grey text panel on the left; the photo is the right half.
const banner = { left: 940, top: 0, width: 980, height: 600 };
const slots = [
  ['hero-delivery', L('max-home-trial-banner'), banner],
  ['showroom', L('showroom')],
  ['hire', L('in-home-trials')],
  ['delivery', L('314908295-566926402102800-343817170122518342-n')],
  ['referrers', L('bed-banner'), banner],
  ['imprest', L('cabinet-photo')],
  ['team', L('img-4452-scaled')],
  ['team-ot', L('max-home-page-ot-banner'), banner],
  ['team-service', L('max-home-page-panorama-banner'), banner],
  ['team-delivery', L('max-healthcare-van')],
  ['location-adelaide', L('panorama-showroom')],
];

await mkdir('public/images/categories', { recursive: true });
await mkdir('public/images/site', { recursive: true });

for (const [slug, src, mode] of categories) {
  const out = `public/images/categories/${slug}.webp`;
  if (mode === 'photo') {
    await sharp(src).resize(800, 400, { fit: 'cover' }).webp({ quality: 82 }).toFile(out);
  } else {
    const inner = await sharp(src).trim({ threshold: 12 }).resize(640, 330, { fit: 'inside', background: '#fff' }).flatten({ background: '#fff' }).toBuffer();
    await sharp({ create: { width: 800, height: 400, channels: 3, background: '#fff' } })
      .composite([{ input: inner, gravity: 'center' }]).webp({ quality: 82 }).toFile(out);
  }
  console.log('category', slug);
}

for (const [slot, src, crop] of slots) {
  let img = sharp(src).rotate();
  if (crop) img = img.extract(crop);
  await img.resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(`public/images/site/${slot}.webp`);
  console.log('slot', slot);
}
