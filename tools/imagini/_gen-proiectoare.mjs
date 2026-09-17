import * as G from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const d = JSON.parse(readFileSync('/tmp/bermo-dump.json'));
const byId = (id) => d.products.find((p) => p.id === id);
const url = (p) => (p.images || [])[0];
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'®™+]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');

const P = {
  DC2VHGYBM: 'LULUGTI 1280x720, proiectie scurta',
  DWQ58KYBM: 'SEPYMP portabil, Android',
  DXCR1RYBM: 'RUNEX Prestige One, focus auto',
  DZ23X7YBM: 'ZENKABEAT ZK8320-Ultra, Android',
  DG62F4YBM: 'Ewenta PRO VISION, Full HD',
  DLK9D1YBM: 'Linomag Smart, Android 11',
  DB17LS3BM: 'Madynik Full HD 1080p, 600 ANSI',
  DRJJ2BYBM: 'Xgimi MoGo 2 Pro 1080p',
  DGC793YBM: 'Samsung The Freestyle Gen2',
};
const pslug = (code) => `${slug(P[code].split(',')[0])}-${code.toLowerCase()}`;
const O = '/sites/bermo-work/public/imagini/articole/cele-mai-bune-proiectoare';
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

// HERO — heroMosaic (4 imagini), variatie keyword
const hm = await G.taieLista([R.DGC793YBM, R.DRJJ2BYBM, R.DB17LS3BM, R.DC2VHGYBM], 0.03);
await G.heroMosaic({ imagini: hm, out: `${O}/videoproiector-portabil.webp` });

// INLINE 1 — inlineVs: ieftin (lumeni de marketing) vs premium (specificatii reale)
await G.inlineVs({
  a: { src: R.DWQ58KYBM, nume: 'Proiector ieftin', sub: 'sub 400 de lei' },
  b: { src: R.DRJJ2BYBM, nume: 'Proiector premium', sub: 'de la un brand real' },
  randuri: [
    { eticheta: 'Rezolutie reala', a: '720p nativ, upscaling', b: '1080p nativ' },
    { eticheta: 'Luminozitate', a: 'Cifra umflata pe cutie', b: 'ANSI real, masurat' },
    { eticheta: 'Cand merge', a: 'Doar pe intuneric total', b: 'Si seara, camera obscura' },
    { eticheta: 'Focus', a: 'Manual', b: 'Automat si keystone' },
  ], caption: 'Sub 400 de lei iei un proiector de intuneric; brandurile reale tin si la lumina scazuta', out: `${O}/ieftin-vs-premium.webp` });

// INLINE 2 — inlineStat: dovada sociala (numar de recenzii reale)
await G.inlineStat({ titlu: 'Cat de rodate sunt, dupa numarul de recenzii', items: [
  { src: R.DWQ58KYBM, valoare: '566', eticheta: 'recenzii', nume: 'SEPYMP portabil' },
  { src: R.DC2VHGYBM, valoare: '177', eticheta: 'recenzii', nume: 'LULUGTI' },
  { src: R.DG62F4YBM, valoare: '94', eticheta: 'recenzii', nume: 'Ewenta PRO VISION' },
], caption: 'Un numar mare de recenzii reale spune mai mult decat orice cifra de lumeni de pe cutie', out: `${O}/recenzii-reale.webp` });

// INLINE 3 — inlineGauge: notele reale ale cumparatorilor (max 5)
await G.inlineGauge({ titlu: 'Nota reala a cumparatorilor', unitate: 'din 5 stele', max: 5, items: [
  { src: R.DXCR1RYBM, valoare: 4.9, nume: 'RUNEX Prestige One', sub: 'focus auto' },
  { src: R.DG62F4YBM, valoare: 4.9, nume: 'Ewenta PRO VISION', sub: '94 recenzii' },
  { src: R.DB17LS3BM, valoare: 4.85, nume: 'Madynik Full HD', sub: '600 ANSI' },
  { src: R.DGC793YBM, valoare: 4.2, nume: 'Samsung Freestyle', sub: 'brand premium' },
], caption: 'Notele mari vin de la modelele cu focus bun si imagine onesta, nu de la cele mai ieftine', out: `${O}/note-cumparatori.webp` });

// adauga produsele in produse-emag.json (garda de afiliere)
const pjPath = '/sites/bermo-work/src/date/produse-emag.json';
const pj = JSON.parse(readFileSync(pjPath, 'utf8'));
for (const code of Object.keys(P)) { const p = byId(code); pj[code] = { url: p.url, nume: (p.name || '').slice(0, 90) }; }
writeFileSync(pjPath, JSON.stringify(pj, null, 0));
console.log('produse-emag.json actualizat cu', Object.keys(P).length, 'proiectoare');

console.log('gata', O);
