import * as G from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const d = JSON.parse(readFileSync('/tmp/bermo-dump.json'));
const byId = (id) => d.products.find((p) => p.id === id);
const url = (p) => (p.images || [])[0];
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'®™+]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');

const P = {
  D9BHTJ3BM: 'SENSE7 Nojo Light electric, 120x60',
  D83CQJYBM: 'Nefmob Nove, 90x55',
  DCWD3KMBM: 'IRIM Beta, 110 cm',
  D9X89YMBM: 'IRIM Sigma pentru copii, 110 cm',
  D6N1Y2MBM: 'Bega Adria, 3 sertare',
  D0N11VMBM: 'IRIM Kalt, 150 cm cu etajera',
  DP9LQ7YBM: 'KringX Origo, 6 sertare',
  DKJFZWMBM: 'KringX Origo de colt',
  D4FT7CYBM: 'Doctor Shield Nova electric',
};
const pslug = (code) => `${slug(P[code].split(',')[0])}-${code.toLowerCase()}`;
const O = '/sites/bermo-work/public/imagini/articole/cele-mai-bune-birouri';
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

// HERO — heroDuo (2 birouri: electric vs clasic mare), variatie keyword
const [h1, h2] = await G.taieLista([R.D9BHTJ3BM, R.D0N11VMBM], 0.03);
await G.heroDuo({ imagini: [h1, h2], out: `${O}/birou-pentru-acasa.webp` });

// INLINE 1 — inlineVs: birou fix vs electric reglabil pe inaltime
await G.inlineVs({
  a: { src: R.DCWD3KMBM, nume: 'Birou fix', sub: 'inaltime standard' },
  b: { src: R.D9BHTJ3BM, nume: 'Birou electric reglabil', sub: 'stai si in picioare' },
  randuri: [
    { eticheta: 'Inaltime', a: 'Fixa, ~75 cm', b: 'Reglabila, la buton' },
    { eticheta: 'Sanatate', a: 'Stai doar asezat', b: 'Alternezi asezat si in picioare' },
    { eticheta: 'Pret', a: 'De la ~230 lei', b: 'De la ~465 lei' },
    { eticheta: 'Cel mai bun la', a: 'Buget si simplitate', b: 'Ore lungi, spate sanatos' },
  ], caption: 'Biroul fix e ieftin si simplu; cel electric reglabil te lasa sa alternezi pozitia, mai bine pentru spate', out: `${O}/fix-vs-electric.webp` });

// INLINE 2 — inlineChecklist: dotari
await G.inlineChecklist({
  produse: [
    { src: R.D83CQJYBM, nume: 'Nefmob Nove' },
    { src: R.D6N1Y2MBM, nume: 'Bega Adria' },
    { src: R.DP9LQ7YBM, nume: 'KringX Origo' },
    { src: R.D4FT7CYBM, nume: 'Dr.Shield Nova' },
  ],
  functii: [
    { eticheta: 'Reglabil electric', valori: [false, false, false, true] },
    { eticheta: 'Sertare', valori: [false, true, true, false] },
    { eticheta: 'Blat mare (peste 120 cm)', valori: [false, true, true, true] },
    { eticheta: 'Etajera / raft', valori: [false, false, true, false] },
    { eticheta: 'Montaj simplu', valori: [true, true, false, true] },
  ],
  caption: 'Sertarele si etajera adauga depozitare; reglajul electric adauga sanatate pentru ore lungi', out: `${O}/dotari-birou.webp` });

// INLINE 3 — inlineGauge: notele reale
await G.inlineGauge({ titlu: 'Nota reala a cumparatorilor', unitate: 'din 5 stele', max: 5, items: [
  { src: R.D4FT7CYBM, valoare: 4.77, nume: 'Dr.Shield Nova', sub: 'electric' },
  { src: R.DCWD3KMBM, valoare: 4.69, nume: 'IRIM Beta', sub: 'clasic' },
  { src: R.D0N11VMBM, valoare: 4.65, nume: 'IRIM Kalt', sub: 'cu etajera' },
  { src: R.D9BHTJ3BM, valoare: 4.64, nume: 'SENSE7 Nojo', sub: 'electric accesibil' },
], caption: 'Notele cele mai mari vin de la birourile electrice si de la modelele IRIM bine finisate', out: `${O}/note-cumparatori.webp` });

// afiliere
const pjPath = '/sites/bermo-work/src/date/produse-emag.json';
const pj = JSON.parse(readFileSync(pjPath, 'utf8'));
for (const code of Object.keys(P)) { const p = byId(code); pj[code] = { url: p.url, nume: (p.name || '').slice(0, 90) }; }
writeFileSync(pjPath, JSON.stringify(pj, null, 0));
console.log('produse-emag.json +', Object.keys(P).length, 'birouri');
console.log('gata', O);
