import * as G from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const d = JSON.parse(readFileSync('/tmp/bermo-dump.json'));
const byId = (id) => d.products.find((p) => p.id === id);
const url = (p) => (p.images || [])[0];
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'®™+]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');

const P = {
  D74RVGYBM: 'Bosch UniversalRotak 34-405, electric',
  D4CG9JYBM: 'Steinhaus PRO-ELM12N, electric 1200W',
  DTCPLJBBM: 'Einhell GE-HM 38 S, manual',
  DJXDVGYBM: 'Lehmann LGALM-4032, acumulator',
  D24RVGYBM: 'Bosch UniversalRotak 37-555, electric',
  DWPLF7MBM: 'Steinhaus PRO-GLM, benzina autopropulsata',
  DZ10DZBBM: 'Makita ELM4121, electric 1600W',
  DK5DJFMBM: 'Ruris RX311s, benzina autopropulsata',
  D1WKWDMBM: 'Einhell Professional PXC, acumulator',
};
const pslug = (code) => `${slug(P[code].split(',')[0])}-${code.toLowerCase()}`;
const O = '/sites/bermo-work/public/imagini/articole/cele-mai-bune-masini-de-tuns-iarba';
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

// HERO — heroTrio (3 masini), variatie keyword
const [t1, t2, t3] = await G.taieLista([R.D74RVGYBM, R.DWPLF7MBM, R.DZ10DZBBM], 0.03);
await G.heroTrio({ imagini: [t1, t2, t3], out: `${O}/masina-de-tuns-gazon.webp` });

// INLINE 1 — inlineVs: electric cu fir vs benzina
await G.inlineVs({
  a: { src: R.D74RVGYBM, nume: 'Electrica, cu fir', sub: 'gazon mic si mediu' },
  b: { src: R.DK5DJFMBM, nume: 'Pe benzina', sub: 'gazon mare' },
  randuri: [
    { eticheta: 'Cel mai bun la', a: 'Gazon pana in 500 mp', b: 'Gazon mare, peste 800 mp' },
    { eticheta: 'Autonomie', a: 'Nelimitata, la priza', b: 'Nelimitata, cu combustibil' },
    { eticheta: 'Intretinere', a: 'Aproape zero', b: 'Ulei, bujie, filtru' },
    { eticheta: 'Zgomot', a: 'Redus', b: 'Ridicat' },
  ], caption: 'Electrica pentru gazon mic, fara intretinere; benzina pentru suprafete mari, fara cablu', out: `${O}/electric-vs-benzina.webp` });

// INLINE 2 — inlineSpecs: cele 4 tipuri comparate
await G.inlineSpecs({
  produse: [
    { src: R.D4CG9JYBM, nume: 'Electrica' },
    { src: R.DJXDVGYBM, nume: 'Acumulator' },
    { src: R.DWPLF7MBM, nume: 'Benzina' },
    { src: R.DTCPLJBBM, nume: 'Manuala' },
  ],
  specs: [
    { eticheta: 'Suprafata', valori: ['pana la 500 mp', 'pana la 600 mp', 'peste 800 mp', 'pana la 200 mp'] },
    { eticheta: 'Cablu', valori: ['Da, la priza', 'Nu', 'Nu', 'Nu'] },
    { eticheta: 'Intretinere', valori: ['Minima', 'Baterie', 'Ulei si bujie', 'Zero'], hl: true },
    { eticheta: 'Zgomot', valori: ['Redus', 'Redus', 'Ridicat', 'Silentioasa'] },
    { eticheta: 'Pret start', valori: ['~300 lei', '~680 lei', '~1000 lei', '~440 lei'] },
  ],
  caption: 'Fiecare tip isi are locul lui, in functie de marimea gazonului si de cat vrei sa intretii masina',
  out: `${O}/tipuri-de-masini.webp` });

// INLINE 3 — inlineRange: pret pe marimea gazonului
await G.inlineRange({
  titlu: 'Cat costa, pe marimea gazonului', unitate: 'lei, pret orientativ', min: 250, max: 2400,
  items: [
    { src: R.D4CG9JYBM, nume: 'Gazon mic', valoare: 299, eticheta: '~300 lei' },
    { src: R.D74RVGYBM, nume: 'Gazon mediu', valoare: 569, eticheta: '~570 lei' },
    { src: R.DWPLF7MBM, nume: 'Gazon mare', valoare: 1060, eticheta: '~1060 lei' },
    { src: R.D1WKWDMBM, nume: 'Fara fir premium', valoare: 2302, eticheta: '~2300 lei' },
  ],
  caption: 'Pentru un gazon mic ajunge o electrica ieftina; suprafetele mari cer benzina sau acumulator puternic', out: `${O}/pe-marimea-gazonului.webp` });

// afiliere
const pjPath = '/sites/bermo-work/src/date/produse-emag.json';
const pj = JSON.parse(readFileSync(pjPath, 'utf8'));
for (const code of Object.keys(P)) { const p = byId(code); pj[code] = { url: p.url, nume: (p.name || '').slice(0, 90) }; }
writeFileSync(pjPath, JSON.stringify(pj, null, 0));
console.log('produse-emag.json +', Object.keys(P).length, 'masini de tuns');
console.log('gata', O);
