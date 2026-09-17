import * as G from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const d = JSON.parse(readFileSync('/tmp/bermo-dump.json'));
const byId = (id) => d.products.find((p) => p.id === id);
const url = (p) => (p.images || [])[0];
const IDS = {
  a54: 'DF74N6MBM', a56: 'DXVQ4K3BM', pixel: 'DR6QNDYBM', iphone13: 'DQFCMXMBM',
  s24fe: 'DTZDRQYBM', s25: 'DXQVXGYBM', iphone16: 'DHY67LYBM', s25ultra: 'D2RVXGYBM',
};
const O = '/sites/bermo-work/public/imagini/articole/cele-mai-bune-telefoane';
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

// HERO — trio (centru dominant = flagship)
const [a, b, c] = await G.taieLista([R.a56, R.s25ultra, R.iphone16], 0.03);
await G.heroTrio({ imagini: [a, b, c], out: `${O}/hero.webp` });

// INLINE 1 — compare: 3 praguri de pret (branduri mixte)
await G.inlineCompare({ items: [
  { src: R.a54, nume: 'Samsung Galaxy A54', valoare: '1.799 lei · 4.5★', sub: 'buget-mediu' },
  { src: R.iphone13, nume: 'Apple iPhone 13', valoare: '2.899 lei · 4.8★', sub: 'iPhone accesibil' },
  { src: R.s25ultra, nume: 'Samsung S25 Ultra', valoare: '4.482 lei · 4.7★', sub: 'premium, top' },
], caption: 'Trei telefoane bune pe trei praguri, de la mediu accesibil la flagship', out: `${O}/top3.webp` });

// INLINE 2 — specs: 4 modele pe niveluri
await G.inlineSpecs({ produse: [
  { src: R.a54, nume: 'Galaxy A54' }, { src: R.iphone13, nume: 'iPhone 13' }, { src: R.s25, nume: 'Galaxy S25' }, { src: R.s25ultra, nume: 'S25 Ultra' },
], specs: [
  { eticheta: 'Ecran', valori: ['6,4"', '6,1"', '6,2"', '6,9"'] },
  { eticheta: 'RAM', valori: ['8 GB', '4 GB', '12 GB', '12 GB'] },
  { eticheta: 'Baterie', valori: ['5000 mAh', '~3240 mAh', '4000 mAh', '5000 mAh'] },
  { eticheta: 'Camera principala', valori: ['50 MP', '12 MP', '50 MP', '200 MP'], hl: true },
  { eticheta: 'Pret orientativ', valori: ['1.799', '2.899', '3.410', '4.482'] },
], caption: 'Numarul mare de MP nu inseamna mereu poze mai bune; conteaza si procesarea', out: `${O}/comparatie.webp` });

// INLINE 3 — vs: iPhone vs Android (decizia clasica)
await G.inlineVs({
  a: { src: R.iphone16, nume: 'iPhone (iOS)', sub: 'de la ~2.900 lei' },
  b: { src: R.a56, nume: 'Samsung / Android', sub: 'de la ~1.800 lei' },
  randuri: [
    { eticheta: 'Sistem', a: 'iOS, simplu', b: 'Android, flexibil' },
    { eticheta: 'Pret de intrare', a: 'Mai mare', b: 'Mai accesibil' },
    { eticheta: 'Personalizare', a: 'Limitata', b: 'Extinsa' },
    { eticheta: 'Actualizari', a: 'Multi ani', b: 'Tot mai multi ani' },
  ], caption: 'iPhone castiga la simplitate si suport lung; Android, la pret si libertate', out: `${O}/iphone-vs-android.webp` });

console.log('gata', O);
