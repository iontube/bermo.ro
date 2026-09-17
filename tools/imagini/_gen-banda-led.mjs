import { descarca, taieLista, heroHalo, inlineCompare, inlineBars, inlineChecklist } from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const cat = JSON.parse(readFileSync('/sites/bermo-work/research/emag-produse.json', 'utf8'));
const byId = (id) => cat.find((p) => p.id === id);
const url = (p) => ((p.images || [])[0] || '').replace(/&amp;/g, '&').split('?')[0];

const IDS = {
  zafit10: 'DL1PDFMBM',
  zafit5: 'D9CG1DYBM',
  l930: 'DKHLDZMBM',
  l920: 'DWVDP9MBM',
  seve: 'DC0YQCMBM',
  l900: 'DW6QPXMBM',
  bare: 'DQ0T0PYBM',
  galaxia: 'DWG07HYBM',
};
const NUME = {
  zafit10: 'banda-led-zafit-10-metri',
  zafit5: 'banda-led-zafit-5-metri-bluetooth',
  l930: 'banda-led-rgbwic-tapo-l930',
  l920: 'banda-led-rgbic-tapo-l920',
  seve: 'banda-led-seveshop-doua-role',
  l900: 'banda-led-rgb-tapo-l900',
  bare: 'bare-luminoase-led-elindor',
};
const O = '/sites/bermo-work/public/imagini/articole/banda-led-rgb-sau-cu-alb-dedicat';
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

// HERO — heroHalo (nefolosit in ultimele 6). Poza cea mai curata din lot, fara cutie si fara telefon.
await heroHalo({
  imagine: (await taieLista([imgs.l900], 0.03))[0],
  out: `${O}/banda-luminoasa-pentru-camera.webp`, w: 1400, h: 700,
});
console.log('hero banda-luminoasa-pentru-camera.webp');

// INLINE 1 — cele trei feluri de banda si ce inseamna pentru alb
await inlineCompare({
  items: [
    { src: imgs.l900, nume: 'RGB', valoare: 'alb din amestec', sub: 'toata banda are aceeasi culoare in acelasi timp' },
    { src: imgs.l920, nume: 'RGBIC', valoare: 'alb din amestec', sub: 'culori diferite pe zone, dar tot fara cip alb' },
    { src: imgs.l930, nume: 'RGBWIC', valoare: 'cip alb separat', sub: 'al patrulea led face albul, pe langa culori' },
  ],
  caption: 'Din 20 de benzi verificate in catalog, doua au cip alb separat.',
  out: `${O}/rgb-rgbic-rgbw.webp`, w: 900, h: 560,
});
console.log('inline rgb-rgbic-rgbw.webp');

// INLINE 2 — wati pe metru, calculati din putere si lungime
await inlineBars({
  titlu: 'Wati pe metru, calculati din ce declara fisa',
  unitate: 'putere declarata impartita la lungimea declarata',
  imagini: false,
  data: [
    { nume: 'ZAFIT 10 m, 60 W', valoare: 6, eticheta: '6 W/m' },
    { nume: 'SeveShop 2 x 5 m, 60 W', valoare: 6, eticheta: '6 W/m' },
    { nume: 'Gosund 2,8 m, 16 W', valoare: 5.7, eticheta: '5,7 W/m' },
    { nume: 'Tapo L920, 5 m, 20,5 W', valoare: 4.1, eticheta: '4,1 W/m' },
    { nume: 'Tapo L900, 5 m, 13,5 W', valoare: 2.7, eticheta: '2,7 W/m' },
    { nume: 'GALAXIA 20 m, 14 W', valoare: 0.7, eticheta: '0,7 W/m' },
  ],
  out: `${O}/wati-pe-metru.webp`, w: 900, h: 560,
});
console.log('inline wati-pe-metru.webp');

// INLINE 3 — nicio banda nu le are pe toate
await inlineChecklist({
  produse: [
    { src: imgs.zafit10, nume: 'ZAFIT 10 m' },
    { src: imgs.l920, nume: 'Tapo L920' },
    { src: imgs.l930, nume: 'Tapo L930' },
    { src: imgs.seve, nume: 'SeveShop' },
  ],
  functii: [
    { eticheta: 'Cip alb separat', valori: [false, false, true, false] },
    { eticheta: 'Zone de culoare independente', valori: [false, true, true, false] },
    { eticheta: 'Clasa IP cu cifra', valori: [true, false, false, true] },
    { eticheta: 'Rezista la stropi, IP65', valori: [false, false, false, true] },
  ],
  caption: 'Niciuna dintre cele 20 de benzi din catalog nu le bifeaza pe toate patru.',
  out: `${O}/ce-bifeaza-fiecare.webp`, w: 880,
});
console.log('inline ce-bifeaza-fiecare.webp');
