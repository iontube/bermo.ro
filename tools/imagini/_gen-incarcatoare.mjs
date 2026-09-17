import * as G from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const d = JSON.parse(readFileSync('/tmp/bermo-dump.json'));
const byId = (id) => d.products.find((p) => p.id === id);
const url = (p) => (p.images || [])[0];
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'®™+]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');

// 10 produse (oscilat)
const P = {
  DZ38WWMBM: 'Timebox 5 porturi, 65 W',
  D26D07YBM: 'Samsung retea, 25 W',
  DNBKM7MBM: 'Apple retea USB-C, 20 W',
  DRBHCRMBM: 'ZAFIT auto, 45 W',
  D5XXV3YBM: 'AHA PRINT auto hidden, 90 W',
  DGHGVZYBM: 'Runex retea 4 porturi, 40 W',
  DHNF5CMBM: 'Qeno Wireless Fast, 15 W',
  DXP7TNYBM: 'BRAGUS Wireless 3 in 1',
  DPT80WYBM: 'ZAFIT pentru iPhone, 20 W',
  D3H1TJMBM: 'Samsung Super Fast, 45 W',
};
const pslug = (code) => `${slug(P[code].split(',')[0])}-${code.toLowerCase()}`;
const O = '/sites/bermo-work/public/imagini/articole/cele-mai-bune-incarcatoare-telefon';
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

// HERO — heroSpotlight (1 mare + suport), variatie keyword
await G.heroSpotlight({ imagini: await G.taieLista([R.DZ38WWMBM, R.DXP7TNYBM, R.DRBHCRMBM], 0.03), out: `${O}/incarcator-rapid-telefon.webp` });

// INLINE 1 — inlineSpecs: cele 3 tipuri comparate
await G.inlineSpecs({
  produse: [
    { src: R.DZ38WWMBM, nume: 'De priza' },
    { src: R.DRBHCRMBM, nume: 'De masina' },
    { src: R.DHNF5CMBM, nume: 'Wireless' },
  ],
  specs: [
    { eticheta: 'Unde il folosesti', valori: ['Acasa, birou', 'In masina', 'Pe birou, noptiera'] },
    { eticheta: 'Viteza', valori: ['Cea mai mare', 'Mare', 'Mai mica'], hl: true },
    { eticheta: 'Mai multe device-uri', valori: ['Da, multi-port', 'Uneori 2', 'De obicei 1'] },
    { eticheta: 'Cablu necesar', valori: ['Da', 'Da', 'Nu'] },
    { eticheta: 'Pret start', valori: ['~40 lei', '~37 lei', '~130 lei'] },
  ],
  caption: 'De priza pentru viteza si mai multe device-uri, auto pentru drum, wireless pentru comoditate fara cablu',
  out: `${O}/tipuri-comparate.webp` });

// INLINE 2 — inlineBars: putere in wati
await G.inlineBars({ titlu: 'Putere, in wati', unitate: 'W - mai multi wati inseamna incarcare mai rapida, daca telefonul suporta', data: [
  { src: R.D5XXV3YBM, nume: 'AHA PRINT auto', valoare: 90, eticheta: '90 W' },
  { src: R.DZ38WWMBM, nume: 'Timebox 5 porturi', valoare: 65, eticheta: '65 W' },
  { src: R.DRBHCRMBM, nume: 'ZAFIT auto', valoare: 45, eticheta: '45 W' },
  { src: R.D26D07YBM, nume: 'Samsung retea', valoare: 25, eticheta: '25 W' },
  { src: R.DNBKM7MBM, nume: 'Apple retea', valoare: 20, eticheta: '20 W' },
], out: `${O}/putere-in-wati.webp` });

// INLINE 3 — inlineStat: cele mai testate (recenzii)
await G.inlineStat({ titlu: 'Cele mai testate, dupa numarul de recenzii', items: [
  { src: R.DZ38WWMBM, valoare: '1521', eticheta: 'recenzii', nume: 'Timebox 65 W' },
  { src: R.DNBKM7MBM, valoare: '1255', eticheta: 'recenzii', nume: 'Apple 20 W' },
  { src: R.DRBHCRMBM, valoare: '619', eticheta: 'recenzii', nume: 'ZAFIT auto' },
], caption: 'Un incarcator cu mii de recenzii bune e o alegere sigura, mai ales pentru siguranta la incarcare', out: `${O}/cele-mai-testate.webp` });

// afiliere
const pjPath = '/sites/bermo-work/src/date/produse-emag.json';
const pj = JSON.parse(readFileSync(pjPath, 'utf8'));
for (const code of Object.keys(P)) { const p = byId(code); pj[code] = { url: p.url, nume: (p.name || '').slice(0, 90) }; }
writeFileSync(pjPath, JSON.stringify(pj, null, 0));
console.log('produse-emag.json +', Object.keys(P).length, 'incarcatoare');
console.log('gata', O);
