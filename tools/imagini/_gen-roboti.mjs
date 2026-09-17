import * as G from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const d = JSON.parse(readFileSync('/tmp/bermo-dump.json'));
const byId = (id) => d.products.find((p) => p.id === id);
const url = (p) => (p.images || [])[0];
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'®™+]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');

// 8 produse (oscilat de la 9)
const P = {
  DXWTJYBBM: 'Bosch MultiTalent 3, 800 W',
  DZ5HLVBBM: 'Heinner HFP-750, 750 W',
  DT191M2BM: 'Kenwood MultiPro Go, compact',
  DKZG86BBM: 'Philips Daily HR7310, 700 W',
  D86TJYBBM: 'Bosch MCM3501M, bol 2,3 L',
  DTBD373BM: 'Izzy CHEF PRO, 1500 W, bol 8 L',
  D3PJ32BBM: 'Bosch MUM58720, planetar',
  DGJK5KBBM: 'Kenwood kMix KMX750, planetar',
};
const pslug = (code) => `${slug(P[code].split(',')[0])}-${code.toLowerCase()}`;
const O = '/sites/bermo-work/public/imagini/articole/cele-mai-bune-roboti-de-bucatarie';
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

// HERO — heroPodium (3 roboti), variatie keyword
const [le, mid, ri] = await G.taieLista([R.DXWTJYBBM, R.DGJK5KBBM, R.DTBD373BM], 0.03);
await G.heroPodium({ imagini: [le, mid, ri], out: `${O}/robot-bucatarie-multifunctional.webp` });

// INLINE 1 — inlineVs: multifunctional vs planetar
await G.inlineVs({
  a: { src: R.DXWTJYBBM, nume: 'Robot multifunctional', sub: 'food processor' },
  b: { src: R.DGJK5KBBM, nume: 'Robot planetar', sub: 'de patiserie' },
  randuri: [
    { eticheta: 'Cel mai bun la', a: 'Tocat, feliat, ras, blender', b: 'Framantat aluat, batut albusuri' },
    { eticheta: 'Accesorii', a: 'Multe cutite si discuri', b: 'Carlig, tel, paleta' },
    { eticheta: 'Cantitate', a: 'Portii mici spre medii', b: 'Aluat si compozitii mari' },
    { eticheta: 'Pret start', a: 'De la ~210 lei', b: 'De la ~1200 lei' },
  ], caption: 'Multifunctionalul toaca si marunteste de toate; planetarul e regele aluatului si al patiseriei', out: `${O}/multifunctional-vs-planetar.webp` });

// INLINE 2 — inlineBars: putere motor
await G.inlineBars({ titlu: 'Putere motor, comparata', unitate: 'wati - mai multa putere pentru aluat greu si cantitati mari', data: [
  { src: R.DTBD373BM, nume: 'Izzy CHEF PRO', valoare: 1500, eticheta: '1500 W' },
  { src: R.DGJK5KBBM, nume: 'Kenwood kMix', valoare: 1000, eticheta: '1000 W' },
  { src: R.D3PJ32BBM, nume: 'Bosch MUM58', valoare: 1000, eticheta: '1000 W' },
  { src: R.DXWTJYBBM, nume: 'Bosch MultiTalent 3', valoare: 800, eticheta: '800 W' },
  { src: R.DZ5HLVBBM, nume: 'Heinner HFP-750', valoare: 750, eticheta: '750 W' },
], out: `${O}/putere-motor.webp` });

// INLINE 3 — inlineRange: pret pe nevoie
await G.inlineRange({
  titlu: 'Cat costa, pe nevoie', unitate: 'lei, pret orientativ', min: 180, max: 1800,
  items: [
    { src: R.DZ5HLVBBM, nume: 'Tocat de baza', valoare: 210, eticheta: '~210 lei' },
    { src: R.DXWTJYBBM, nume: 'Multifunctional', valoare: 320, eticheta: '~320 lei' },
    { src: R.D3PJ32BBM, nume: 'Planetar patiserie', valoare: 1200, eticheta: '~1200 lei' },
    { src: R.DGJK5KBBM, nume: 'Planetar premium', valoare: 1700, eticheta: '~1700 lei' },
  ],
  caption: 'Pentru tocat si maruntit ajunge un multifunctional; pentru copt des, merita un planetar', out: `${O}/pe-nevoie.webp` });

// afiliere
const pjPath = '/sites/bermo-work/src/date/produse-emag.json';
const pj = JSON.parse(readFileSync(pjPath, 'utf8'));
for (const code of Object.keys(P)) { const p = byId(code); pj[code] = { url: p.url, nume: (p.name || '').slice(0, 90) }; }
writeFileSync(pjPath, JSON.stringify(pj, null, 0));
console.log('produse-emag.json +', Object.keys(P).length, 'roboti');
console.log('gata', O);
