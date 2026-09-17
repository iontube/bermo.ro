import { descarca, heroGrid, inlineCompare, inlineStat } from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const cat = JSON.parse(readFileSync('/sites/bermo-work/research/emag-produse.json', 'utf8'));
const byId = (id) => cat.find((p) => p.id === id);
const url = (p) => ((p.images || [])[0] || '').replace(/&amp;/g, '&').split('?')[0];

const IDS = {
  rfan5: 'DJNLRPMBM',
  rfan3: 'D9NLRPMBM',
  app: 'DR2YT5MBM',
  cercuri: 'DVH74ZMBM',
  e27_2: 'DZG5GJ3BM',
  spiral: 'DVHNJS3BM',
  candelabru: 'DTD88Q3BM',
  e27_5: 'DQG5GJ3BM',
};
const NUME = {
  rfan5: 'lustra-led-rfan-k137-5',
  rfan3: 'lustra-led-rfan-k137-3',
  app: 'lustra-led-dimabila-cu-telecomanda-si-aplicatie',
  cercuri: 'lustra-led-cu-telecomanda-dimabila-4-cercuri',
  e27_2: 'lustra-moderna-2-socluri-e27',
  spiral: 'lustra-tip-pendul-spiral-gold',
  candelabru: 'candelabru-modern-3-globuri-e27',
  e27_5: 'lustra-moderna-5-socluri-e27',
};
const O = '/sites/bermo-work/public/imagini/articole/lustra-cu-led-integrat-sau-cu-becuri-e27';
const PROD = '/sites/bermo-work/public/imagini/produse';

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

// HERO — heroGrid cu DOUA imagini (regula: heroGrid doar 2-4 pe un rand).
// Aici pozele de catalog sunt fotografii de camera, nu decupaje, iar asta e un avantaj:
// arata cele doua tabere din articol in context real. Fara decupaj, sunt fotografii intregi.
await heroGrid({
  imagini: [imgs.app, imgs.spiral],
  out: `${O}/lustra-moderna-living.webp`, w: 1400, h: 700,
});
console.log('hero lustra-moderna-living.webp');

// INLINE 1 — cele doua tabere in cifre (inlineStat)
await inlineStat({
  titlu: 'Cele 25 de lustre din catalog, pe tip de sursa',
  items: [
    { src: imgs.rfan5, valoare: '16', eticheta: 'din 25', nume: 'LED integrat, nu se schimba' },
    { src: imgs.e27_2, valoare: '9', eticheta: 'din 25', nume: 'Soclu E27, becul se schimba' },
  ],
  caption: 'Doar 9 din 25 declara cati lumeni dau, indiferent de tip.',
  out: `${O}/tip-de-sursa.webp`, w: 1040, h: 420,
});
console.log('inline tip-de-sursa.webp');

// INLINE 2 — ce primesti pe fiecare varianta (inlineCompare)
await inlineCompare({
  items: [
    { src: imgs.rfan5, nume: 'LED integrat', valoare: 'telecomanda, 3 temperaturi', sub: 'becuri incluse, dar cand cedeaza schimbi corpul' },
    { src: imgs.e27_2, nume: 'Soclu E27', valoare: 'becul se schimba oricand', sub: 'becuri separat, fara reglaj din cutie' },
  ],
  caption: 'Aceeasi camera, doua decizii diferite pentru urmatorii zece ani.',
  out: `${O}/led-integrat-sau-e27.webp`, w: 1040, h: 520,
});
console.log('inline led-integrat-sau-e27.webp');
