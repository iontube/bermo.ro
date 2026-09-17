// bermo.ro — genereaza Function CF pt cloak afiliere: /out/<id-emag> -> deeplink Profitshare.
// Deeplink Profitshare (cont partajat): l.profitshare.ro/lps/9/ZmA/?redirect=<emag_url_encodat>
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const produse = JSON.parse(readFileSync(fileURLToPath(new URL('../src/date/produse-emag.json', import.meta.url)), 'utf-8'));
const deeplink = (emagUrl) => `https://l.profitshare.ro/lps/9/ZmA/?redirect=${encodeURIComponent(emagUrl)}`;

const map = {};
for (const [id, p] of Object.entries(produse)) map[id] = deeplink(p.url);

// GARDA: fiecare cod de produs (cheie=) din articole TREBUIE sa aiba deeplink de afiliere.
// Altfel /out cade pe homepage si munca la articol e irosita (lectie 2026-07-24).
const artDir = fileURLToPath(new URL('../src/continut/articole', import.meta.url));
const lipsa = [];
for (const f of readdirSync(artDir).filter((x) => x.endsWith('.mdx'))) {
  const s = readFileSync(`${artDir}/${f}`, 'utf-8');
  for (const m of s.matchAll(/cheie="([A-Z0-9]{6,})"/g)) if (!map[m[1]]) lipsa.push(`${f}: ${m[1]}`);
}
if (lipsa.length) {
  console.error(`\n❌ STOP: ${lipsa.length} coduri de produs din articole NU au deeplink de afiliere (lipsesc din produse-emag.json):`);
  for (const l of lipsa) console.error(`   - ${l}`);
  console.error('Adauga-le in src/date/produse-emag.json (url + nume din dump) inainte de deploy.\n');
  process.exit(1);
}

const outDir = fileURLToPath(new URL('../functions/out', import.meta.url));
mkdirSync(outDir, { recursive: true });
const fn = `// AUTO-GENERAT. /out/<cheie> -> deeplink afiliere Profitshare (cloacat).
const MAP = ${JSON.stringify(map)};
export function onRequest(context) {
  const u = MAP[context.params.cheie];
  return Response.redirect(u || 'https://bermo.ro/', 302);
}
`;
writeFileSync(`${outDir}/[cheie].js`, fn);
console.log(`functions/out/[cheie].js: ${Object.keys(map).length} linkuri de afiliere cloacate`);
