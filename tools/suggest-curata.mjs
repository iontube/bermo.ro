#!/usr/bin/env node
// Curata rezultatul brut din suggest-plaja.mjs si scoate CANDIDATI DE ARTICOL.
// Problema rezolvata: scorul brut premia lungimea -> intrau titluri de produs si frame fara legatura.
// Aici pastram doar termeni cu FORMA de intentie clara si care contin radacina seedului.
import fs from 'fs';

const rows = JSON.parse(fs.readFileSync('/sites/bermo-work/research/suggest_plaja.json', 'utf8'));

// radacina seedului = cuvantul purtator (primul substantiv semnificativ)
const STOP = new Set(['de', 'cu', 'pentru', 'la', 'in', 'pe', 'si', 'a', 'un', 'o']);
const radacina = seed => {
  const w = seed.split(' ').filter(x => !STOP.has(x));
  return (w[0] || seed).replace(/(uri|ure|ele|ile|lor|le|i|e)$/, '');
};

// tokenuri care tradeaza titlu de produs (cod de model, capacitati de listing)
const COD = /\b[a-z]{1,5}\d{2,}[a-z0-9]*\b|\b\d{3,}[a-z]{1,4}\b/;
const BRAND = /\b(tefal|philips|bosch|samsung|lg|xiaomi|instant|intex|frezyderm|anthelios|skil|kaminer|diplomat|sonicare|saunier duval|whirlpool|beko|arctic|heinner|tesla|hisense|tcl|zanussi|electrolux|gorenje|indesit|hotpoint|delonghi|krups|braun|rowenta|kärcher|karcher|makita|dewalt|stanley|einhell|ryobi|husqvarna|stihl|nike|adidas|puma|sprayground)\b/;

// forme de intentie acceptate
const FORME = [
  [/^(cat|cate|cati) /, 'informational'],
  [/^(cum|de ce|cand|ce inseamna|ce se intampla) /, 'informational'],
  [/ (sau|vs) /, 'comparatie'],
  [/^(cel mai bun|cele mai bune|cea mai buna|cei mai buni|top) /, 'roundup'],
  [/ (pana in|sub) \d+ (lei|ron)\b/, 'pret'],
  [/\b(ieftin|ieftine|ieftina|calitate pret|raport calitate)\b/, 'pret'],
  [/ (pentru|cu|fara) /, 'segment'],
  [/ (pareri|review|recenzie|merita)\b/, 'recenzie'],
];

const out = [];
for (const r of rows) {
  const t = r.termen;
  const rad = radacina(r.seed);
  if (!t.includes(rad)) continue;                 // trebuie sa fie despre seed
  if (t.split(' ').length > 8) continue;          // peste 8 cuvinte = titlu de produs
  if (COD.test(t) || BRAND.test(t)) continue;     // cod de model / brand = pagina de produs, nu articol
  if (/\b(emag|altex|olx|dedeman|pret|preturi)\b/.test(t)) continue;

  let forma = null;
  for (const [re, f] of FORME) if (re.test(t)) { forma = f; break; }
  if (!forma) continue;

  // rescor pe forma, nu pe lungime
  const cuv = t.split(' ').length;
  const CAP = /^(cel mai bun|cele mai bune|cea mai buna|cei mai buni)\s+\S+$/.test(t);
  let scor = 0;
  if (forma === 'informational') scor += 40;      // cerere info = concurenta comerciala slaba
  if (forma === 'comparatie') scor += 34;
  if (forma === 'segment') scor += 26;
  if (forma === 'pret') scor += 22;
  if (forma === 'recenzie') scor += 18;
  if (forma === 'roundup') scor += CAP ? 2 : 16;  // roundup gol = termen-cap, brutal
  scor += Math.min(cuv - 2, 4) * 4;
  scor += Math.max(0, 8 - r.pozMed) * 2;          // sus in suggest = cerere reala
  scor += (r.nSeed - 1) * 4;
  out.push({ ...r, forma, scor });
}
out.sort((a, b) => b.scor - a.scor || b.com - a.com);

fs.writeFileSync('/sites/bermo-work/research/suggest_candidati.json', JSON.stringify(out));

// --- raport pe departamente
const peDep = {};
for (const r of out) (peDep[r.dep] = peDep[r.dep] || []).push(r);
let md = `# bermo — candidati de articol din autosuggest (curatat)\n\n`;
md += `${out.length} termeni pastrati din ${rows.length} brut. Filtre: contine radacina seedului, <=8 cuvinte,\n`;
md += `fara cod de model / brand, forma de intentie clara. Scorul premiaza intentia, nu lungimea.\n`;
md += `⚠️ Scorul e proxy structural — NU inlocuieste verificarea SERP.\n`;
for (const [dep, arr] of Object.entries(peDep).sort((a, b) => b[1].length - a[1].length)) {
  const com = Math.max(...arr.map(r => r.com));
  md += `\n## ${dep} — ${arr.length} termeni, comision pana la ${com.toFixed(2)}%\n\n`;
  for (const r of arr.slice(0, 50)) md += `- **${r.scor}** \`${r.forma}\` ${r.termen}\n`;
}
fs.writeFileSync('/sites/bermo-work/research/suggest_candidati.md', md);

console.log('pastrati:', out.length, 'din', rows.length);
console.log('\n=== pe FORMA ===');
const pf = {};
for (const r of out) pf[r.forma] = (pf[r.forma] || 0) + 1;
for (const [k, v] of Object.entries(pf).sort((a, b) => b[1] - a[1])) console.log(k.padEnd(16), v);
console.log('\n=== pe DEPARTAMENT (termeni | comision max) ===');
for (const [dep, arr] of Object.entries(peDep).sort((a, b) => b[1].length - a[1].length))
  console.log(dep.padEnd(20), String(arr.length).padStart(5), '|', Math.max(...arr.map(r => r.com)).toFixed(2) + '%');
console.log('\n=== TOP 50 candidati ===');
for (const r of out.slice(0, 50))
  console.log(String(r.scor).padStart(4), '|', String(r.com.toFixed(2) + '%').padStart(6), '|', r.forma.padEnd(14), '|', r.dep.padEnd(18), '|', r.termen);
