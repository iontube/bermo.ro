import * as G from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const d = JSON.parse(readFileSync('/tmp/bermo-dump.json'));
const byId = (id) => d.products.find((p) => p.id === id);
const url = (p) => (p.images || [])[0];
const IDS = {
  mega: 'D6Q0RB2BM', ninja: 'DMNK1SMBM', airnova: 'D1LC5T2BM', cosori: 'D0KR8LMBM',
  xiaomi: 'DX04WPMBM', star: 'D6HF3RBBM', max: 'DLBY1YYBM', grill: 'DHDMGJMBM', philips: 'D1609JMBM',
};
const O = '/sites/bermo-work/public/imagini/articole/cele-mai-bune-friteuze-cu-aer';
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

// HERO — trio (centru dominant = alegerea; taiate de fundal)
const [cos, meg, nin] = await G.taieLista([R.cosori, R.mega, R.ninja], 0.03);
await G.heroTrio({ imagini: [cos, meg, nin], out: `${O}/hero.webp` });

// INLINE 1 — stat: litri -> persoane
await G.inlineStat({ titlu: 'Cati litri iti trebuie', items: [
  { src: R.star, valoare: '2,6 L', eticheta: '1-2 persoane', nume: 'Star-Light' },
  { src: R.max, valoare: '5 L', eticheta: '2-3 persoane', nume: 'Tefal Max' },
  { src: R.mega, valoare: '7,5 L', eticheta: '4-6 persoane', nume: 'Tefal Mega' },
  { src: R.ninja, valoare: '9,5 L', eticheta: 'familie mare', nume: 'Ninja 2 sertare' },
], caption: 'Sub 4 litri pentru 1-2 persoane; 5-9 litri daca gatesti pentru o familie', out: `${O}/litri.webp` });

// INLINE 2 — compare: 3 bugete
await G.inlineCompare({ items: [
  { src: R.airnova, nume: 'Airnova 4.8 L', valoare: '199 lei · 4.8★', sub: 'buget, familie mica' },
  { src: R.mega, nume: 'Tefal Mega 7.5 L', valoare: '499 lei · 4.9★', sub: 'alegerea noastra' },
  { src: R.ninja, nume: 'Ninja DualZone', valoare: '1.400 lei · 4.8★', sub: 'premium, 2 sertare' },
], caption: 'Trei friteuze bune pe trei bugete, de la un sertar simplu la doua zone independente', out: `${O}/top3.webp` });

// INLINE 3 — checklist: ce primesti pe niveluri
await G.inlineChecklist({ produse: [
  { src: R.star, nume: 'Star-Light 2.6L' }, { src: R.mega, nume: 'Tefal Mega 7.5L' }, { src: R.ninja, nume: 'Ninja DualZone' },
], functii: [
  { eticheta: 'Control digital si presetari', valori: [true, true, true] },
  { eticheta: 'Capacitate pentru o familie', valori: [false, true, true] },
  { eticheta: 'Doua sertare independente', valori: [false, false, true] },
  { eticheta: 'Gatesti doua feluri odata', valori: [false, false, true] },
], caption: 'Ce castigi pe masura ce urci in gama', out: `${O}/dotari.webp` });

console.log('gata', O);
