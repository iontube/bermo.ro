import * as G from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const d = JSON.parse(readFileSync('/tmp/bermo-dump.json'));
const byId = (id) => d.products.find((p) => p.id === id);
const url = (p) => (p.images || [])[0];
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'®™+]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');

const P = {
  DH28QMBBM: 'Kring Fit ergonomic, mesh',
  D028QMBBM: 'Kring Smart, mesh',
  DGC21N3BM: 'KD Home Directorial ergonomic',
  DWPBG4YBM: 'KD Home Directorial cu masaj',
  DC0227BBM: 'Kring Bokai, piele ecologica',
  D7P06YBBM: 'Kring Klaus, stofa',
  D09V25BBM: 'Kring Walter, cu tetiera',
  DZ28QMBBM: 'Kring Swan, piele ecologica',
  D6G0CNBBM: 'Kring Star ergonomic, mesh',
};
const pslug = (code) => `${slug(P[code].split(',')[0])}-${code.toLowerCase()}`;
const O = '/sites/bermo-work/public/imagini/articole/cele-mai-bune-scaune-de-birou';
const PROD = '/sites/bermo-work/public/imagini/produse';
mkdirSync(O, { recursive: true });

const R = {};
for (const code of Object.keys(P)) {
  const src = await G.descarca(url(byId(code)));
  R[code] = src;
  await sharp({ create: { width: 600, height: 600, channels: 4, background: '#ffffff' } })
    .composite([{ input: await sharp(src).resize(560, 560, { fit: 'inside', background: '#ffffff' }).flatten({ background: '#ffffff' }).toBuffer(), gravity: 'center' }])
    .webp({ quality: 88 }).toFile(`${PROD}/${pslug(code)}.webp`);
  console.log('produs', pslug(code));
}

// HERO — heroOffset (2 scaune suprapuse), variatie keyword
const [a, b] = await G.taieLista([R.DGC21N3BM, R.DH28QMBBM], 0.03);
await G.heroOffset({ imagini: [a, b], out: `${O}/scaun-ergonomic-birou.webp` });

// INLINE 1 — inlineVs: mesh vs piele ecologica
await G.inlineVs({
  a: { src: R.DH28QMBBM, nume: 'Scaun cu spatar mesh', sub: 'plasa aerisita' },
  b: { src: R.DC0227BBM, nume: 'Scaun din piele ecologica', sub: 'aspect directorial' },
  randuri: [
    { eticheta: 'Aerisire', a: 'Foarte buna, nu transpiri', b: 'Slaba, se incalzeste vara' },
    { eticheta: 'Aspect', a: 'Modern, sport', b: 'Clasic, elegant' },
    { eticheta: 'Intretinere', a: 'Aduna praf in plasa', b: 'Se sterge usor' },
    { eticheta: 'Cel mai bun la', a: 'Ore lungi, vara', b: 'Birou reprezentativ' },
  ], caption: 'Mesh pentru aerisire si ore lungi; piele ecologica pentru un aspect directorial', out: `${O}/mesh-vs-piele.webp` });

// INLINE 2 — inlineChecklist: dotari ergonomice
await G.inlineChecklist({
  produse: [
    { src: R.D028QMBBM, nume: 'Kring Smart' },
    { src: R.DH28QMBBM, nume: 'Kring Fit' },
    { src: R.D09V25BBM, nume: 'Kring Walter' },
    { src: R.DWPBG4YBM, nume: 'KD Home cu masaj' },
  ],
  functii: [
    { eticheta: 'Suport lombar', valori: [false, true, true, true] },
    { eticheta: 'Tetiera', valori: [false, false, true, true] },
    { eticheta: 'Brate reglabile', valori: [false, true, true, true] },
    { eticheta: 'Mecanism inclinare', valori: [true, true, true, true] },
    { eticheta: 'Functie masaj', valori: [false, false, false, true] },
  ],
  caption: 'Suportul lombar si bratele reglabile conteaza cel mai mult pentru sanatatea spatelui', out: `${O}/dotari-ergonomice.webp` });

// INLINE 3 — inlineStat: popularitate (numar recenzii)
await G.inlineStat({ titlu: 'Cele mai alese, dupa numarul de recenzii', items: [
  { src: R.DH28QMBBM, valoare: '2354', eticheta: 'recenzii', nume: 'Kring Fit' },
  { src: R.DC0227BBM, valoare: '1999', eticheta: 'recenzii', nume: 'Kring Bokai' },
  { src: R.D7P06YBBM, valoare: '750', eticheta: 'recenzii', nume: 'Kring Klaus' },
], caption: 'Modelele cu mii de recenzii sunt cele mai testate alegeri de pe piata din Romania', out: `${O}/cele-mai-alese.webp` });

// afiliere: adauga in produse-emag.json
const pjPath = '/sites/bermo-work/src/date/produse-emag.json';
const pj = JSON.parse(readFileSync(pjPath, 'utf8'));
for (const code of Object.keys(P)) { const p = byId(code); pj[code] = { url: p.url, nume: (p.name || '').slice(0, 90) }; }
writeFileSync(pjPath, JSON.stringify(pj, null, 0));
console.log('produse-emag.json +', Object.keys(P).length, 'scaune');
console.log('gata', O);
