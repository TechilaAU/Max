import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** True when a file exists under /public. Used to show placeholders until real images or PDFs are added. */
export const hasPublic = (p?: string | null) => !!p && existsSync(join(process.cwd(), 'public', p.replace(/^\//, '')));

/** First existing path from a list of candidates (lets a .webp or .jpg be dropped in). */
export const firstPublic = (...paths: string[]) => paths.find((p) => hasPublic(p)) ?? null;

/** Site photo slots. Drop a file named <slot>.webp (or .jpg/.png) into public/images/site/ to replace the placeholder. */
export const sitePhoto = (slot: string) =>
  firstPublic(`/images/site/${slot}.webp`, `/images/site/${slot}.jpg`, `/images/site/${slot}.jpeg`, `/images/site/${slot}.png`);
