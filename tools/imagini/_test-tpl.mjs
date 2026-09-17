import * as G from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
const d = JSON.parse(readFileSync('/tmp/bermo-dump.json'));
const byId = (id) => d.products.find((p) => p.id === id);
const url = (p) => (p.images || [])[0];
const ids = ['DCLH27YBM', 'DTRPLMYBM', 'DGJ5KY2BM', 'DWH95PYBM', 'DZGFKBYBM', 'D5YSGRYBM'];
const I = {};
for (const id of ids) I[id] = await G.descarca(url(byId(id)));
const O = '/tmp/tpl'; mkdirSync(O, { recursive: true });
const [b9, hein, bosch, s11, slim, tcl] = await G.taieLista(ids.map((id) => I[id]), 0.03);

// HERO (fara text)
await G.heroPodium({ imagini: [bosch, b9, tcl], out: `${O}/hero-podium.webp` });
await G.heroOffset({ imagini: [b9, bosch], out: `${O}/hero-offset.webp` });
await G.heroDuo({ imagini: [b9, tcl], out: `${O}/hero-duo.webp` });
await G.heroHalo({ imagine: b9, out: `${O}/hero-halo.webp` });
await G.heroMosaic({ imagini: [b9, bosch, tcl, hein], out: `${O}/hero-mosaic.webp` });

// INLINE (cu text)
await G.inlineVs({ a: { src: I.DCLH27YBM, nume: 'Samsung 9 kg', sub: 'alegerea noastra' }, b: { src: I.DGJ5KY2BM, nume: 'Bosch 8 kg', sub: 'liniste si constructie' },
  randuri: [{ eticheta: 'Capacitate', a: '9 kg', b: '8 kg' }, { eticheta: 'Zgomot spalare', a: '55 dB', b: '52 dB' }, { eticheta: 'Pret', a: '1.899 lei', b: '2.499 lei' }],
  caption: 'Dotare pe leu vs liniste si constructie', out: `${O}/in-vs.webp` });
await G.inlineSpecs({ produse: [{ src: I.DCLH27YBM, nume: 'Samsung 9 kg' }, { src: I.DTRPLMYBM, nume: 'Heinner 8 kg' }, { src: I.DGJ5KY2BM, nume: 'Bosch 8 kg' }, { src: I.D5YSGRYBM, nume: 'TCL 11 kg' }],
  specs: [{ eticheta: 'Capacitate', valori: ['9 kg', '8 kg', '8 kg', '11 kg'] }, { eticheta: 'Clasa energetica', valori: ['A', 'A', 'A', 'A'] }, { eticheta: 'Centrifugare', valori: ['1400', '1400', '1400', '1400'] }, { eticheta: 'Adancime', valori: ['63,5', '54', '59', '65'], hl: true }, { eticheta: 'Pret orientativ', valori: ['1.899', '1.580', '2.499', '1.700'] }],
  caption: 'Adancimea decide daca masina incape', out: `${O}/in-specs.webp` });
await G.inlineStat({ titlu: 'Cat de mult incarci dintr-o data', items: [
  { src: I.DZGFKBYBM, valoare: '7 kg', eticheta: '1-3 persoane', nume: 'Heinner slim' },
  { src: I.DCLH27YBM, valoare: '9 kg', eticheta: '3-4 persoane', nume: 'Samsung 9' },
  { src: I.D5YSGRYBM, valoare: '11 kg', eticheta: '5+ persoane', nume: 'TCL 11' }],
  caption: 'Alege capacitatea dupa cati sunteti in casa', out: `${O}/in-stat.webp` });
await G.inlineChecklist({ produse: [{ src: I.DCLH27YBM, nume: 'Samsung 9' }, { src: I.DTRPLMYBM, nume: 'Heinner 8' }, { src: I.DGJ5KY2BM, nume: 'Bosch 8' }],
  functii: [{ eticheta: 'Motor inverter', valori: [true, true, true] }, { eticheta: 'Abur', valori: [false, false, true] }, { eticheta: 'Control WiFi', valori: [true, false, false] }, { eticheta: 'Program rapid', valori: [true, true, true] }],
  caption: 'Ce dotari are fiecare', out: `${O}/in-checklist.webp` });
await G.inlineGauge({ titlu: 'Nota medie de la cumparatori', unitate: '(din 10)', items: [
  { src: I.DTRPLMYBM, nume: 'Heinner 8', valoare: 9.2, sub: '230 recenzii' },
  { src: I.DCLH27YBM, nume: 'Samsung 9', valoare: 9.4, sub: '139 recenzii' },
  { src: I.DGJ5KY2BM, nume: 'Bosch 8', valoare: 9.1, sub: '149 recenzii' }],
  caption: 'Note reale, nu impresii', out: `${O}/in-gauge.webp` });
await G.inlineRange({ titlu: 'Pozitionare pe pret', unitate: 'lei', min: 1400, max: 2700, items: [
  { src: I.DZGFKBYBM, nume: 'Heinner slim', valoare: 1461, eticheta: '1.461' },
  { src: I.DCLH27YBM, nume: 'Samsung 9', valoare: 1899, eticheta: '1.899' },
  { src: I.DGJ5KY2BM, nume: 'Bosch 8', valoare: 2499, eticheta: '2.499' }],
  caption: 'De la buget la premium', out: `${O}/in-range.webp` });
console.log('gata /tmp/tpl');
