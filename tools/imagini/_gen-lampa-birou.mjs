import { descarca, taieLista, heroPodium, inlineSpecs, inlineGauge } from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const cat = JSON.parse(readFileSync('/sites/bermo-work/research/emag-produse.json', 'utf8'));
const byId = (id) => cat.find((p) => p.id === id);
const url = (p) => ((p.images || [])[0] || '').replace(/&amp;/g, '&').split('?')[0];

const IDS = {
  copii: 'DHP13BYBM',
  elindor: 'DDJBW1MBM',
  huerler: 'D7XQZFMBM',
  littledomi: 'D6QCFMYBM',
  monitor: 'DV2TDCMBM',
  dasbo: 'DXX5FGYBM',
  dasboMic: 'DMMLXFYBM',
};
const NUME = {
  copii: 'lampa-de-birou-pentru-copii-ideas4comfort',
  elindor: 'lampa-de-birou-elindor-cu-incarcare-wireless',
  huerler: 'lampa-de-birou-led-dubla-huerler-ddl-003',
  littledomi: 'lampa-de-birou-led-littledomi-cu-clema',
  monitor: 'lampa-pentru-monitor-huerler-iglass-pro',
  dasbo: 'lampa-led-slim-dasbo-cu-senzor',
  dasboMic: 'lampa-led-slim-dasbo-compacta',
};
const O = '/sites/bermo-work/public/imagini/articole/lampa-de-birou-pentru-copii-scris-si-precizie';
const PROD = '/sites/bermo-work/public/imagini/produse';

const imgs = {};
for (const [k, id] of Object.entries(IDS)) {
  const src = await descarca(url(byId(id)));
  imgs[k] = src;
  const nume = `${NUME[k]}-${id.toLowerCase()}.webp`;
  await sharp({ create: { width: 600, height: 600, channels: 4, background: '#ffffff' } })
    .composite([{ input: await sharp(src).resize(560, 560, { fit: 'inside', background: '#ffffff' }).flatten({ background: '#ffffff' }).toBuffer(), gravity: 'center' }])
    .webp({ quality: 88 }).toFile(`${PROD}/${nume}`);
  console.log('produs', nume);
}

// HERO — heroPodium (nefolosit recent). CU decupaj: pozele de lampi au margini albe mari si
// altfel produsul pluteste mic in tile. Invers fata de prize, unde randarile de marketing dadeau pe afara.
await heroPodium({
  imagini: await taieLista([imgs.elindor, imgs.copii, imgs.dasbo], 0.03),
  out: `${O}/lampa-de-birou-cu-led.webp`, w: 1400, h: 720,
});
console.log('hero lampa-de-birou-cu-led.webp');

// INLINE 1 — ce cere fiecare activitate (inlineSpecs, nefolosit recent)
await inlineSpecs({
  produse: [
    { src: imgs.copii, nume: 'Teme, invatat' },
    { src: imgs.elindor, nume: 'Citit seara' },
    { src: imgs.huerler, nume: 'Unghii, desen' },
    { src: imgs.monitor, nume: 'Lucru la calculator' },
  ],
  specs: [
    { eticheta: 'Lumeni pe suprafata', valori: ['400-800', '200-400', 'peste 800', '100-200'] },
    { eticheta: 'Temperatura culorii', valori: ['4000-5000 K', '2700-3000 K', '5000-6000 K', 'reglabila'] },
    { eticheta: 'Redare culoare (CRI)', valori: ['peste 80', 'peste 80', 'peste 90', 'peste 80'], hl: true },
    { eticheta: 'Reglaj intensitate', valori: ['obligatoriu', 'obligatoriu', 'util', 'obligatoriu'] },
  ],
  caption: 'Din 31 de lampi verificate, niciuna nu declara CRI-ul, randul evidentiat.',
  out: `${O}/pe-activitati.webp`, w: 1100,
});
console.log('inline pe-activitati.webp');

// INLINE 2 — ce declara de fapt catalogul
await inlineGauge({
  titlu: 'Ce declara catalogul, din 31 de lampi de birou',
  max: 31,
  items: [
    { src: imgs.copii, nume: 'Temperatura culorii', valoare: 23 },
    { src: imgs.elindor, nume: 'Puterea in wati', valoare: 20 },
    { src: imgs.monitor, nume: 'Fluxul in lumeni', valoare: 11 },
    { src: imgs.huerler, nume: 'Redarea culorii', valoare: 0 },
  ],
  caption: 'Specificatia care conteaza la lucrul pe culoare nu apare nicaieri.',
  out: `${O}/ce-declara-catalogul.webp`, w: 1040, h: 480,
});
console.log('inline ce-declara-catalogul.webp');
