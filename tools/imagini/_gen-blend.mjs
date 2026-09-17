import * as G from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const d = JSON.parse(readFileSync('/tmp/bermo-dump.json'));
const byId = (id) => d.products.find((p) => p.id === id);
const url = (p) => (p.images || [])[0];
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'®™+]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');

// { cod: nume-card } (numele determina slugul imaginii produs)
const P = {
  DDHRGPMBM: 'NutriBullet Pro 900W, 900 ml',
  DT49SNBBM: 'Tefal PerfectMix 1200W, vas 2 L',
  DRCCFLMBM: 'Biovita Forte 1200, vas de sticla 1,5 L',
  DHPZVMBBM: 'Heinner HBL-550S, de masa, 550 W',
  DN2QL8MBM: 'Zenkabeat B23 4 in 1, vertical, 1000 W',
  D8F8TV3BM: 'Adler AD 4620B, vertical, 500 W',
  DQ3DL83BM: 'SeveShop Portabil 1200W, 25000 RPM',
  DK07FVYBM: 'Luxena portabil fara fir, 150 W',
  D6ZPBB2BM: 'Latkon 6 in 1, 800 W',
  DP8XL83BM: 'SeveShop Profesional 2 in 1, 1800 W',
};
const pslug = (code) => `${slug(P[code].split(',')[0])}-${code.toLowerCase()}`;
const O = '/sites/bermo-work/public/imagini/articole/cele-mai-bune-blendere';
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

// HERO — podium (variatie keyword, NU duplicat de folder)
const [le, mid, ri] = await G.taieLista([R.DT49SNBBM, R.DDHRGPMBM, R.DP8XL83BM], 0.03);
await G.heroPodium({ imagini: [le, mid, ri], out: `${O}/blender-bucatarie.webp` });

// INLINE 1 — vs: de masa vs vertical (concept only)
await G.inlineVs({
  a: { src: R.DRCCFLMBM, nume: 'Blender de masa', sub: 'cu vas propriu' },
  b: { src: R.DN2QL8MBM, nume: 'Blender vertical (de mana)', sub: 'direct in vas' },
  randuri: [
    { eticheta: 'Cel mai bun la', a: 'Smoothie, cantitati mari', b: 'Supe crema, sosuri' },
    { eticheta: 'Se foloseste', a: 'In vasul propriu', b: 'Direct in oala' },
    { eticheta: 'Cantitate', a: 'Mare (1-2 L)', b: 'Mica spre medie' },
    { eticheta: 'Depozitare', a: 'Ocupa loc', b: 'Compact' },
  ], caption: 'De masa castiga la cantitate si smoothie; verticalul, la supe crema si compactare', out: `${O}/de-masa-vs-vertical.webp` });

// INLINE 2 — bars: putere motor
await G.inlineBars({ titlu: 'Putere motor, comparata', unitate: 'wati - de la 800W in sus faci fata la gheata si nuci', data: [
  { src: R.DP8XL83BM, nume: 'SeveShop Profesional', valoare: 1800, eticheta: '1800 W' },
  { src: R.DT49SNBBM, nume: 'Tefal PerfectMix', valoare: 1200, eticheta: '1200 W' },
  { src: R.DDHRGPMBM, nume: 'NutriBullet Pro', valoare: 900, eticheta: '900 W' },
  { src: R.D6ZPBB2BM, nume: 'Latkon 6 in 1', valoare: 800, eticheta: '800 W' },
  { src: R.DHPZVMBBM, nume: 'Heinner de masa', valoare: 550, eticheta: '550 W' },
], out: `${O}/putere.webp` });

// INLINE 3 — compare: 3 tipuri pe bugete
await G.inlineCompare({ items: [
  { src: R.DK07FVYBM, nume: 'Luxena portabil', valoare: '159 lei · 4.9★', sub: 'smoothie to-go' },
  { src: R.DDHRGPMBM, nume: 'NutriBullet Pro', valoare: '276 lei · 4.7★', sub: 'alegerea noastra' },
  { src: R.DT49SNBBM, nume: 'Tefal PerfectMix', valoare: '481 lei · 4.7★', sub: 'de masa, familie' },
], caption: 'Trei blendere bune pe trei nevoi, de la portabil la de masa', out: `${O}/alegeri-pe-bugete.webp` });

console.log('gata', O);
