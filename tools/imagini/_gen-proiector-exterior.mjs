import { descarca, taieLista, heroOffset, inlineVs, inlineBars, inlineSpecs } from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const cat = JSON.parse(readFileSync('/sites/bermo-work/research/emag-produse.json', 'utf8'));
const byId = (id) => cat.find((p) => p.id === id);
const url = (p) => ((p.images || [])[0] || '').replace(/&amp;/g, '&').split('?')[0];

// 6 la 230 V + 4 solare. siks/stradala/inductie apar doar in figuri, nu au card.
const IDS = {
  lm50: 'D2Q7LDMBM',
  vtac100: 'DY8JZTYBM',
  lm10: 'D7Q7LDMBM',
  kol20: 'DL1RW4MBM',
  zen10: 'D52GBZMBM',
  lm20cald: 'DBQ7LDMBM',
  tiessa: 'DTKT5VMBM',
  seve: 'DTPLZ6MBM',
  lm30: 'D0Q7LDMBM',
  onetech: 'DS2JGRMBM',
  siks: 'D03YKHYBM',
  stradala: 'D0JM4LMBM',
  inductie: 'DRMZPKMBM',
  kol30: 'DPNMBCMBM',
  kol50: 'DD9MBCMBM',
};
const NUME = {
  lm50: 'proiector-slim-led-50w',
  vtac100: 'reflector-led-100w-v-tac',
  lm10: 'proiector-slim-led-10w',
  kol20: 'proiector-koloreno-20w',
  zen10: 'proiector-led-cu-senzor-10w',
  lm20cald: 'proiector-slim-led-20w-lumina-calda',
  tiessa: 'set-7-lampi-solare-tiessa',
  seve: 'lampa-solara-seveshop-reflector',
  lm30: 'proiector-slim-led-30w',
  onetech: 'lampa-solara-onetech-senzor',
};
const O = '/sites/bermo-work/public/imagini/articole/proiector-led-exterior-solar-sau-la-curent';
const PROD = '/sites/bermo-work/public/imagini/produse';

const imgs = {};
for (const [k, id] of Object.entries(IDS)) {
  const src = await descarca(url(byId(id)));
  imgs[k] = src;
  if (!NUME[k]) continue;
  const nume = `${NUME[k]}-${id.toLowerCase()}.webp`;
  await sharp({ create: { width: 600, height: 600, channels: 4, background: '#ffffff' } })
    .composite([{ input: await sharp(src).resize(560, 560, { fit: 'inside', background: '#ffffff' }).flatten({ background: '#ffffff' }).toBuffer(), gravity: 'center' }])
    .webp({ quality: 88 }).toFile(`${PROD}/${nume}`);
  console.log('produs', nume);
}

// HERO — heroOffset (nefolosit in ultimele 6). Proiectorul la 230 V in fata, lampa solara in spate:
// tema articolului e chiar alegerea intre cele doua.
await heroOffset({
  imagini: await taieLista([imgs.lm50, imgs.seve], 0.03),
  out: `${O}/reflector-de-curte.webp`, w: 1400, h: 720,
});
console.log('hero reflector-de-curte.webp');

// INLINE 1 — lumina pe watt, la proiectoarele alimentate la 230 V
await inlineBars({
  titlu: 'Aceeasi putere, alta cantitate de lumina',
  unitate: 'lumeni pe watt, din cifrele declarate in catalog',
  data: [
    { src: imgs.lm50, nume: 'LED Market slim, 50 W', valoare: 115, eticheta: '115 lm/W' },
    { src: imgs.zen10, nume: 'ZenLED cu senzor, 10 W', valoare: 90, eticheta: '90 lm/W' },
    { src: imgs.vtac100, nume: 'V-TAC cip Samsung, 100 W', valoare: 85, eticheta: '85 lm/W' },
    { src: imgs.kol30, nume: 'KOLORENO, 30 W', valoare: 72, eticheta: '72 lm/W' },
    { src: imgs.kol50, nume: 'KOLORENO, 50 W', valoare: 68, eticheta: '68 lm/W' },
  ],
  out: `${O}/lumeni-pe-watt.webp`, w: 900, h: 520,
});
console.log('inline lumeni-pe-watt.webp');

// INLINE 2 — ce iese cand imparti lumenii declarati la watii declarati, pe partea solara
await inlineSpecs({
  produse: [
    { src: imgs.siks, nume: 'SIKS, 120 COB' },
    { src: imgs.stradala, nume: 'Lampa stradala 6 COB' },
    { src: imgs.onetech, nume: 'OneTech' },
    { src: imgs.inductie, nume: 'SIKS cu inductie' },
  ],
  specs: [
    { eticheta: 'Flux declarat', valori: ['260 lm', '2880 lm', '1200 lm', '4500 lm'] },
    { eticheta: 'Putere declarata', valori: ['50 W', '30 W', '8 W', '1,5 W'] },
    { eticheta: 'Lumeni pe watt', valori: ['5', '96', '150', '3000'], hl: true },
    { eticheta: 'Clasa de protectie', valori: ['IP65', 'IP65 sau IP20', 'IP65', 'clasa A'] },
  ],
  caption: 'Cel mai bun LED alb de serie ajunge pe la 220 lm/W. Doua dintre coloane sunt peste.',
  out: `${O}/cifre-declarate.webp`, w: 880,
});
console.log('inline cifre-declarate.webp');

// INLINE 3 — aceiasi 50 W pe eticheta, doua lumi diferite
await inlineVs({
  a: { src: imgs.lm50, nume: 'Proiector la 230 V', sub: 'LED Market slim, 50 W' },
  b: { src: imgs.siks, nume: 'Lampa solara', sub: 'SIKS 120 COB, 50 W declarati' },
  randuri: [
    { a: '50 W', eticheta: 'putere declarata', b: '50 W' },
    { a: '5750 lm', eticheta: 'flux luminos', b: '260 lm' },
    { a: '115 lm/W', eticheta: 'lumina pe watt', b: '5 lm/W' },
    { a: '120°', eticheta: 'unghi fascicul', b: 'nedeclarat' },
    { a: 'continuu', eticheta: 'cat tine noaptea', b: '10 h declarate' },
  ],
  caption: 'Acelasi numar pe eticheta, de 22 de ori mai putina lumina promisa.',
  out: `${O}/fata-in-fata.webp`, w: 900, h: 640,
});
console.log('inline fata-in-fata.webp');
