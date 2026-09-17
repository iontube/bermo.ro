import * as G from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const d = JSON.parse(readFileSync('/tmp/bermo-dump.json'));
const byId = (id) => d.products.find((p) => p.id === id);
const url = (p) => (p.images || [])[0];
const IDS = {
  ztools: 'D65MQCMBM', acv: 'DKGZCWMBM', bim: 'DLF0V4BBM', grillchef: 'D4S5KTMBM',
  lehmann: 'D68N5XYBM', buz: 'D3WJN33BM', afum: 'DCK8LNBBM', mrgrill: 'DC5NP02BM',
};
const O = '/sites/bermo-work/public/imagini/articole/cele-mai-bune-gratare';
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

// HERO — spotlight (1 mare + 3 mici)
const [mg, zt, le, bz] = await G.taieLista([R.mrgrill, R.ztools, R.lehmann, R.buz], 0.04);
await G.heroSpotlight({ imagini: [mg, zt, le, bz], out: `${O}/hero.webp` });

// INLINE 1 — vs: carbune vs gaz (decizia cheie)
await G.inlineVs({
  a: { src: R.acv, nume: 'Gratar pe carbune', sub: 'de la ~130 lei' },
  b: { src: R.lehmann, nume: 'Gratar pe gaz', sub: 'de la ~800 lei' },
  randuri: [
    { eticheta: 'Gust', a: 'Afumat, autentic', b: 'Curat, fara fum' },
    { eticheta: 'Pornire', a: '20-30 minute', b: 'Rapid, instant' },
    { eticheta: 'Control caldura', a: 'Manual', b: 'Precis' },
    { eticheta: 'Pret', a: 'Mai ieftin', b: 'Mai scump' },
  ], caption: 'Carbunele castiga la gust si pret; gazul, la comoditate si viteza', out: `${O}/carbune-vs-gaz.webp` });

// INLINE 2 — compare: 3 tipuri pe bugete
await G.inlineCompare({ items: [
  { src: R.bim, nume: 'Gratar carbune mic', valoare: '134 lei · 4.4★', sub: 'buget, compact' },
  { src: R.ztools, nume: 'Gratar carbune 70x50', valoare: '503 lei · 4.7★', sub: 'alegerea noastra' },
  { src: R.lehmann, nume: 'Gratar pe gaz 3+1', valoare: '799 lei · 4.2★', sub: 'comod, fara fum' },
], caption: 'Trei gratare bune pe trei bugete, de la carbune compact la gaz cu arzatoare', out: `${O}/top3.webp` });

// INLINE 3 — checklist: ce dotari primesti
await G.inlineChecklist({ produse: [
  { src: R.bim, nume: 'Carbune mic' }, { src: R.grillchef, nume: 'Carbune cu capac' }, { src: R.lehmann, nume: 'Gaz premium' },
], functii: [
  { eticheta: 'Capac pentru gatit indirect', valori: [false, true, true] },
  { eticheta: 'Termometru incorporat', valori: [false, true, true] },
  { eticheta: 'Suprafata pentru 4-6 persoane', valori: [false, true, true] },
  { eticheta: 'Roti pentru mutat usor', valori: [false, false, true] },
], caption: 'Ce castigi pe masura ce urci de la un gratar simplu la unul complet', out: `${O}/dotari.webp` });

console.log('gata', O);
