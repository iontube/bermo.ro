import * as G from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const d = JSON.parse(readFileSync('/tmp/bermo-dump.json'));
const byId = (id) => d.products.find((p) => p.id === id);
const url = (p) => (p.images || [])[0];
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'®™+]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');

// 9 paturi distincte (oscilat de la 10)
const P = {
  DMSTY8BBM: 'KringX King tapitat, 140x200, cu somiera',
  DN1KW9MBM: 'IRIM Krasy, 160x200',
  DJZYQP3BM: 'Doctor Home metalic, 160x200',
  DNC8BWYBM: 'haaus Remi lemn masiv, 90x200',
  DWSK8SBBM: 'Transilvan Sally lemn masiv, 140x200',
  DP1KW9MBM: 'IRIM Krasy, 140x200',
  D5SNGCBBM: 'KringX Bronx lemn masiv, cu noptiere',
  DK13ZRYBM: 'Laguna Maldive tapitat, 180x200',
  DK8LYFBBM: 'Transilvan Sandra pat etajat, 120x200',
};
const pslug = (code) => `${slug(P[code].split(',')[0])}-${code.toLowerCase()}`;
const O = '/sites/bermo-work/public/imagini/articole/cele-mai-bune-paturi';
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

// HERO — heroMosaic (4 paturi de tipuri diferite), variatie keyword
const hm = await G.taieLista([R.DMSTY8BBM, R.DWSK8SBBM, R.DJZYQP3BM, R.D5SNGCBBM], 0.03);
await G.heroMosaic({ imagini: hm, out: `${O}/pat-dormitor.webp` });

// INLINE 1 — inlineVs: lemn masiv vs tapitat
await G.inlineVs({
  a: { src: R.DWSK8SBBM, nume: 'Pat din lemn masiv', sub: 'clasic, robust' },
  b: { src: R.DMSTY8BBM, nume: 'Pat tapitat', sub: 'moale, modern' },
  randuri: [
    { eticheta: 'Aspect', a: 'Cald, natural, clasic', b: 'Moale, modern, elegant' },
    { eticheta: 'Durabilitate', a: 'Foarte mare, tine zeci de ani', b: 'Buna, depinde de tapiterie' },
    { eticheta: 'Tablie', a: 'Din lemn, ferma', b: 'Moale, buna de citit rezemat' },
    { eticheta: 'Intretinere', a: 'Se sterge usor', b: 'Curatare textila periodica' },
  ], caption: 'Lemnul masiv castiga la durabilitate; tapitatul, la confort si aspect modern', out: `${O}/lemn-vs-tapitat.webp` });

// INLINE 2 — inlineSpecs: 4 tipuri de cadru comparate
await G.inlineSpecs({
  produse: [
    { src: R.DP1KW9MBM, nume: 'PAL' },
    { src: R.DJZYQP3BM, nume: 'Metalic' },
    { src: R.DWSK8SBBM, nume: 'Lemn masiv' },
    { src: R.DMSTY8BBM, nume: 'Tapitat' },
  ],
  specs: [
    { eticheta: 'Pret start', valori: ['~450 lei', '~600 lei', '~730 lei', '~1000 lei'], hl: true },
    { eticheta: 'Durabilitate', valori: ['Medie', 'Mare', 'Foarte mare', 'Mare'] },
    { eticheta: 'Aspect', valori: ['Simplu', 'Industrial', 'Cald, clasic', 'Modern, moale'] },
    { eticheta: 'Depozitare', valori: ['Uneori', 'Rar', 'Uneori', 'Des, cu somiera'] },
  ],
  caption: 'PAL pentru buget, metalic pentru robustete ieftina, lemn masiv pentru durata, tapitat pentru confort',
  out: `${O}/tipuri-de-pat.webp` });

// INLINE 3 — inlineStat: cele mai alese (recenzii)
await G.inlineStat({ titlu: 'Cele mai alese, dupa numarul de recenzii', items: [
  { src: R.DMSTY8BBM, valoare: '543', eticheta: 'recenzii', nume: 'KringX King tapitat' },
  { src: R.DN1KW9MBM, valoare: '288', eticheta: 'recenzii', nume: 'IRIM Krasy 160' },
  { src: R.DWSK8SBBM, valoare: '125', eticheta: 'recenzii', nume: 'Transilvan Sally' },
], caption: 'Paturile cu sute de recenzii bune sunt cele mai testate alegeri de pe piata din Romania', out: `${O}/cele-mai-alese.webp` });

// afiliere
const pjPath = '/sites/bermo-work/src/date/produse-emag.json';
const pj = JSON.parse(readFileSync(pjPath, 'utf8'));
for (const code of Object.keys(P)) { const p = byId(code); pj[code] = { url: p.url, nume: (p.name || '').slice(0, 90) }; }
writeFileSync(pjPath, JSON.stringify(pj, null, 0));
console.log('produse-emag.json +', Object.keys(P).length, 'paturi');
console.log('gata', O);
