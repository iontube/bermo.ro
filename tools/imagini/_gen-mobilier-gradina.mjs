import * as G from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const d = JSON.parse(readFileSync('/tmp/bermo-dump.json'));
const byId = (id) => d.products.find((p) => p.id === id);
const url = (p) => (p.images || [])[0];
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'®™+]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');

// 7 seturi distincte (oscilat)
const P = {
  DWRLSN3BM: 'idealStore masa cu 6 scaune',
  DTN0THYBM: 'Progarden TREE, 3 piese',
  DQWX31BBM: 'Timeless Tools, 2 sezlonguri',
  D0S93VMBM: 'Bica Lido, 2 fotolii si masa',
  D7KHV6MBM: 'Bica Venetia, cu canapea',
  DK6MZXYBM: 'idealStore BellaVita lounge',
  DFY8DTMBM: 'Keter Emma 3, cu lada',
};
const pslug = (code) => `${slug(P[code].split(',')[0])}-${code.toLowerCase()}`;
const O = '/sites/bermo-work/public/imagini/articole/cele-mai-bune-seturi-mobilier-gradina';
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

// HERO — heroRow (3 seturi), variatie keyword
const hr = await G.taieLista([R.DWRLSN3BM, R.D7KHV6MBM, R.DFY8DTMBM], 0.03);
await G.heroRow({ imagini: hr, out: `${O}/mobilier-terasa-gradina.webp` });

// INLINE 1 — inlineVs: set bistro (2 persoane) vs set dining (6 persoane)
await G.inlineVs({
  a: { src: R.DTN0THYBM, nume: 'Set bistro, 2 persoane', sub: 'masa mica si 2 scaune' },
  b: { src: R.DWRLSN3BM, nume: 'Set dining, 6 persoane', sub: 'masa mare si 6 scaune' },
  randuri: [
    { eticheta: 'Cel mai bun la', a: 'Balcon, terasa mica', b: 'Mese in familie, oaspeti' },
    { eticheta: 'Spatiu necesar', a: 'Mic', b: 'Mare, curte sau terasa ampla' },
    { eticheta: 'Numar de locuri', a: '2', b: '6' },
    { eticheta: 'Pret start', a: 'De la ~340 lei', b: 'De la ~700 lei' },
  ], caption: 'Setul bistro incape pe orice balcon; setul dining e pentru mese in familie pe terasa mare', out: `${O}/bistro-vs-dining.webp` });

// INLINE 2 — inlineChecklist: dotari
await G.inlineChecklist({
  produse: [
    { src: R.DTN0THYBM, nume: 'Progarden TREE' },
    { src: R.DWRLSN3BM, nume: 'idealStore 6 scaune' },
    { src: R.D7KHV6MBM, nume: 'Bica Venetia' },
    { src: R.DFY8DTMBM, nume: 'Keter Emma 3' },
  ],
  functii: [
    { eticheta: 'Perne incluse', valori: [false, false, true, true] },
    { eticheta: 'Canapea / lounge', valori: [false, false, true, true] },
    { eticheta: 'Masa de luat masa', valori: [true, true, false, false] },
    { eticheta: 'Rezistent la intemperii', valori: [true, true, true, true] },
    { eticheta: 'Depozitare in masuta', valori: [false, false, false, true] },
  ],
  caption: 'Seturile dining sunt pentru mese; cele lounge, cu canapea si perne, pentru relaxare', out: `${O}/dotari-set.webp` });

// INLINE 3 — inlineRange: pret pe marimea setului
await G.inlineRange({
  titlu: 'Cat costa, pe tipul de set', unitate: 'lei, pret orientativ', min: 300, max: 2500,
  items: [
    { src: R.DTN0THYBM, nume: 'Bistro 2 pers', valoare: 343, eticheta: '~340 lei' },
    { src: R.DWRLSN3BM, nume: 'Dining 6 pers', valoare: 699, eticheta: '~700 lei' },
    { src: R.D7KHV6MBM, nume: 'Lounge canapea', valoare: 1070, eticheta: '~1070 lei' },
    { src: R.DFY8DTMBM, nume: 'Premium brand', valoare: 2422, eticheta: '~2420 lei' },
  ],
  caption: 'Un set bistro simplu porneste de la ~340 lei; un lounge premium de brand trece de 2000', out: `${O}/pe-tipul-de-set.webp` });

// afiliere
const pjPath = '/sites/bermo-work/src/date/produse-emag.json';
const pj = JSON.parse(readFileSync(pjPath, 'utf8'));
for (const code of Object.keys(P)) { const p = byId(code); pj[code] = { url: p.url, nume: (p.name || '').slice(0, 90) }; }
writeFileSync(pjPath, JSON.stringify(pj, null, 0));
console.log('produse-emag.json +', Object.keys(P).length, 'seturi mobilier gradina');
console.log('gata', O);
