// Google autocomplete RO gatherer pentru bermo — seeduit pe categorii/subcategorii
import { writeFileSync } from 'node:fs';

// subcategorie -> termeni de cautare (nounul cum il scriu oamenii)
const SEEDS = [
  ['Telefoane', 'Smartphone', ['telefon', 'smartphone']],
  ['Telefoane', 'Casti', ['casti', 'casti wireless', 'casti bluetooth']],
  ['Telefoane', 'Huse', ['husa telefon']],
  ['Electrocasnice', 'Masini de spalat', ['masina de spalat', 'masina de spalat rufe', 'masina de spalat cu uscator']],
  ['Electrocasnice', 'Frigidere', ['frigider', 'combina frigorifica']],
  ['Electrocasnice', 'Aspiratoare robot', ['aspirator robot']],
  ['Electrocasnice', 'Aspiratoare', ['aspirator', 'aspirator vertical', 'aspirator fara fir']],
  ['Electrocasnice', 'Aer conditionat', ['aer conditionat']],
  ['Electrocasnice', 'Uscatoare', ['uscator de rufe']],
  ['Electrocasnice', 'Plite', ['plita inductie', 'masina de spalat vase']],
  ['IT si Laptop', 'Laptopuri', ['laptop', 'laptop gaming', 'ultrabook']],
  ['IT si Laptop', 'Componente', ['placa video', 'ssd', 'procesor']],
  ['IT si Laptop', 'Monitoare', ['monitor', 'monitor gaming']],
  ['IT si Laptop', 'Periferice', ['tastatura mecanica', 'mouse gaming', 'router wifi']],
  ['Bucatarie', 'Espressoare', ['espressor', 'espressor automat']],
  ['Bucatarie', 'Friteuze cu aer', ['friteuza cu aer', 'airfryer']],
  ['Bucatarie', 'Roboti de bucatarie', ['robot de bucatarie', 'robot bucatarie multifunctional']],
  ['Bucatarie', 'Blendere', ['blender', 'blender vertical']],
  ['TV si Foto', 'Televizoare', ['televizor', 'televizor 4k', 'smart tv']],
  ['TV si Foto', 'Soundbar', ['soundbar']],
  ['TV si Foto', 'Camere foto', ['camera foto', 'aparat foto']],
  ['TV si Foto', 'Proiectoare', ['videoproiector']],
  ['Casa si Gradina', 'Mobila', ['canapea extensibila', 'birou', 'pat']],
  ['Casa si Gradina', 'Saltele', ['saltea', 'saltea memory foam']],
  ['Casa si Gradina', 'Gradina', ['masina de tuns iarba', 'trimmer iarba']],
];

const MODIF = ['cel mai bun', 'cele mai bune', 'cea mai buna', 'cei mai buni'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function suggest(q) {
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=ro&gl=ro&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const j = await res.json();
    return (j[1] || []).map((s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''));
  } catch { return []; }
}

const rezultate = {}; // categorie -> subcategorie -> Map(sugestie -> count)
const freq = new Map(); // global freq

for (const [cat, sub, termeni] of SEEDS) {
  rezultate[cat] ??= {};
  rezultate[cat][sub] ??= new Map();
  const acc = rezultate[cat][sub];
  for (const t of termeni) {
    // interogari: term simplu + fiecare modificator inainte
    const queries = [t, ...MODIF.map((m) => `${m} ${t}`), `${t} pana in`];
    for (const q of queries) {
      const sug = await suggest(q);
      for (const s of sug) {
        // pastram doar sugestii cu intentie de cumparare/top sau prag pret
        if (/cel mai bun|cele mai bune|cea mai buna|cei mai buni|pana in|2026|top |ieftin|calitate/.test(s) || MODIF.some((m) => q.startsWith(m))) {
          acc.set(s, (acc.get(s) || 0) + 1);
          freq.set(s, (freq.get(s) || 0) + 1);
        }
      }
      await sleep(120);
    }
  }
  process.stderr.write(`. ${cat}/${sub} -> ${acc.size}\n`);
}

// output markdown grupat
let md = '# Termeni Google autocomplete RO — bermo (cel mai bun / cele mai bune)\n\n';
let total = 0;
for (const cat of Object.keys(rezultate)) {
  md += `\n## ${cat}\n`;
  for (const sub of Object.keys(rezultate[cat])) {
    const arr = [...rezultate[cat][sub].entries()].sort((a, b) => b[1] - a[1]).map((e) => e[0]);
    total += arr.length;
    md += `\n### ${sub} (${arr.length})\n`;
    md += arr.map((s) => `- ${s}`).join('\n') + '\n';
  }
}
writeFileSync('/tmp/claude-0/-sites/7efcd9f1-d83f-40b3-892c-7ca09b0f0c2e/scratchpad/termeni-bermo.md', md);

// top global (cele mai des aparute = cele mai cautate variante)
const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 60);
writeFileSync('/tmp/claude-0/-sites/7efcd9f1-d83f-40b3-892c-7ca09b0f0c2e/scratchpad/termeni-top.txt', top.map((e) => `${e[1]}\t${e[0]}`).join('\n'));
console.log(`TOTAL sugestii unice: ${total} | fisiere: termeni-bermo.md + termeni-top.txt`);
