import { descarca, descargaLista, taieLista, heroRow, inlineCompare, inlineBars } from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const d = JSON.parse(readFileSync('/tmp/bermo-dump.json'));
const byId = (id) => d.products.find((p) => p.id === id);
const url = (p) => (p.images || [])[0];

// cele 6 alegeri
const IDS = {
  samsung9: 'DCLH27YBM',
  heinner8: 'DTRPLMYBM',
  bosch: 'DGJ5KY2BM',
  samsung11: 'DWH95PYBM',
  slim7: 'DZGFKBYBM',
  tcl11: 'D5YSGRYBM',
};
const O = '/sites/bermo-work/public/imagini/articole/cele-mai-bune-masini-de-spalat-rufe';
const PROD = '/sites/bermo-work/public/imagini/produse';

// 1) carduri produs 600x600 webp (fundal alb, contain, sharpen)
for (const [k, id] of Object.entries(IDS)) {
  const src = await descarca(url(byId(id)));
  await sharp({ create: { width: 600, height: 600, channels: 4, background: '#ffffff' } })
    .composite([{ input: await sharp(src).resize(560, 560, { fit: 'inside', background: '#ffffff' }).flatten({ background: '#ffffff' }).toBuffer(), gravity: 'center' }])
    .webp({ quality: 88 }).toFile(`${PROD}/${id}.webp`);
  console.log('produs', id);
}

// imagini locale (cache) pentru compunere
const imgs = {};
for (const [k, id] of Object.entries(IDS)) imgs[k] = await descarca(url(byId(id)));

// 2) HERO (fara text) — rand egal de masini care umplu cadrul (taiate de margini albe)
const heroImg = await taieLista([imgs.bosch, imgs.samsung9, imgs.tcl11], 0.03);
await heroRow({ imagini: heroImg, out: `${O}/hero.webp`, w: 1400, h: 560 });

// 3) INLINE compare — 3 bugete
await inlineCompare({ items: [
  { src: imgs.heinner8, nume: 'Heinner 8 kg', valoare: '1.580 lei · 4.6★', sub: 'buget, full-size, inverter' },
  { src: imgs.samsung9, nume: 'Samsung 9 kg', valoare: '1.899 lei · 4.7★', sub: 'alegerea noastra, EcoBubble' },
  { src: imgs.bosch, nume: 'Bosch 8 kg', valoare: '2.499 lei · 4.6★', sub: 'liniste si constructie' },
], caption: 'Trei masini bune pe trei bugete. Diferenta nu e doar pretul, ci cat de des speli si cata liniste vrei', out: `${O}/top3.webp` });

// 4) INLINE bars — capacitate
await inlineBars({ titlu: 'Capacitate, comparata', unitate: 'kilograme rufe uscate — cate persoane acopera lejer', data: [
  { src: imgs.tcl11, nume: 'TCL FF1124SA0', valoare: 11, eticheta: '11 kg' },
  { src: imgs.samsung11, nume: 'Samsung 11 kg', valoare: 11, eticheta: '11 kg' },
  { src: imgs.samsung9, nume: 'Samsung 9 kg', valoare: 9, eticheta: '9 kg' },
  { src: imgs.bosch, nume: 'Bosch 8 kg', valoare: 8, eticheta: '8 kg' },
  { src: imgs.heinner8, nume: 'Heinner 8 kg', valoare: 8, eticheta: '8 kg' },
  { src: imgs.slim7, nume: 'Heinner slim 7 kg', valoare: 7, eticheta: '7 kg' },
], out: `${O}/capacitate.webp`, h: 680 });

console.log('gata', O);
