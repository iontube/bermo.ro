import { descarca, taieLista, heroSpotlight, inlineRange, inlineVs, inlineChecklist } from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const cat = JSON.parse(readFileSync('/sites/bermo-work/research/emag-produse.json', 'utf8'));
const byId = (id) => cat.find((p) => p.id === id);
const url = (p) => ((p.images || [])[0] || '').replace(/&amp;/g, '&').split('?')[0];

const IDS = {
  zoopie: 'D72Z2RMBM',
  techstar: 'D6QVBXMBM',
  emos: 'DD277TMBM',
  lumina: 'D5DPQYYBM',
  zepo: 'D5Q1MXMBM',
  zimmo: 'DG6G0YYBM',
  eufy: 'DPQ06YYBM',
};
const NUME = {
  zoopie: 'sonerie-fara-fir-zoopie-ring',
  techstar: 'sonerie-wireless-techstar',
  emos: 'sonerie-wireless-emos-p5728',
  lumina: 'sonerie-wireless-cu-semnalizare-luminoasa',
  zepo: 'sonerie-wireless-zepo-doua-receptoare',
  zimmo: 'sonerie-video-zimmo-videoguest',
};
const O = '/sites/bermo-work/public/imagini/articole/sonerie-wireless-raza-declarata-si-raza-reala';
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

// HERO — heroSpotlight (nefolosit in ultimele 6): un model dominant si trei variante.
await heroSpotlight({
  imagini: await taieLista([imgs.zoopie, imgs.techstar, imgs.zepo, imgs.zimmo], 0.03),
  out: `${O}/sonerie-de-usa-fara-fir.webp`, w: 1400, h: 740,
});
console.log('hero sonerie-de-usa-fara-fir.webp');

// INLINE 1 — raza declarata, pe axa
await inlineRange({
  titlu: 'Raza declarata, video fata de clasica',
  unitate: 'metri declarati de producator, in camp liber',
  min: 0, max: 330,
  items: [
    { src: imgs.eufy, nume: 'eufy S220, video', valoare: 30, eticheta: '30 m' },
    { src: imgs.zimmo, nume: 'Zimmo, video', valoare: 150, eticheta: '150 m' },
    { src: imgs.techstar, nume: 'Techstar, clasica', valoare: 300, eticheta: '300 m' },
  ],
  caption: 'Toate cele patru modele sub 50 m din catalog sunt sonerii video pe WiFi.',
  out: `${O}/raza-declarata.webp`, w: 900, h: 480,
});
console.log('inline raza-declarata.webp');

// INLINE 2 — aceeasi sonerie, doua listari
await inlineVs({
  a: { src: imgs.zoopie, nume: 'Listarea ieftina', sub: '59,10 lei' },
  b: { src: imgs.zoopie, nume: 'Listarea scumpa', sub: '109,99 lei' },
  randuri: [
    { a: '260 m', eticheta: 'raza declarata', b: '260 m' },
    { a: '38', eticheta: 'melodii', b: '38' },
    { a: '85 dB', eticheta: 'volum maxim', b: '85 dB' },
    { a: 'IP44', eticheta: 'protectie buton', b: 'IP44' },
    { a: '1120', eticheta: 'recenzii', b: '1120' },
  ],
  caption: 'Acelasi model Zoopie RING, doua listari. Preturi verificate pe 4 august 2026.',
  out: `${O}/aceeasi-sonerie-doua-preturi.webp`, w: 900, h: 680,
});
console.log('inline aceeasi-sonerie-doua-preturi.webp');

// INLINE 3 — ce face fiecare tip
await inlineChecklist({
  produse: [
    { src: imgs.techstar, nume: 'Clasica in priza' },
    { src: imgs.emos, nume: 'Clasica pe baterie' },
    { src: imgs.zimmo, nume: 'Video cu ecran' },
    { src: imgs.eufy, nume: 'Video pe WiFi' },
  ],
  functii: [
    { eticheta: 'Merge fara internet', valori: [true, true, true, false] },
    { eticheta: 'Suna la pana de curent', valori: [false, true, true, true] },
    { eticheta: 'Vezi cine a sunat', valori: [false, false, true, true] },
    { eticheta: 'Raza peste 150 m', valori: [true, true, true, false] },
    { eticheta: 'Sub 100 de lei', valori: [true, true, false, false] },
  ],
  caption: 'Soneria video rezolva alta problema decat cea clasica si costa alti bani.',
  out: `${O}/clasica-sau-video.webp`, w: 880,
});
console.log('inline clasica-sau-video.webp');
