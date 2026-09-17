import { descarca, taie, taieLista, heroDuo, inlineVs, inlineBars } from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const cat = JSON.parse(readFileSync('/sites/bermo-work/research/emag-produse.json', 'utf8'));
const byId = (id) => cat.find((p) => p.id === id);
const url = (p) => ((p.images || [])[0] || '').replace(/&amp;/g, '&').split('?')[0];

const IDS = {
  p115: 'DX4PBLMBM',
  p110: 'D3R2M9MBM',
  p110x2: 'DCM0C5MBM',
  p100: 'DC3TRGBBM',
  p100x4: 'DYFW6MMBM',
  termostat: 'DV5P9JYBM',
  seveshop: 'D9V541YBM',
  gosund: 'DCXGYFMBM',
};
const NUME = {
  p115: 'priza-inteligenta-tp-link-tapo-p115',
  p110: 'priza-smart-tp-link-tapo-p110',
  p110x2: 'pachet-2-prize-smart-tp-link-tapo-p110',
  p100: 'priza-inteligenta-tp-link-tapo-p100',
  p100x4: 'pachet-4-prize-inteligente-tp-link-tapo-p100',
  termostat: 'priza-inteligenta-cu-termostat',
  seveshop: 'priza-smart-seveshop',
  gosund: 'pachet-2-prize-inteligente-gosund-sp1',
};
const O = '/sites/bermo-work/public/imagini/articole/priza-inteligenta-pentru-boiler-si-aer-conditionat';
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

// HERO — heroDuo: exact comparatia din articol, 10A fata de 16A
// fara taieLista: imaginile eMAG sunt randari de marketing cu cutie si telefon, iar decupajul
// le face sa depaseasca tile-ul
await heroDuo({
  imagini: await taieLista([imgs.p100, imgs.p115], 0.04),
  out: `${O}/priza-wifi-cu-monitorizare.webp`, w: 1400, h: 700,
});
console.log('hero priza-wifi-cu-monitorizare.webp');

// INLINE 1 — 10A vs 16A, fata in fata (inlineVs, nefolosit recent)
await inlineVs({
  a: { src: imgs.p100, nume: '10 amperi', sub: 'Tapo P100' },
  b: { src: imgs.p115, nume: '16 amperi', sub: 'Tapo P115' },
  randuri: [
    { eticheta: 'Putere maxima nominala', a: '2300 W', b: '3680 W' },
    { eticheta: 'Sarcina continua recomandata', a: '1840 W', b: '2900 W' },
    { eticheta: 'Boiler de 80 de litri', a: 'la limita', b: 'da' },
    { eticheta: 'Convector electric', a: 'nu', b: 'da' },
    { eticheta: 'Aer conditionat 12000 BTU', a: 'da', b: 'da' },
  ],
  caption: 'Din 42 de prize inteligente verificate, 28 sunt de 16A si 7 de 10A.',
  out: `${O}/amperaj.webp`, w: 1040, h: 730,
});
console.log('inline amperaj.webp');

// INLINE 2 — ce trage fiecare aparat, fata de cele doua praguri
// fara imagini: comparatia e intre aparate pe care nu le avem ca produse
await inlineBars({
  titlu: 'Cat trag aparatele pe care vrei sa le programezi',
  unitate: 'wati, in functionare',
  imagini: false,
  data: [
    { nume: 'Router, veioza, incarcator', valoare: 100, eticheta: 'sub 100 W' },
    { nume: 'Televizor, calculator', valoare: 300, eticheta: '100-300 W' },
    { nume: 'Aer conditionat 12000 BTU', valoare: 1400, eticheta: '800-1400 W' },
    { nume: 'Boiler 80 l', valoare: 2000, eticheta: '1500-2000 W' },
    { nume: 'Convector electric', valoare: 2500, eticheta: '2000-2500 W' },
  ],
  out: `${O}/consum-aparate.webp`, w: 1040, h: 520,
});
console.log('inline consum-aparate.webp');
