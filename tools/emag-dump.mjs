#!/usr/bin/env node
// Descarca TOATE produsele din colector, parcurgand paginile (dump-ul intr-o singura
// cerere depaseste limita de subrequests a Workerului peste ~1000 de produse).
//   node tools/emag-dump.mjs [fisier-iesire]
// Fara argument scrie research/emag-produse.json si afiseaza distributia pe collectTag.
import fs from 'fs';

const BASE = 'https://bermo-emag-collector.throbbing-tooth-cb05.workers.dev';
const K = 'bermo_emag_2026';
const OUT = process.argv[2] || '/sites/bermo-work/research/emag-produse.json';

const total = (await (await fetch(`${BASE}/keys?k=${K}`)).json()).count;
process.stderr.write(`colector: ${total} produse in KV\n`);

const produse = [];
let cursor = null, pagini = 0;
do {
  const u = `${BASE}/dump?k=${K}&limit=400${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
  const r = await fetch(u);
  if (!r.ok) throw new Error(`pagina ${pagini + 1}: HTTP ${r.status}`);
  const j = await r.json();
  produse.push(...j.products);
  cursor = j.cursor;
  pagini++;
  process.stderr.write(`  pagina ${pagini}: +${j.products.length} (total ${produse.length})\n`);
} while (cursor);

fs.mkdirSync(OUT.replace(/\/[^/]+$/, ''), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(produse));
process.stderr.write(`scris ${OUT}\n`);

if (produse.length !== total) process.stderr.write(`⚠️  ${total - produse.length} chei fara valoare citita\n`);

const t = {};
for (const p of produse) t[p.collectTag || '?'] = (t[p.collectTag || '?'] || 0) + 1;
console.log(`\n${produse.length} produse, ${Object.keys(t).length} taguri:\n`);
for (const [k, v] of Object.entries(t).sort((a, b) => b[1] - a[1]))
  console.log('  ' + String(v).padStart(4), k);
