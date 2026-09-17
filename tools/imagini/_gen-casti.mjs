import * as G from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const d = JSON.parse(readFileSync('/tmp/bermo-dump.json'));
const byId = (id) => d.products.find((p) => p.id === id);
const url = (p) => (p.images || [])[0];
const IDS = {
  sony: 'D572G33BM', rotter: 'D1DLDG3BM', harmoniq: 'D1SN7W3BM', go4fit: 'D425N4MBM',
  qsport: 'DJGWFTYBM', qkoppel: 'D3YYNY3BM', xenomo: 'DQ9FCWMBM',
};
const O = '/sites/bermo-work/public/imagini/articole/cele-mai-bune-casti-wireless';
const PROD = '/sites/bermo-work/public/imagini/produse';
mkdirSync(O, { recursive: true });

for (const id of Object.values(IDS)) {
  const src = await G.descarca(url(byId(id)));
  await sharp({ create: { width: 600, height: 600, channels: 4, background: '#ffffff' } })
    .composite([{ input: await sharp(src).resize(560, 560, { fit: 'inside', background: '#ffffff' }).flatten({ background: '#ffffff' }).toBuffer(), gravity: 'center' }])
    .webp({ quality: 88 }).toFile(`${PROD}/${id}.webp`);
  console.log('produs', id);
}

const R = {};
for (const [k, id] of Object.entries(IDS)) R[k] = await G.descarca(url(byId(id)));

// HERO — halo (un singur produs dominant; Sony on-ear arata bine)
const [sonyT] = await G.taieLista([R.sony], 0.04);
await G.heroHalo({ imagine: sonyT, out: `${O}/hero.webp` });

// INLINE 1 — vs: on-ear vs earbuds true wireless
await G.inlineVs({
  a: { src: R.sony, nume: 'Casti on-ear (Sony)', sub: '~180 lei' },
  b: { src: R.harmoniq, nume: 'Earbuds true wireless', sub: 'de la ~90 lei' },
  randuri: [
    { eticheta: 'Purtare', a: 'Peste ureche', b: 'In ureche' },
    { eticheta: 'Autonomie', a: '50h continuu', b: '40h+ cu cutie' },
    { eticheta: 'Portabilitate', a: 'Voluminoase', b: 'Foarte compacte' },
    { eticheta: 'Sport / apa', a: 'Nu', b: 'Rezistente la apa' },
  ], caption: 'On-ear castiga la autonomie continua si confort; earbuds, la portabilitate si sport', out: `${O}/on-ear-vs-earbuds.webp` });

// INLINE 2 — checklist: ce dotari primesti
await G.inlineChecklist({ produse: [
  { src: R.sony, nume: 'Sony on-ear' }, { src: R.rotter, nume: 'ROTTER earbuds' }, { src: R.harmoniq, nume: 'HARMONIQ ANC' },
], functii: [
  { eticheta: 'Anulare activa a zgomotului (ANC)', valori: [false, false, true] },
  { eticheta: 'Rezistente la apa si transpiratie', valori: [false, true, true] },
  { eticheta: 'Cutie portabila de incarcare', valori: [false, true, true] },
  { eticheta: 'Microfon pentru apeluri', valori: [true, true, true] },
], caption: 'On-ear vs earbuds: fiecare format vine cu alte dotari', out: `${O}/dotari.webp` });

// INLINE 3 — gauge: nota de la cumparatori
await G.inlineGauge({ titlu: 'Nota medie de la cumparatori', unitate: '(din 5)', max: 5, items: [
  { src: R.harmoniq, nume: 'HARMONIQ', valoare: 4.9, sub: '1167 recenzii' },
  { src: R.rotter, nume: 'ROTTER', valoare: 4.9, sub: '3306 recenzii' },
  { src: R.sony, nume: 'Sony WH-CH520', valoare: 4.7, sub: '925 recenzii' },
], caption: 'Note mari, dar la brandurile mici verifica si dincolo de stele', out: `${O}/note.webp` });

console.log('gata', O);
