import { descarca, taieLista, heroTrio, inlineCompare, inlineBars, inlineSpecs } from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const cat = JSON.parse(readFileSync('/sites/bermo-work/research/emag-produse.json', 'utf8'));
const byId = (id) => cat.find((p) => p.id === id);
const url = (p) => ((p.images || [])[0] || '').replace(/&amp;/g, '&').split('?')[0];

const IDS = {
  lumiedge: 'D4GCWG3BM',
  homcom: 'DW6LHHMBM',
  zamo: 'DMVJ4VMBM',
  desi: 'DFM4YSYBM',
  maclean: 'DPWD8HMBM',
  smd36: 'DFNFRQBBM',
  kanarya: 'D9ZJMLBBM',
  toolight: 'DBPXKJYBM',
  echosoul: 'DM66CBYBM',
  veghe: 'D7R1W1MBM',
  senzor: 'DZ3LLYMBM',
};
const NUME = {
  lumiedge: 'lampadar-cu-rafturi-lumiedge',
  homcom: 'lampadar-dreptunghiular-homcom',
  zamo: 'lampadar-cu-doua-becuri-zamo',
  desi: 'lampadar-led-rgb-72desi',
  maclean: 'aplica-led-cu-senzor-maclean',
  smd36: 'aplica-led-smd-36w',
  kanarya: 'aplica-led-cu-intrerupator-kanarya',
  toolight: 'set-aplice-de-perete-toolight',
  echosoul: 'lampa-ambientala-echo-soul',
  veghe: 'lampa-de-veghe-cu-control-tactil',
  senzor: 'lampa-led-cu-senzor-de-miscare',
};
const O = '/sites/bermo-work/public/imagini/articole/lampadar-veioza-sau-aplica-de-perete';
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

// HERO — heroTrio (nefolosit in ultimele 6). Lampadarul inalt in centru, aplica si veioza pe laturi.
await heroTrio({
  imagini: await taieLista([imgs.maclean, imgs.homcom, imgs.veghe], 0.03),
  out: `${O}/lampa-de-podea-si-de-perete.webp`, w: 1400, h: 740,
});
console.log('hero lampa-de-podea-si-de-perete.webp');

// INLINE 1 — cele trei roluri, cu fluxul declarat
await inlineCompare({
  items: [
    { src: imgs.homcom, nume: 'Lampadar', valoare: '600 - 1500 lm', sub: 'lumina de fond, langa canapea sau fotoliu' },
    { src: imgs.maclean, nume: 'Aplica de perete', valoare: '570 - 2240 lm', sub: 'lumina pe o zona: hol, oglinda, cap de pat' },
    { src: imgs.veghe, nume: 'Veioza', valoare: '90 - 300 lm', sub: 'lumina de seara, nu lumineaza camera' },
  ],
  caption: 'Intervalele sunt cele declarate in catalog pentru fiecare tip de corp.',
  out: `${O}/trei-roluri.webp`, w: 900, h: 560,
});
console.log('inline trei-roluri.webp');

// INLINE 2 — cati lumeni cere fiecare camera (fara imagini: comparatia nu e intre produse)
await inlineBars({
  titlu: 'Cati lumeni cere fiecare camera',
  unitate: 'suprafata inmultita cu iluminarea recomandata',
  imagini: false,
  data: [
    { nume: 'Birou de acasa, 12 m²', valoare: 3600, eticheta: '3600 lm' },
    { nume: 'Living, 20 m²', valoare: 3000, eticheta: '3000 lm' },
    { nume: 'Bucatarie, 12 m²', valoare: 3000, eticheta: '3000 lm' },
    { nume: 'Baie, 6 m²', valoare: 1500, eticheta: '1500 lm' },
    { nume: 'Dormitor, 14 m²', valoare: 1400, eticheta: '1400 lm' },
    { nume: 'Hol, 6 m²', valoare: 600, eticheta: '600 lm' },
  ],
  out: `${O}/lumeni-pe-camera.webp`, w: 900, h: 560,
});
console.log('inline lumeni-pe-camera.webp');

// INLINE 3 — ce declara fisa si ce primesti de fapt
await inlineSpecs({
  produse: [
    { src: imgs.lumiedge, nume: 'LumiEdge' },
    { src: imgs.homcom, nume: 'Homcom' },
    { src: imgs.toolight, nume: 'Toolight, set 4' },
    { src: imgs.maclean, nume: 'Maclean' },
  ],
  specs: [
    { eticheta: 'Soclu', valori: ['E26, bec inclus', 'E27', 'E27', 'LED integrat'] },
    { eticheta: 'Wati pe fisa', valori: ['9 W', '40 W', '40 W', '10 W'] },
    { eticheta: 'Ce sunt watii', valori: ['consum real', 'maxim admis', 'maxim admis', 'consum real'] },
    { eticheta: 'Flux declarat', valori: ['800 lm', 'nedeclarat', '3500 lm', '850 lm'] },
    { eticheta: 'Lumina la cumparare', valori: ['800 lm', 'zero', 'zero', '850 lm'], hl: true },
  ],
  caption: 'Doua dintre ele se vand fara bec. Unul declara totusi 3500 de lumeni.',
  out: `${O}/ce-scrie-pe-fisa.webp`, w: 880,
});
console.log('inline ce-scrie-pe-fisa.webp');
