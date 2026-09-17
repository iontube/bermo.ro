import * as G from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const d = JSON.parse(readFileSync('/tmp/bermo-dump.json'));
const byId = (id) => d.products.find((p) => p.id === id);
const url = (p) => (p.images || [])[0];
const IDS = {
  dahua: 'D58GRNYBM', lg24: 'DR0N0LYBM', tcl: 'DW6JF73BM', samsung: 'D04MTCYBM',
  aoc: 'DHH932MBM', lgqhd: 'D5GH21YBM', arzopa: 'DRQBXNYBM', dell: 'DXDSNPMBM',
};
const O = '/sites/bermo-work/public/imagini/articole/cele-mai-bune-monitoare';
const PROD = '/sites/bermo-work/public/imagini/produse';
mkdirSync(O, { recursive: true });

for (const id of Object.values(IDS)) {
  const src = await G.descarca(url(byId(id)));
  await sharp({ create: { width: 600, height: 600, channels: 4, background: '#ffffff' } })
    .composite([{ input: await sharp(src).resize(560, 560, { fit: 'inside', background: '#ffffff' }).flatten({ background: '#ffffff' }).toBuffer(), gravity: 'center' }])
    .webp({ quality: 88 }).toFile(`${PROD}/${id}.webp`);
  console.log('produs', id);
}

const R = {};
for (const [k, id] of Object.entries(IDS)) R[k] = await G.descarca(url(byId(id)));

// HERO — grid 2x2 (celule late, potrivite pt monitoare)
await G.heroGrid({ imagini: [R.lg24, R.samsung], out: `${O}/hero.webp` });

// INLINE 1 — specs: 4 monitoare pe niveluri (rata refresh evidentiata)
await G.inlineSpecs({ produse: [
  { src: R.dahua, nume: 'Dahua 27" office' }, { src: R.lg24, nume: 'LG UltraGear 24"' }, { src: R.lgqhd, nume: 'LG UltraGear 27"' }, { src: R.dell, nume: 'Dell curbat 27"' },
], specs: [
  { eticheta: 'Diagonala', valori: ['27"', '24"', '27"', '27"'] },
  { eticheta: 'Rezolutie', valori: ['Full HD', 'Full HD', 'QHD (2K)', 'QHD (2K)'] },
  { eticheta: 'Rata refresh', valori: ['100 Hz', '180 Hz', '180 Hz', '165 Hz'], hl: true },
  { eticheta: 'Panel', valori: ['IPS', 'IPS', 'Nano IPS', 'VA curbat'] },
  { eticheta: 'Pret orientativ', valori: ['470', '673', '1.201', '1.820'] },
], caption: 'Pentru office conteaza rezolutia si culorile; pentru gaming, rata de refresh', out: `${O}/comparatie.webp` });

// INLINE 2 — bars: rata de improspatare (spec cheie la gaming)
await G.inlineBars({ titlu: 'Rata de improspatare, comparata', unitate: 'Hz — cu cat mai mult, cu atat mai fluid la gaming', data: [
  { src: R.tcl, nume: 'TCL 25G64', valoare: 300, eticheta: '300 Hz' },
  { src: R.aoc, nume: 'AOC curbat 31.5"', valoare: 240, eticheta: '240 Hz' },
  { src: R.lg24, nume: 'LG UltraGear 24"', valoare: 180, eticheta: '180 Hz' },
  { src: R.dell, nume: 'Dell curbat 27"', valoare: 165, eticheta: '165 Hz' },
  { src: R.dahua, nume: 'Dahua office 27"', valoare: 100, eticheta: '100 Hz' },
], out: `${O}/refresh.webp` });

// INLINE 3 — checklist: ce primesti pe niveluri
await G.inlineChecklist({ produse: [
  { src: R.dahua, nume: 'Dahua office' }, { src: R.lg24, nume: 'LG UltraGear' }, { src: R.dell, nume: 'Dell premium' },
], functii: [
  { eticheta: 'Rata mare pentru gaming (144 Hz+)', valori: [false, true, true] },
  { eticheta: 'Rezolutie QHD (2K)', valori: [false, false, true] },
  { eticheta: 'Ecran curbat, imersiv', valori: [false, false, true] },
  { eticheta: 'Sincronizare imagine (FreeSync)', valori: [false, true, true] },
], caption: 'Ce castigi pe masura ce urci de la office la gaming premium', out: `${O}/dotari.webp` });

console.log('gata', O);
