import { descarca, taieLista, heroRow, inlineRange, inlineChecklist } from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const cat = JSON.parse(readFileSync('/sites/bermo-work/research/emag-produse.json', 'utf8'));
const byId = (id) => cat.find((p) => p.id === id);
const url = (p) => ((p.images || [])[0] || '').replace(/&amp;/g, '&').split('?')[0];

const IDS = {
  connectus: 'D50R472BM',
  philips8: 'DZ5RTFMBM',
  philips4: 'DC5RTFMBM',
  bach4: 'DWW9T0MBM',
  schneider: 'DF9KBTMBM',
  byond: 'DVVCGKYBM',
  well5: 'DC32G2BBM',
  rola20: 'DN8C5SBBM',
  rola30: 'DT8QCBBBM',
};
const NUME = {
  connectus: 'prelungitor-bachmann-connectus',
  philips8: 'prelungitor-philips-spn3180a',
  philips4: 'prelungitor-philips-spn3140a',
  bach4: 'prelungitor-bachmann-4-prize',
  schneider: 'prelungitor-schneider-unica',
  byond: 'prelungitor-byondself-4000w',
  well5: 'prelungitor-well-4-prize',
  rola20: 'prelungitor-bachmann-20m',
  rola30: 'prelungitor-bachmann-30m',
};
const O = '/sites/bermo-work/public/imagini/articole/prelungitor-cu-protectie-la-supratensiune';
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

// HERO — heroRow (nefolosit in ultimele 5). Toate pozele din categorie sunt decupaje curate,
// deci decupajul e sigur si le face sa umple cadrul.
await heroRow({
  imagini: await taieLista([imgs.connectus, imgs.byond, imgs.rola30], 0.03),
  out: `${O}/prelungitor-cu-intrerupator.webp`, w: 1400, h: 620,
});
console.log('hero prelungitor-cu-intrerupator.webp');

// INLINE 1 — cu cat cablul e mai lung, cu atat duce mai putin
await inlineRange({
  titlu: 'Cu cat cablul e mai lung, cu atat duce mai putina putere',
  unitate: 'wati maximi declarati',
  min: 1500, max: 4200,
  items: [
    { src: imgs.rola30, nume: '30 m, 1 mm²', valoare: 2000, eticheta: '2000 W' },
    { src: imgs.rola20, nume: '20 m, 1 mm²', valoare: 2500, eticheta: '2500 W' },
    { src: imgs.bach4, nume: '1,5 m, 1,5 mm²', valoare: 3600, eticheta: '3600 W' },
    { src: imgs.connectus, nume: '2 m, birou', valoare: 4000, eticheta: '4000 W' },
  ],
  caption: 'Aceeasi marca, acelasi cablu la rolele lungi: 500 W diferenta doar din lungime.',
  out: `${O}/putere-si-lungime.webp`, w: 1040, h: 420,
});
console.log('inline putere-si-lungime.webp');

// INLINE 2 — ce protectii declara fiecare
await inlineChecklist({
  produse: [
    { src: imgs.connectus, nume: 'Bachmann' },
    { src: imgs.philips8, nume: 'Philips' },
    { src: imgs.byond, nume: 'BYONDSELF' },
    { src: imgs.schneider, nume: 'Schneider' },
    { src: imgs.rola20, nume: 'Rola 20 m' },
  ],
  functii: [
    { eticheta: 'Protectie la supratensiune', valori: [true, true, true, false, false] },
    { eticheta: 'Protectie la suprasarcina', valori: [true, true, true, false, false] },
    { eticheta: 'Protectie pentru copii', valori: [false, true, false, true, false] },
    { eticheta: 'Cati jouli absoarbe', valori: [false, false, false, false, false] },
  ],
  caption: 'Din 44 de prelungitoare verificate, unul singur declara joulii.',
  out: `${O}/ce-protectii-declara.webp`, w: 880,
});
console.log('inline ce-protectii-declara.webp');
