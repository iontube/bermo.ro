import * as G from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const d = JSON.parse(readFileSync('/tmp/bermo-dump.json'));
const byId = (id) => d.products.find((p) => p.id === id);
const url = (p) => (p.images || [])[0];
const IDS = {
  q60d55: 'DRQSSPYBM', du50: 'DTRSSPYBM', tcl55: 'D6MVWHYBM', tcl43: 'DGMVWHYBM',
  q60d65: 'D5QSSPYBM', philips: 'D3Y4C5BBM', du65: 'D7RSSPYBM', cu43: 'DBNVS6MBM',
};
const O = '/sites/bermo-work/public/imagini/articole/cele-mai-bune-televizoare';
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

// HERO — grid 2x2 (celule late, potrivite pt TV-uri; template nefolosit inca)
await G.heroGrid({ imagini: [R.q60d55, R.tcl55], out: `${O}/hero.webp` });

// INLINE 1 — vs: QLED vs LED
await G.inlineVs({
  a: { src: R.q60d55, nume: 'Samsung Q60D (QLED)', sub: '55 inch · 3.388 lei' },
  b: { src: R.du50, nume: 'Samsung DU7172 (LED)', sub: '50 inch · 1.804 lei' },
  randuri: [
    { eticheta: 'Tehnologie', a: 'QLED', b: 'LED' },
    { eticheta: 'Culori', a: 'Quantum Dot', b: 'Standard' },
    { eticheta: 'Luminozitate', a: 'Mai mare', b: 'Buna' },
    { eticheta: 'HDR', a: 'HDR10+ Quantum', b: 'HDR10+' },
  ], caption: 'QLED aduce culori mai vii si luminozitate mai mare; LED e mai ieftin la aceeasi diagonala', out: `${O}/qled-vs-led.webp` });

// INLINE 2 — range: diagonala vs distanta de vizionare
await G.inlineRange({ titlu: 'Ce diagonala, la ce distanta', unitate: 'inch', min: 40, max: 74, items: [
  { src: R.tcl43, nume: '43 inch', valoare: 43, eticheta: '~1,3 m' },
  { src: R.du50, nume: '50 inch', valoare: 50, eticheta: '~1,5 m' },
  { src: R.tcl55, nume: '55 inch', valoare: 55, eticheta: '~1,7 m' },
  { src: R.q60d65, nume: '65 inch', valoare: 65, eticheta: '~2,0 m' },
  { src: R.philips, nume: '70 inch', valoare: 70, eticheta: '~2,3 m' },
], caption: 'La 4K poti sta mai aproape: distanta optima e cam de 1,2 ori diagonala', out: `${O}/diagonala.webp` });

// INLINE 3 — gauge: nota medie de la cumparatori
await G.inlineGauge({ titlu: 'Nota medie de la cumparatori', unitate: '(din 5)', max: 5, items: [
  { src: R.q60d55, nume: 'Samsung Q60D', valoare: 4.6, sub: '658 recenzii' },
  { src: R.du50, nume: 'Samsung DU7172', valoare: 4.6, sub: '1000 recenzii' },
  { src: R.tcl55, nume: 'TCL P655', valoare: 4.6, sub: '501 recenzii' },
  { src: R.philips, nume: 'Philips 70PUS', valoare: 4.3, sub: '597 recenzii' },
], caption: 'Note reale de la mii de cumparatori, nu impresii de la noi', out: `${O}/note.webp` });

console.log('gata', O);
