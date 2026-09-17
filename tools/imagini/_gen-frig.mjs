import * as G from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const d = JSON.parse(readFileSync('/tmp/bermo-dump.json'));
const byId = (id) => d.products.find((p) => p.id === id);
const url = (p) => (p.images || [])[0];
const IDS = {
  arctic: 'DM5LVKBBM', heinB: 'DT1BTWMBM', indesit: 'E9GMKBBBM', beko: 'DYQ6T7BBM',
  sbs442: 'DW4Q17MBM', sbs532: 'D138VPYBM', samsung: 'D79R81YBM', mic: 'DB1CYSYBM', mini: 'DWNKMDYBM',
};
const O = '/sites/bermo-work/public/imagini/articole/cele-mai-bune-frigidere';
const PROD = '/sites/bermo-work/public/imagini/produse';
mkdirSync(O, { recursive: true });

// carduri produs 600x600
for (const id of Object.values(IDS)) {
  const src = await G.descarca(url(byId(id)));
  await sharp({ create: { width: 600, height: 600, channels: 4, background: '#ffffff' } })
    .composite([{ input: await sharp(src).resize(560, 560, { fit: 'inside', background: '#ffffff' }).flatten({ background: '#ffffff' }).toBuffer(), gravity: 'center' }])
    .webp({ quality: 88 }).toFile(`${PROD}/${id}.webp`);
  console.log('produs', id);
}

const R = {};
for (const [k, id] of Object.entries(IDS)) R[k] = await G.descarca(url(byId(id)));

// HERO — podium (fresh, diferit de heroRow din art 1-2)
const [beko, sbs442, sbs532] = await G.taieLista([R.beko, R.sbs442, R.sbs532], 0.03);
await G.heroPodium({ imagini: [beko, sbs442, sbs532], out: `${O}/hero.webp` });

// INLINE 1 — stat: litri pe dimensiune gospodarie
await G.inlineStat({ titlu: 'De cati litri ai nevoie', items: [
  { src: R.mic, valoare: '83 L', eticheta: '1 persoana / birou', nume: 'Starcrest o usa' },
  { src: R.arctic, valoare: '306 L', eticheta: '2-3 persoane', nume: 'Arctic 2 usi' },
  { src: R.sbs442, valoare: '442 L', eticheta: '4-5 persoane', nume: 'Heinner SBS' },
  { src: R.samsung, valoare: '583 L', eticheta: 'familie mare', nume: 'Samsung SBS' },
], caption: 'Regula: 100-150 litri pentru prima persoana, plus 50-60 pentru fiecare in plus', out: `${O}/litri.webp` });

// INLINE 2 — specs: 4 tipuri reprezentative
await G.inlineSpecs({ produse: [
  { src: R.heinB, nume: 'Heinner 206' }, { src: R.arctic, nume: 'Arctic 306' }, { src: R.sbs442, nume: 'Heinner SBS 442' }, { src: R.samsung, nume: 'Samsung 583' },
], specs: [
  { eticheta: 'Volum', valori: ['206 L', '306 L', '442 L', '583 L'] },
  { eticheta: 'Tip', valori: ['2 usi', '2 usi', 'Side-by-side', 'Side-by-side'] },
  { eticheta: 'Dezghetare', valori: ['Static', 'Automat', 'No Frost', 'Full No Frost'], hl: true },
  { eticheta: 'Consum / an', valori: ['172 kWh', '208 kWh', '287 kWh', '331 kWh'] },
  { eticheta: 'Latime', valori: ['54,5 cm', '59,5 cm', '90,5 cm', '91 cm'] },
  { eticheta: 'Pret orientativ', valori: ['1.053', '1.627', '2.397', '3.700'] },
], caption: 'Cu cat frigiderul e mai mare si mai No Frost, cu atat consuma mai mult', out: `${O}/comparatie.webp` });

// INLINE 3 — checklist: ce dotari primesti pe niveluri
await G.inlineChecklist({ produse: [
  { src: R.heinB, nume: 'Heinner 206' }, { src: R.arctic, nume: 'Arctic 306' }, { src: R.sbs442, nume: 'Heinner SBS' }, { src: R.samsung, nume: 'Samsung SBS' },
], functii: [
  { eticheta: 'Sistem No Frost', valori: [false, false, true, true] },
  { eticheta: 'Display electronic', valori: [false, false, true, true] },
  { eticheta: 'Congelare rapida', valori: [false, false, true, true] },
  { eticheta: 'Control WiFi (Smart)', valori: [false, false, false, true] },
], caption: 'Ce castigi pe masura ce urci in gama', out: `${O}/dotari.webp` });

console.log('gata', O);
