import { descarca, taie, taieLista, heroHalo, inlineBars, inlineStat } from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const cat = JSON.parse(readFileSync('/sites/bermo-work/research/emag-produse.json', 'utf8'));
const byId = (id) => cat.find((p) => p.id === id);
// ⛔ query-ul eMAG (?width=80&hash=..) da miniatura de 80px SI hash-ul e legat de dimensiune,
// deci nu poti doar sa cresti width. Se taie tot query-ul: URL-ul gol da originalul la rezolutie mare.
const url = (p) => ((p.images || [])[0] || '').replace(/&amp;/g, '&').split('?')[0];
const slug = (s) => s.split(',')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 52).replace(/-$/, '');

const IDS = {
  philips6: 'D2B503MBM',
  philips6ieftin: 'DZ2197BBM',
  osram3: 'D3F954BBM',
  philipsSenzor: 'DV1RYKMBM',
  osramSenzor: 'DS798TMBM',
  horoz: 'D27GWFMBM',
  hue: 'D38H843BM',
};
const NUME = {
  philips6: 'pachet-6-becuri-led-philips',
  philips6ieftin: 'set-6-becuri-led-philips',
  osram3: 'set-3-becuri-led-osram-base-classic-a100',
  philipsSenzor: 'bec-led-cu-senzor-de-lumina-philips',
  osramSenzor: 'bec-led-osram-led-star',
  horoz: 'bec-led-cu-senzor-de-miscare-horoz',
  hue: 'pachet-philips-hue-essential',
};
const O = '/sites/bermo-work/public/imagini/articole/cat-consuma-un-bec-led';
const PROD = '/sites/bermo-work/public/imagini/produse';

// 1) carduri produs 600x600 (fundal alb, contain)
const imgs = {};
for (const [k, id] of Object.entries(IDS)) {
  const src = await descarca(url(byId(id)));
  imgs[k] = src;
  const nume = `${NUME[k]}-${id.toLowerCase()}.webp`;
  await sharp({ create: { width: 600, height: 600, channels: 4, background: '#ffffff' } })
    .composite([{ input: await sharp(src).resize(560, 560, { fit: 'inside', background: '#ffffff' }).flatten({ background: '#ffffff' }).toBuffer(), gravity: 'center' }])
    .webp({ quality: 88 }).toFile(`${PROD}/${nume}`);
  console.log('produs', nume);
}

// 2) HERO fara text — heroHalo (nefolosit recent), becul cel mai eficient in centru
await heroHalo({ imagine: await taie(imgs.philipsSenzor, 0.03), out: `${O}/bec-led-e27.webp`, w: 1400, h: 700 });
console.log('hero bec-led-e27.webp');

// 3) INLINE 1 — cost pe an, LED vs economic vs incandescent (inlineBars, nefolosit recent)
// fara imagini: CFL si incandescentul nu exista ca produse in selectie, iar o poza de bec LED
// langa eticheta "Incandescent, 60 W" ar fi pur si simplu falsa
await inlineBars({
  titlu: 'Aceeasi lumina, trei tehnologii: cat platesti pe an',
  unitate: '3 ore pe zi, la 1,30 lei pe kWh',
  imagini: false,
  data: [
    { nume: 'LED, 10 W', valoare: 14, eticheta: '14 lei  ·  11 kWh' },
    { nume: 'Economic CFL, 15 W', valoare: 21, eticheta: '21 lei  ·  16 kWh' },
    { nume: 'Incandescent, 60 W', valoare: 85, eticheta: '85 lei  ·  66 kWh' },
  ],
  out: `${O}/consum-pe-an.webp`, w: 1040, h: 460,
});
console.log('inline consum-pe-an.webp');

// 4) INLINE 2 — eficienta masurata pe cele 42 de becuri, pe grupe
await inlineStat({
  titlu: 'Eficienta mediana, masurata pe 42 de becuri din catalog',
  items: [
    { src: imgs.philips6, valoare: '117', eticheta: 'lumeni pe watt', nume: 'Becuri simple' },
    { src: imgs.hue, valoare: '100', eticheta: 'lumeni pe watt', nume: 'Becuri inteligente' },
    { src: imgs.horoz, valoare: '96', eticheta: 'lumeni pe watt', nume: 'Becuri cu senzor' },
  ],
  caption: 'Becul inteligent nu consuma mai mult, dar costa de peste doua ori mai mult la raft.',
  out: `${O}/eficienta.webp`, w: 1040, h: 400,
});
console.log('inline eficienta.webp');
