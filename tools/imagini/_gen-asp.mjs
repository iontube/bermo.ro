import * as G from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const d = JSON.parse(readFileSync('/tmp/bermo-dump.json'));
const byId = (id) => d.products.find((p) => p.id === id);
const url = (p) => (p.images || [])[0];
const IDS = {
  dyson: 'D6KWLDYBM', xiaomi: 'DB8RLFYBM', xpert: 'DJB4LXMBM', bosch: 'D13NJLMBM',
  seve: 'D7DLN03BM', dual: 'D39K2ZBBM', daewoo: 'DRD1VXMBM', xforce: 'D39Y45MBM',
};
const O = '/sites/bermo-work/public/imagini/articole/cele-mai-bune-aspiratoare-verticale';
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

// HERO — offset (2 suprapuse, editorial)
const [dy, xi] = await G.taieLista([R.dyson, R.xiaomi], 0.03);
await G.heroOffset({ imagini: [dy, xi], out: `${O}/hero.webp` });

// INLINE 1 — compare: 3 bugete
await G.inlineCompare({ items: [
  { src: R.daewoo, nume: 'Daewoo 9 in 1', valoare: '365 lei · 4.3★', sub: 'buget, multe accesorii' },
  { src: R.xiaomi, nume: 'Xiaomi G20 Lite', valoare: '465 lei · 4.5★', sub: 'alegerea noastra' },
  { src: R.dyson, nume: 'Dyson V8 Absolute', valoare: '1.899 lei · 4.5★', sub: 'premium, brand' },
], caption: 'Trei aspiratoare bune pe trei bugete, de la accesibil la premium', out: `${O}/top3.webp` });

// INLINE 2 — bars: autonomie pe o incarcare
await G.inlineBars({ titlu: 'Autonomie pe o incarcare', unitate: 'minute (mod normal)', data: [
  { src: R.dual, nume: 'Rowenta Dual Force', valoare: 75, eticheta: '75 min' },
  { src: R.xiaomi, nume: 'Xiaomi G20 Lite', valoare: 45, eticheta: 'pana la 45 min' },
  { src: R.dyson, nume: 'Dyson V8 Absolute', valoare: 40, eticheta: '40 min' },
  { src: R.daewoo, nume: 'Daewoo 9 in 1', valoare: 30, eticheta: '30 min' },
  { src: R.seve, nume: 'SeveShop P11 Pro', valoare: 15, eticheta: '15 min' },
], out: `${O}/autonomie.webp` });

// INLINE 3 — vs: premium Dyson vs buget Xiaomi (ai nevoie de Dyson?)
await G.inlineVs({
  a: { src: R.dyson, nume: 'Dyson V8 Absolute', sub: '1.899 lei' },
  b: { src: R.xiaomi, nume: 'Xiaomi G20 Lite', sub: '465 lei' },
  randuri: [
    { eticheta: 'Autonomie', a: '40 min', b: 'pana la 45 min' },
    { eticheta: 'Putere', a: '425 W', b: '215 W' },
    { eticheta: 'Filtrare', a: 'HEPA completa', b: 'Buna' },
    { eticheta: 'Pret', a: '1.899 lei', b: '465 lei' },
  ], caption: 'Dyson castiga la putere si constructie; Xiaomi, la pret si autonomie', out: `${O}/dyson-vs-buget.webp` });

console.log('gata', O);
