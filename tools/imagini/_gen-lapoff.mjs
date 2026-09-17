import * as G from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const d = JSON.parse(readFileSync('/tmp/bermo-dump.json'));
const byId = (id) => d.products.find((p) => p.id === id);
const url = (p) => (p.images || [])[0];
const IDS = {
  acerI5: 'DP38Q83BM', asusI3: 'DT0P8TYBM', lenovoI3: 'D0SQ3TYBM', asusI5: 'DXTVVY3BM',
  ideapadI5: 'D32TG3YBM', acerI7: 'DPTFLF3BM', aspire5: 'DQNGBKYBM', lenovoI7: 'DQ1HL7YBM',
};
const O = '/sites/bermo-work/public/imagini/articole/cele-mai-bune-laptopuri';
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

// HERO — grid 2x2 (celule late, potrivite pt laptopuri)
await G.heroGrid({ imagini: [R.acerI5, R.asusI5], out: `${O}/hero.webp` });

// INLINE 1 — stat: procesorul -> pentru ce
await G.inlineStat({ titlu: 'Ce procesor iti trebuie', items: [
  { src: R.asusI3, valoare: 'Core i3', eticheta: 'navigat, birou, film', nume: 'Sarcini de baza' },
  { src: R.acerI5, valoare: 'Core i5', eticheta: 'multitasking, uz general', nume: 'Echilibrul bun' },
  { src: R.lenovoI7, valoare: 'Core i7', eticheta: 'lucru intens, editare', nume: 'Putere maxima' },
], caption: 'Pentru majoritatea oamenilor, un i5 e alegerea echilibrata', out: `${O}/procesor.webp` });

// INLINE 2 — specs: 4 laptopuri pe niveluri
await G.inlineSpecs({ produse: [
  { src: R.asusI3, nume: 'ASUS VivoBook i3' }, { src: R.acerI5, nume: 'Acer Aspire i5' }, { src: R.acerI7, nume: 'Acer Aspire i7' }, { src: R.lenovoI7, nume: 'Lenovo V15 i7' },
], specs: [
  { eticheta: 'Procesor', valori: ['i3-1215U', 'i5-13420H', 'i7-13620H', 'i7-1355U'], hl: true },
  { eticheta: 'RAM', valori: ['8 GB', '16 GB', '16 GB', '16 GB'] },
  { eticheta: 'Stocare SSD', valori: ['512 GB', '512 GB', '1 TB', '512 GB'] },
  { eticheta: 'Ecran', valori: ['15,6" FHD', '15,6" FHD', '15,6" FHD', '15,6" FHD'] },
  { eticheta: 'Pret orientativ', valori: ['1.983', '2.499', '2.999', '4.199'] },
], caption: 'Toate au ecran de 15,6 inch Full HD; diferenta o fac procesorul, RAM-ul si SSD-ul', out: `${O}/comparatie.webp` });

// INLINE 3 — compare: 3 praguri
await G.inlineCompare({ items: [
  { src: R.asusI3, nume: 'ASUS VivoBook i3', valoare: '1.983 lei · 4.4★', sub: 'buget, student' },
  { src: R.acerI5, nume: 'Acer Aspire Lite i5', valoare: '2.499 lei · 4.6★', sub: 'alegerea noastra' },
  { src: R.lenovoI7, nume: 'Lenovo V15 i7', valoare: '4.199 lei · 4.7★', sub: 'lucru intens' },
], caption: 'Trei laptopuri bune pe trei bugete, de la student la lucru intens', out: `${O}/top3.webp` });

console.log('gata', O);
