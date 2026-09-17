import * as G from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const d = JSON.parse(readFileSync('/tmp/bermo-dump.json'));
const byId = (id) => d.products.find((p) => p.id === id);
const url = (p) => (p.images || [])[0];
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'®™+]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');

// 8 covoare (oscilat)
const P = {
  DZ6G3KMBM: 'Heinner Soft Rabbit blanita, 70x140',
  DTPX0NBBM: 'Golden Daisy tesut, 100x150',
  D5MSY3MBM: 'Heinner Leafs 3D, 70x140',
  DNYSY3MBM: 'Heinner Ashley 3D, 160x230',
  DGR5DTYBM: 'Ayyildiz Gala shaggy, 120x120',
  DJ7ZNQYBM: 'WEBYO set 2 covoare bucatarie',
  D13W10MBM: 'Blana de miel DIANA naturala',
  DW1LRQYBM: 'Ayyildiz Plus modern, 140x200',
};
const pslug = (code) => `${slug(P[code].split(',')[0])}-${code.toLowerCase()}`;
const O = '/sites/bermo-work/public/imagini/articole/cele-mai-bune-covoare';
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

// HERO — heroDuo (2 covoare: pufos + 3D), variatie keyword
const [a, b] = await G.taieLista([R.DZ6G3KMBM, R.DNYSY3MBM], 0.03);
await G.heroDuo({ imagini: [a, b], out: `${O}/covor-camera-living.webp` });

// INLINE 1 — inlineVs: covor pufos (shaggy/blanita) vs covor subtire (tesut)
await G.inlineVs({
  a: { src: R.DZ6G3KMBM, nume: 'Covor pufos', sub: 'shaggy sau blanita' },
  b: { src: R.DTPX0NBBM, nume: 'Covor subtire', sub: 'tesut, fir scurt' },
  randuri: [
    { eticheta: 'Senzatie', a: 'Moale, calduros sub picioare', b: 'Ferm, practic' },
    { eticheta: 'Cel mai bun in', a: 'Dormitor, living de relaxare', b: 'Bucatarie, hol, trafic intens' },
    { eticheta: 'Curatare', a: 'Mai atenta, aduna praf', b: 'Usoara, unele lavabile' },
    { eticheta: 'Pret', a: 'Mai mare', b: 'Foarte accesibil' },
  ], caption: 'Covorul pufos aduce confort in dormitor; cel subtire e practic in zonele cu trafic si de curatat des', out: `${O}/pufos-vs-subtire.webp` });

// INLINE 2 — inlineChecklist: proprietati
await G.inlineChecklist({
  produse: [
    { src: R.DTPX0NBBM, nume: 'Golden Daisy tesut' },
    { src: R.DZ6G3KMBM, nume: 'Heinner blanita' },
    { src: R.DJ7ZNQYBM, nume: 'WEBYO bucatarie' },
    { src: R.DNYSY3MBM, nume: 'Heinner 3D Ashley' },
  ],
  functii: [
    { eticheta: 'Moale, pufos', valori: [false, true, false, false] },
    { eticheta: 'Antiderapant', valori: [false, false, true, false] },
    { eticheta: 'Bun la trafic intens', valori: [true, false, true, true] },
    { eticheta: 'Usor de curatat', valori: [true, false, true, true] },
    { eticheta: 'Potrivit in bucatarie', valori: [false, false, true, false] },
  ],
  caption: 'Alege pufos pentru confort in dormitor, tesut sau antiderapant pentru bucatarie si zone cu trafic', out: `${O}/proprietati.webp` });

// INLINE 3 — inlineRange: pret pe dimensiune
await G.inlineRange({
  titlu: 'Cat costa, pe dimensiune', unitate: 'lei, pret orientativ', min: 20, max: 300,
  items: [
    { src: R.DTPX0NBBM, nume: 'Mic, 100x150', valoare: 32, eticheta: '~32 lei' },
    { src: R.D5MSY3MBM, nume: 'Mediu, 70x140', valoare: 58, eticheta: '~58 lei' },
    { src: R.DGR5DTYBM, nume: 'Shaggy, 120x120', valoare: 164, eticheta: '~164 lei' },
    { src: R.DNYSY3MBM, nume: 'Mare, 160x230', valoare: 230, eticheta: '~230 lei' },
  ],
  caption: 'Un covor mic tesut porneste de la ~30 lei; unul mare pentru living, spre 230 lei', out: `${O}/pe-dimensiune.webp` });

// afiliere
const pjPath = '/sites/bermo-work/src/date/produse-emag.json';
const pj = JSON.parse(readFileSync(pjPath, 'utf8'));
for (const code of Object.keys(P)) { const p = byId(code); pj[code] = { url: p.url, nume: (p.name || '').slice(0, 90) }; }
writeFileSync(pjPath, JSON.stringify(pj, null, 0));
console.log('produse-emag.json +', Object.keys(P).length, 'covoare');
console.log('gata', O);
