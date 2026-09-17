import * as G from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const d = JSON.parse(readFileSync('/tmp/bermo-dump.json'));
const byId = (id) => d.products.find((p) => p.id === id);
const url = (p) => (p.images || [])[0];
const IDS = {
  happy: 'DX17W7MBM', previMed: 'DXK9G7BBM', dolce153: 'D0JR2ZBBM', dolce157: 'DHFR2ZBBM',
  waves: 'D4RZQ3MBM', ortop: 'DRSM1PYBM', edition: 'D81ZQ3MBM', bamboo: 'DSNQFWBBM',
};
const O = '/sites/bermo-work/public/imagini/articole/cele-mai-bune-saltele';
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

// HERO — duo (2 saltele fata in fata)
const [h1, h2] = await G.taieLista([R.happy, R.ortop], 0.03);
await G.heroDuo({ imagini: [h1, h2], out: `${O}/hero.webp` });

// INLINE 1 — stat: fermitatea -> pentru cine
await G.inlineStat({ titlu: 'Ce fermitate ti se potriveste', items: [
  { src: R.dolce157, valoare: 'Moale', eticheta: 'dormi pe o parte', nume: 'Se muleaza pe corp' },
  { src: R.happy, valoare: 'Medie', eticheta: 'universala', nume: 'Echilibru bun' },
  { src: R.previMed, valoare: 'Ferma', eticheta: 'spate/burta, peste 90 kg', nume: 'Suport maxim' },
], caption: 'Fermitatea potrivita tine cont de pozitia de somn si de greutate', out: `${O}/fermitate.webp` });

// INLINE 2 — specs: 4 saltele pe niveluri
await G.inlineSpecs({ produse: [
  { src: R.edition, nume: 'Best Sleep Edition' }, { src: R.dolce153, nume: 'Dolce 15+3' }, { src: R.happy, nume: 'Best Sleep Happy' }, { src: R.ortop, nume: 'Ortopedicus Plus' },
], specs: [
  { eticheta: 'Fermitate', valori: ['Ferma', 'Ferma', 'Medie', 'Medie'], hl: true },
  { eticheta: 'Inaltime', valori: ['16 cm', '19 cm', '20 cm', '26 cm'] },
  { eticheta: 'Miez', valori: ['Spuma + vata', 'Memory foam', 'Spuma', 'Bumbac bio'] },
  { eticheta: 'Pret orientativ', valori: ['507', '619', '1.040', '1.655'] },
], caption: 'Cu cat salteaua e mai inalta si mai naturala, cu atat urca pretul', out: `${O}/comparatie.webp` });

// INLINE 3 — range: pozitionare pe pret
await G.inlineRange({ titlu: 'Pozitionare pe pret', unitate: 'lei', min: 450, max: 1750, items: [
  { src: R.edition, nume: 'Best Sleep Edition', valoare: 507, eticheta: '507' },
  { src: R.dolce153, nume: 'Dolce 15+3', valoare: 619, eticheta: '619' },
  { src: R.happy, nume: 'Best Sleep Happy', valoare: 1040, eticheta: '1.040' },
  { src: R.waves, nume: 'Best Sleep Waves', valoare: 1310, eticheta: '1.310' },
  { src: R.ortop, nume: 'Ortopedicus Plus', valoare: 1655, eticheta: '1.655' },
], caption: 'De la saltele accesibile la premium naturale, inalte', out: `${O}/pret.webp` });

console.log('gata', O);
