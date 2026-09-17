import { descarca, taie, taieLista, heroMosaic, inlineChecklist, inlineRange } from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const cat = JSON.parse(readFileSync('/sites/bermo-work/research/emag-produse.json', 'utf8'));
const byId = (id) => cat.find((p) => p.id === id);
// query-ul eMAG da miniatura de 80px si hash-ul e legat de dimensiune: se taie tot
const url = (p) => ((p.images || [])[0] || '').replace(/&amp;/g, '&').split('?')[0];

const IDS = {
  becPir: 'DBSQN5BBM',
  becHoroz: 'D27GWFMBM',
  spot: 'DY8M9V3BM',
  spotScara: 'DFDCL23BM',
  aplica: 'DYQJNHMBM',
  aplica2: 'DWW2THMBM',
  solara: 'D03YKHYBM',
  solara2: 'D0F9S4YBM',
  proiector: 'DGMPG1YBM',
};
const NUME = {
  becPir: 'bec-cu-led-cu-senzor-de-miscare-pir',
  becHoroz: 'bec-led-cu-senzor-de-miscare-si-de-lumina-horoz',
  spot: 'spot-led-incastrabil-1w-cu-senzor-de-prezenta',
  spotScara: 'spot-led-scara-cu-senzor-de-miscare',
  aplica: 'lampa-led-cu-senzor-de-miscare-maclean',
  aplica2: 'lampa-led-cu-senzor-pir-maclean-mce244',
  solara: 'lampa-solara-cu-telecomanda-120-cob-led-siks',
  solara2: 'lampa-solara-de-exterior-seveshop',
  proiector: 'proiector-led-cu-senzor-de-miscare-20w',
};
const O = '/sites/bermo-work/public/imagini/articole/iluminat-cu-senzor-de-miscare';
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

// HERO — heroMosaic (nefolosit recent): cele patru tipuri de corp, asimetric
await heroMosaic({
  imagini: await taieLista([imgs.aplica, imgs.solara, imgs.becPir, imgs.proiector], 0.03),
  out: `${O}/lampa-cu-senzor-exterior.webp`, w: 1400, h: 760,
});
console.log('hero lampa-cu-senzor-exterior.webp');

// INLINE 1 — ce poti pune afara, pe tip de corp (inlineChecklist, nefolosit recent)
await inlineChecklist({
  produse: [
    { src: imgs.becPir, nume: 'Bec' },
    { src: imgs.spot, nume: 'Spot' },
    { src: imgs.aplica, nume: 'Aplica' },
    { src: imgs.solara, nume: 'Lampa solara' },
    { src: imgs.proiector, nume: 'Proiector' },
  ],
  functii: [
    { eticheta: 'Declara clasa de protectie', valori: [false, true, true, true, true] },
    { eticheta: 'Rezista afara (IP44 sau mai mult)', valori: [false, false, true, true, true] },
    { eticheta: 'Rezista la ploaie directa (IP65)', valori: [false, false, false, true, true] },
    { eticheta: 'Se monteaza fara instalatie', valori: [true, false, false, true, false] },
  ],
  caption: 'Verificat pe 73 de corpuri cu senzor din catalogul eMAG.',
  out: `${O}/protectie-ip.webp`, w: 880,
});
console.log('inline protectie-ip.webp');

// INLINE 2 — ce raza de detectie iti trebuie, pe spatiu
await inlineRange({
  titlu: 'Ce raza de detectie iti trebuie, pe spatiu',
  unitate: 'metri',
  min: 0, max: 12,
  items: [
    { src: imgs.spot, nume: 'Hol, camara', valoare: 2.5, eticheta: '2-3 m' },
    { src: imgs.spotScara, nume: 'Casa scarii', valoare: 4, eticheta: '3-5 m' },
    { src: imgs.aplica, nume: 'Intrare in casa', valoare: 8, eticheta: '7-9 m' },
    { src: imgs.proiector, nume: 'Curte, alee', valoare: 11, eticheta: 'peste 10 m' },
  ],
  caption: 'Mai mult nu e mai bine: la usa, o raza de zece metri se aprinde de la fiecare masina.',
  out: `${O}/raza-de-detectie.webp`, w: 1040, h: 400,
});
console.log('inline raza-de-detectie.webp');
