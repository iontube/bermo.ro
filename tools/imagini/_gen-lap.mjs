import * as G from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const d = JSON.parse(readFileSync('/tmp/bermo-dump.json'));
const byId = (id) => d.products.find((p) => p.id === id);
const url = (p) => (p.images || [])[0];
const IDS = {
  tufF16: 'DHH5672BM', acerEntry: 'DG17LG3BM', msiThin: 'DB74BY2BM', loqEss: 'D5K5N63BM',
  loqI7: 'DPBRL32BM', acer1tb: 'DM1T643BM', acer4060: 'D71NBWYBM', cyborg: 'DRPV4Q3BM', tufA15: 'DRTKFJ3BM',
};
const O = '/sites/bermo-work/public/imagini/articole/cele-mai-bune-laptopuri-gaming';
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

// HERO — mosaic (asimetric)
await G.heroMosaic({ imagini: [R.tufF16, R.acerEntry, R.loqI7, R.acer4060], out: `${O}/hero.webp` });

// INLINE 1 — specs: 4 config pe niveluri (GPU evidentiat)
await G.inlineSpecs({ produse: [
  { src: R.acerEntry, nume: 'Acer Nitro (buget)' }, { src: R.msiThin, nume: 'MSI Thin 15' }, { src: R.tufF16, nume: 'ASUS TUF F16' }, { src: R.acer4060, nume: 'Acer Nitro 4060' },
], specs: [
  { eticheta: 'Placa video', valori: ['RTX 3050', 'RTX 4050', 'RTX 5050', 'RTX 4060'], hl: true },
  { eticheta: 'Procesor', valori: ['Core 5 210H', 'i5-13420H', 'i5-14450HX', 'i5-13420H'] },
  { eticheta: 'Ecran', valori: ['15,6 inch', '15,6 inch', '16 inch', '15,6 inch'] },
  { eticheta: 'Rata refresh', valori: ['165 Hz', '144 Hz', '144 Hz', '144 Hz'] },
  { eticheta: 'Pret orientativ', valori: ['3.999', '3.700', '4.999', '7.015'] },
], caption: 'Placa video conteaza cel mai mult la gaming; restul o completeaza', out: `${O}/comparatie.webp` });

// INLINE 2 — bars: putere relativa GPU la 1080p
await G.inlineBars({ titlu: 'Cat de puternica e placa video', unitate: 'performanta relativa in gaming 1080p (aproximativ)', data: [
  { src: R.acer4060, nume: 'RTX 4060', valoare: 165, eticheta: 'cea mai puternica aici' },
  { src: R.tufF16, nume: 'RTX 5050', valoare: 150, eticheta: 'noua, memorie GDDR7' },
  { src: R.msiThin, nume: 'RTX 4050', valoare: 130, eticheta: '1080p pe setari mari' },
  { src: R.acerEntry, nume: 'RTX 3050', valoare: 105, eticheta: 'nivel de intrare' },
], out: `${O}/gpu.webp` });

// INLINE 3 — gauge: nota de la cumparatori (doar modele bine notate)
await G.inlineGauge({ titlu: 'Nota medie de la cumparatori', unitate: '(din 5)', max: 5, items: [
  { src: R.tufF16, nume: 'ASUS TUF F16', valoare: 4.7, sub: '113 recenzii' },
  { src: R.acerEntry, nume: 'Acer Nitro V', valoare: 4.6, sub: '262 recenzii' },
  { src: R.loqI7, nume: 'Lenovo LOQ', valoare: 4.4, sub: '255 recenzii' },
], caption: 'Note reale de la sute de cumparatori', out: `${O}/note.webp` });

console.log('gata', O);
