import * as G from '/sites/bermo-work/tools/imagini/gen.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
import sharp from '/sites/bermo-work/node_modules/sharp/lib/index.js';

const d = JSON.parse(readFileSync('/tmp/bermo-dump.json'));
const byId = (id) => d.products.find((p) => p.id === id);
const url = (p) => (p.images || [])[0];
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'®™+]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');

// { cod: nume-card } (numele determina slugul imaginii produs)
const P = {
  D2H2VJYBM: 'TCL S45H, 2.0, 100 W',
  DL29BN3BM: 'Samsung HW-B450F, 2.1, 300 W',
  DB0VB9YBM: 'LG S60T, 3.1, 340 W',
  D44RJMMBM: 'Sony HT-S20R, 5.1, 400 W',
  DM0VB9YBM: 'LG S70TY, 3.1.1, 400 W',
  DCDC6HMBM: 'JBL SB170, 2.1, 220 W',
  DJPWFXMBM: 'Sonos Beam 2, Dolby Atmos',
  DKNM58MBM: 'Samsung HW-Q600C, 3.1.2, 360 W',
  DW29BN3BM: 'Samsung HW-Q990F, 11.1.4, 756 W',
};
const pslug = (code) => `${slug(P[code].split(',')[0])}-${code.toLowerCase()}`;
const O = '/sites/bermo-work/public/imagini/articole/cele-mai-bune-soundbaruri';
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

// HERO — heroRow (nefolosit inca), 3 bare reprezentative; variatie keyword (NU duplicat de folder)
const hr = await G.taieLista([R.DL29BN3BM, R.DM0VB9YBM, R.DW29BN3BM], 0.03);
await G.heroRow({ imagini: hr, out: `${O}/soundbar-pentru-televizor.webp` });

// INLINE 1 — inlineSpecs: tabel canale + putere + dotari (concept only)
await G.inlineSpecs({
  produse: [
    { src: R.D2H2VJYBM, nume: 'TCL S45H' },
    { src: R.DL29BN3BM, nume: 'Samsung HW-B450F' },
    { src: R.DM0VB9YBM, nume: 'LG S70TY' },
    { src: R.DW29BN3BM, nume: 'Samsung HW-Q990F' },
  ],
  specs: [
    { eticheta: 'Canale', valori: ['2.0', '2.1', '3.1.1', '11.1.4'] },
    { eticheta: 'Putere', valori: ['100 W', '300 W', '400 W', '756 W'], hl: true },
    { eticheta: 'Subwoofer', valori: ['Nu', 'Wireless', 'Wireless', 'Wireless'] },
    { eticheta: 'Dolby Atmos', valori: ['Virtual', 'Nu', 'Da', 'Da'] },
    { eticheta: 'HDMI eARC', valori: ['Nu', 'Nu', 'Da', 'Da'] },
  ],
  caption: 'De la o bara simpla 2.0 la un sistem 11.1.4 cu spate wireless si Atmos real',
  out: `${O}/canale-si-putere.webp`,
});

// INLINE 2 — inlineChecklist: dotari cheie
await G.inlineChecklist({
  produse: [
    { src: R.DL29BN3BM, nume: 'Samsung HW-B450F' },
    { src: R.DB0VB9YBM, nume: 'LG S60T' },
    { src: R.DJPWFXMBM, nume: 'Sonos Beam 2' },
    { src: R.DKNM58MBM, nume: 'Samsung HW-Q600C' },
  ],
  functii: [
    { eticheta: 'Subwoofer wireless inclus', valori: [true, true, false, true] },
    { eticheta: 'Dolby Atmos', valori: [false, false, true, true] },
    { eticheta: 'HDMI eARC', valori: [false, true, true, true] },
    { eticheta: 'WiFi / streaming direct', valori: [false, false, true, false] },
    { eticheta: 'Bluetooth', valori: [true, true, true, true] },
  ],
  caption: 'Subwoofer separat conteaza pentru bas; Atmos si eARC pentru film pe TV recent',
  out: `${O}/dotari-cheie.webp`,
});

// INLINE 3 — inlineRange: pret pe segmente
await G.inlineRange({
  titlu: 'Cat costa, pe segmente', unitate: 'lei, pret orientativ', min: 300, max: 3600,
  items: [
    { src: R.D2H2VJYBM, nume: 'TCL S45H', valoare: 360, eticheta: '360 lei' },
    { src: R.DB0VB9YBM, nume: 'LG S60T', valoare: 893, eticheta: '893 lei' },
    { src: R.DCDC6HMBM, nume: 'JBL SB170', valoare: 1464, eticheta: '1464 lei' },
    { src: R.DW29BN3BM, nume: 'Samsung HW-Q990F', valoare: 3500, eticheta: '3500 lei' },
  ],
  caption: 'Sub 700 lei prinzi un salt clar fata de boxele TV; peste 2500 lei intri in home cinema',
  out: `${O}/preturi-pe-segmente.webp`,
});

console.log('gata', O);
