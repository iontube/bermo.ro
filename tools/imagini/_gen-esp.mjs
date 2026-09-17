import * as G from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const d = JSON.parse(readFileSync('/tmp/bermo-dump.json'));
const byId = (id) => d.products.find((p) => p.id === id);
const url = (p) => (p.images || [])[0];
const IDS = {
  magS: 'D7NJTBMBM', capsule: 'DW0WN8BBM', espr: 'DRNJ4BBBM', p3300: 'DDPXSMYBM',
  p5500: 'DSJR7HYBM', p5400: 'D36163MBM', evo: 'DY9FC8MBM', start: 'DP4X4PYBM',
};
const O = '/sites/bermo-work/public/imagini/articole/cele-mai-bune-espressoare';
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

// HERO — spotlight (1 mare + 3 mici; espressoarele sunt inalte)
const [magS, p5500, cap, evo] = await G.taieLista([R.magS, R.p5500, R.capsule, R.evo], 0.03);
await G.heroSpotlight({ imagini: [magS, p5500, cap, evo], out: `${O}/hero.webp` });

// INLINE 1 — vs: capsule vs automat cu rasnita (prima decizie)
await G.inlineVs({
  a: { src: R.capsule, nume: 'Espressor cu capsule', sub: 'de la ~350 lei' },
  b: { src: R.magS, nume: 'Automat cu rasnita', sub: 'de la ~1.150 lei' },
  randuri: [
    { eticheta: 'Cafea', a: 'Capsule', b: 'Boabe proaspete' },
    { eticheta: 'Gust', a: 'Bun, constant', b: 'Superior, aromat' },
    { eticheta: 'Cost pe cafea', a: 'Mai mare', b: 'Mai mic' },
    { eticheta: 'Pret aparat', a: 'Mic', b: 'Mediu spre mare' },
  ], caption: 'Capsulele castiga la simplitate si pret initial; boabele, la gust si cost pe ceasca', out: `${O}/capsule-vs-automat.webp` });

// INLINE 2 — specs: 4 automate pe niveluri
await G.inlineSpecs({ produse: [
  { src: R.magS, nume: 'DeLonghi Magnifica S' }, { src: R.p3300, nume: 'Philips 3300' }, { src: R.p5500, nume: 'Philips 5500' }, { src: R.p5400, nume: 'Philips 5400' },
], specs: [
  { eticheta: 'Spumare lapte', valori: ['Manuala', 'Automata', 'Automata', 'Automata'], hl: true },
  { eticheta: 'Setari rasnita', valori: ['13', '12', '12', '12'] },
  { eticheta: 'Ecran', valori: ['LCD', 'Touch', 'Touch', 'Touch'] },
  { eticheta: 'Bauturi presetate', valori: ['4', '6', '8', '12'] },
  { eticheta: 'Pret orientativ', valori: ['1.500', '1.800', '2.245', '3.933'] },
], caption: 'Spumarea automata a laptelui e saltul care conteaza cel mai mult la cappuccino', out: `${O}/comparatie.webp` });

// INLINE 3 — range: pozitionare pe pret
await G.inlineRange({ titlu: 'Pozitionare pe pret', unitate: 'lei', min: 300, max: 4000, items: [
  { src: R.capsule, nume: 'Krups capsule', valoare: 356, eticheta: '356' },
  { src: R.espr, nume: 'Krups rasnita', valoare: 1150, eticheta: '1.150' },
  { src: R.magS, nume: 'Magnifica S', valoare: 1500, eticheta: '1.500' },
  { src: R.p5500, nume: 'Philips 5500', valoare: 2245, eticheta: '2.245' },
  { src: R.p5400, nume: 'Philips 5400', valoare: 3932, eticheta: '3.932' },
], caption: 'De la capsule accesibile la automate flagship cu multe bauturi', out: `${O}/pret.webp` });

console.log('gata', O);
