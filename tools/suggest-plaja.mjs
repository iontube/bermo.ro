#!/usr/bin/env node
// bermo — culege Google Autosuggest RO pe TOATA plaja eMAG (nu doar cele 6 categorii curente)
// si scoate termeni cu sanse reale de rankare (long-tail, intentie clara, nu capete).
// Rezultat: research/suggest_plaja.json + research/suggest_plaja.md
import fs from 'fs';
import path from 'path';

const OUT_DIR = '/sites/bermo-work/research';
fs.mkdirSync(OUT_DIR, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fara = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

async function suggest(q, tries = 3) {
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=ro&gl=ro&q=${encodeURIComponent(q)}`;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36' } });
      if (!r.ok) { await sleep(500 * (i + 1)); continue; }
      const j = JSON.parse(await r.text());
      return Array.isArray(j?.[1]) ? j[1].map(fara) : [];
    } catch { await sleep(500 * (i + 1)); }
  }
  return [];
}

// ---------------------------------------------------------------------------
// SEEDURI = toata plaja eMAG. [nume-cautare, departament, comision%]
// Comisionul e din lista Profitshare (aug 2026); 3.00 = comision standard (categorie nelistata).
// ---------------------------------------------------------------------------
const SEEDS = [
  // --- ILUMINAT SI ELECTRICE (9,10%) — teritoriu complet neacoperit de bermo
  ['lustra', 'Iluminat', 9.10], ['veioza', 'Iluminat', 9.10], ['lampa de birou', 'Iluminat', 9.10],
  ['banda led', 'Iluminat', 9.10], ['spot led', 'Iluminat', 9.10], ['bec led', 'Iluminat', 9.10],
  ['lampa solara de gradina', 'Iluminat', 9.10], ['proiector led exterior', 'Iluminat', 9.10],
  ['prelungitor', 'Iluminat', 9.10], ['priza inteligenta', 'Iluminat', 9.10],
  ['aplica de perete', 'Iluminat', 9.10], ['lampadar', 'Iluminat', 9.10],
  ['multimetru', 'Iluminat', 9.10], ['sonerie wireless', 'Iluminat', 9.10],

  // --- BUCATARIE VASE SI USTENSILE (9,00%) — bermo are doar electrocasnicele
  ['set oale', 'Vase si ustensile', 9.00], ['tigaie', 'Vase si ustensile', 9.00],
  ['set cutite', 'Vase si ustensile', 9.00], ['oala sub presiune', 'Vase si ustensile', 9.00],
  ['termos', 'Vase si ustensile', 9.00], ['cana filtranta', 'Vase si ustensile', 9.00],
  ['set tacamuri', 'Vase si ustensile', 9.00], ['tocator', 'Vase si ustensile', 9.00],
  ['vase termorezistente', 'Vase si ustensile', 9.00], ['tava de copt', 'Vase si ustensile', 9.00],
  ['recipiente alimentare', 'Vase si ustensile', 9.00], ['storcator de citrice', 'Vase si ustensile', 9.00],
  ['masa de calcat', 'Vase si ustensile', 9.00], ['uscator de rufe pliant', 'Vase si ustensile', 9.00],
  ['cos de rufe', 'Vase si ustensile', 9.00], ['mop', 'Vase si ustensile', 9.00],
  ['filtru de apa', 'Vase si ustensile', 9.00],

  // --- ACCESORII TV (10,90%) — cel mai mare comision din tot programul
  ['suport tv de perete', 'Accesorii TV', 10.90], ['cablu hdmi', 'Accesorii TV', 10.90],
  ['telecomanda universala', 'Accesorii TV', 10.90], ['kit curatare ecran', 'Accesorii TV', 10.90],

  // --- ACCESORII TELEFON (9,00%) — bermo are deja subcategoriile
  ['husa telefon', 'Accesorii telefon', 9.00], ['folie de protectie telefon', 'Accesorii telefon', 9.00],
  ['incarcator telefon', 'Accesorii telefon', 9.00], ['baterie externa', 'Accesorii telefon', 9.00],
  ['suport telefon auto', 'Accesorii telefon', 6.40], ['card de memorie', 'Accesorii telefon', 9.00],
  ['cablu de date', 'Accesorii telefon', 9.00],

  // --- INGRIJIRE SI COSMETICE (6,80-8,40%)
  ['placa de indreptat parul', 'Ingrijire', 6.70], ['uscator de par', 'Ingrijire', 6.70],
  ['perie rotativa', 'Ingrijire', 6.70], ['aparat de tuns', 'Ingrijire', 6.70],
  ['aparat de ras', 'Ingrijire', 6.70], ['epilator', 'Ingrijire', 6.70],
  ['periuta de dinti electrica', 'Ingrijire', 6.70], ['dus bucal', 'Ingrijire', 6.70],
  ['aparat de masaj', 'Ingrijire', 6.70], ['cantar corporal', 'Ingrijire', 6.70],
  ['sampon', 'Ingrijire', 8.40], ['crema de fata', 'Ingrijire', 6.80],
  ['parfum barbati', 'Ingrijire', 5.60], ['parfum dama', 'Ingrijire', 5.60],
  ['crema cu protectie solara', 'Ingrijire', 8.40], ['trimmer barba', 'Ingrijire', 8.40],

  // --- CURATENIE SI TEXTILE CASA (7,60%)
  ['lenjerie de pat', 'Textile casa', 7.60], ['pilota', 'Textile casa', 7.60],
  ['perna', 'Textile casa', 7.60], ['prosoape de baie', 'Textile casa', 7.60],
  ['draperii', 'Textile casa', 7.60], ['covor', 'Textile casa', 7.60],
  ['jaluzele', 'Textile casa', 7.60], ['detergent de rufe', 'Textile casa', 5.90],
  ['aspirator de mana', 'Textile casa', 5.70],

  // --- PAPETARIE SI SCOALA (8,00%) — sezon august-septembrie
  ['ghiozdan', 'Scoala si birou', 8.00], ['penar', 'Scoala si birou', 8.00],
  ['rechizite scolare', 'Scoala si birou', 8.00], ['caiete', 'Scoala si birou', 8.00],
  ['stilou', 'Scoala si birou', 8.00], ['creioane colorate', 'Scoala si birou', 8.00],
  ['tabla magnetica', 'Scoala si birou', 8.00], ['distrugator de documente', 'Scoala si birou', 8.00],
  ['laminator', 'Scoala si birou', 8.00], ['calculator de birou stiintific', 'Scoala si birou', 8.00],

  // --- AUTO (5,30-8,00%)
  ['covorase auto', 'Auto', 8.00], ['aspirator auto', 'Auto', 8.00],
  ['camera auto', 'Auto', 6.20], ['tester baterie auto', 'Auto', 8.00],
  ['compresor auto', 'Auto', 8.00], ['husa auto', 'Auto', 8.00],
  ['redresor auto', 'Auto', 8.00], ['baterie auto', 'Auto', 6.20],
  ['statie radio cb', 'Auto', 6.20], ['navigatie gps', 'Auto', 6.20],
  ['cutie portbagaj', 'Auto', 8.00], ['scaun auto copii', 'Auto', 5.90],

  // --- SCULE SI BRICOLAJ (6,50-7,30%)
  ['masina de gaurit', 'Scule', 7.30], ['surubelnita cu acumulator', 'Scule', 7.30],
  ['bormasina', 'Scule', 7.30], ['polizor unghiular', 'Scule', 6.50],
  ['fierastrau electric', 'Scule', 7.30], ['aparat de sudura', 'Scule', 6.50],
  ['compresor', 'Scule', 6.50], ['generator curent', 'Scule', 6.50],
  ['trusa scule', 'Scule', 6.50], ['nivela laser', 'Scule', 5.30],
  ['scara', 'Scule', 6.50], ['pistol de lipit', 'Scule', 6.50],
  ['aspirator industrial', 'Scule', 5.30], ['masina de spalat cu presiune', 'Scule', 8.00],

  // --- GRADINA (5,30-6,30%)
  ['masina de tuns iarba', 'Gradina', 5.30], ['trimmer gradina', 'Gradina', 5.30],
  ['motocoasa', 'Gradina', 5.30], ['drujba', 'Gradina', 5.30],
  ['motosapa', 'Gradina', 5.30], ['pompa de gradina', 'Gradina', 5.30],
  ['hidrofor', 'Gradina', 5.30], ['gratar', 'Gradina', 6.30],
  ['piscina', 'Gradina', 6.30], ['mobilier de gradina', 'Gradina', 6.30],
  ['umbrela de gradina', 'Gradina', 6.30], ['casuta de gradina', 'Gradina', 6.30],
  ['foarfeca de gradina', 'Gradina', 5.30], ['sistem de irigatii', 'Gradina', 5.30],
  ['ghiveci', 'Gradina', 6.30],

  // --- INCALZIRE SI INSTALATII (5,80%)
  ['centrala termica', 'Incalzire', 5.80], ['boiler', 'Incalzire', 5.80],
  ['calorifer electric', 'Incalzire', 4.80], ['convector electric', 'Incalzire', 4.80],
  ['aeroterma', 'Incalzire', 4.80], ['pompa de caldura', 'Incalzire', 5.80],
  ['panouri solare', 'Incalzire', 5.80], ['baterie de bucatarie', 'Incalzire', 5.80],
  ['cabina de dus', 'Incalzire', 5.80], ['chiuveta', 'Incalzire', 5.80],
  ['dezumidificator', 'Incalzire', 4.80], ['purificator de aer', 'Incalzire', 4.80],
  ['umidificator', 'Incalzire', 4.80], ['aer conditionat', 'Incalzire', 4.80],

  // --- MOBILA (5,60-7,10%)
  ['canapea extensibila', 'Mobila', 5.60], ['pat', 'Mobila', 5.60],
  ['saltea', 'Mobila', 7.10], ['topper saltea', 'Mobila', 7.10],
  ['dulap', 'Mobila', 5.60], ['birou', 'Mobila', 5.60],
  ['scaun de birou', 'Mobila', 5.60], ['comoda', 'Mobila', 5.60],
  ['biblioteca', 'Mobila', 5.60], ['masa de bucatarie', 'Mobila', 5.60],
  ['fotoliu', 'Mobila', 5.60], ['dulap pantofi', 'Mobila', 5.60],

  // --- SUPRAVEGHERE SI SMART HOME (4,80-7,30%)
  ['camera de supraveghere', 'Supraveghere', 7.30], ['kit supraveghere', 'Supraveghere', 7.30],
  ['videointerfon', 'Supraveghere', 6.80], ['senzor de miscare', 'Supraveghere', 4.80],
  ['yala inteligenta', 'Supraveghere', 7.30], ['sistem de alarma', 'Supraveghere', 4.80],
  ['automatizare poarta', 'Supraveghere', 7.30],

  // --- BEBE SI COPII (5,90-7,40%)
  ['carucior copii', 'Bebe si copii', 5.90], ['patut bebe', 'Bebe si copii', 7.40],
  ['scaun de masa bebe', 'Bebe si copii', 5.90], ['sterilizator biberoane', 'Bebe si copii', 5.90],
  ['monitor bebe', 'Bebe si copii', 8.10], ['trotineta copii', 'Bebe si copii', 6.90],
  ['trambulina', 'Bebe si copii', 7.40], ['tobogan copii', 'Bebe si copii', 7.40],
  ['lego', 'Bebe si copii', 7.40], ['puzzle', 'Bebe si copii', 7.40],
  ['bicicleta copii', 'Bebe si copii', 4.70],

  // --- SPORT (4,70-8,00%)
  ['banda de alergat', 'Sport', 6.60], ['bicicleta fitness', 'Sport', 7.00],
  ['aparat multifunctional fitness', 'Sport', 8.00], ['gantere', 'Sport', 6.60],
  ['bicicleta', 'Sport', 4.70], ['bicicleta electrica', 'Sport', 4.70],
  ['trotineta electrica', 'Sport', 6.90], ['cort', 'Sport', 9.00],
  ['sac de dormit', 'Sport', 6.90], ['lanseta', 'Sport', 6.90],
  ['ceas sport', 'Sport', 6.90], ['saltea fitness', 'Sport', 6.60],

  // --- ANIMALE (6,10%)
  ['hrana caini', 'Animale', 6.10], ['hrana pisici', 'Animale', 6.10],
  ['litiera', 'Animale', 6.10], ['acvariu', 'Animale', 6.10],
  ['cusca caine', 'Animale', 6.10], ['ham caine', 'Animale', 6.10],

  // --- ELECTROCASNICE MARI SI MICI (3,00-5,70%) — bermo are deja o parte
  ['masina de spalat rufe', 'Electrocasnice', 3.00], ['frigider', 'Electrocasnice', 3.00],
  ['masina de spalat vase', 'Electrocasnice', 3.00], ['uscator de rufe', 'Electrocasnice', 3.00],
  ['cuptor incorporabil', 'Electrocasnice', 5.70], ['plita inductie', 'Electrocasnice', 5.70],
  ['hota', 'Electrocasnice', 5.70], ['aspirator robot', 'Electrocasnice', 5.70],
  ['aspirator vertical', 'Electrocasnice', 5.70], ['espressor', 'Electrocasnice', 5.70],
  ['friteuza cu aer', 'Electrocasnice', 5.70], ['robot de bucatarie', 'Electrocasnice', 5.70],
  ['blender', 'Electrocasnice', 5.70], ['fier de calcat', 'Electrocasnice', 5.70],
  ['multicooker', 'Electrocasnice', 5.70], ['storcator de fructe', 'Electrocasnice', 5.70],
  ['masina de paine', 'Electrocasnice', 5.70], ['masina de cusut', 'Electrocasnice', 5.70],
  ['aparat de vidat', 'Electrocasnice', 5.70], ['gratar electric', 'Electrocasnice', 5.70],

  // --- IT / TV (1,00-4,60%) — comision mic, dar volum; le tinem pt acoperire
  ['laptop', 'IT si TV', 1.70], ['telefon', 'IT si TV', 1.00],
  ['televizor', 'IT si TV', 1.40], ['monitor', 'IT si TV', 3.00],
  ['casti wireless', 'IT si TV', 5.00], ['boxa bluetooth', 'IT si TV', 3.60],
  ['soundbar', 'IT si TV', 3.60], ['imprimanta', 'IT si TV', 2.70],
  ['router wifi', 'IT si TV', 7.30], ['scaun gaming', 'IT si TV', 4.60],
  ['tastatura mecanica', 'IT si TV', 4.60], ['mouse gaming', 'IT si TV', 4.60],
  ['ssd', 'IT si TV', 2.40], ['smartwatch', 'IT si TV', 2.90],
];

// ---------------------------------------------------------------------------
// TIPARE — nu doar "cel mai bun": si informational, comparativ, de utilizare
// ---------------------------------------------------------------------------
const TIPARE = [
  ['{}', 'radacina'],
  ['cele mai bune {}', 'roundup'],
  ['cel mai bun {}', 'roundup'],
  ['{} pareri', 'recenzie'],
  ['{} sau', 'comparatie'],
  ['ce {} sa cumpar', 'sfat'],
  ['cum aleg {}', 'sfat'],
  ['{} pentru', 'segment'],
  ['{} cu', 'segment'],
  ['{} ieftin', 'pret'],
  ['{} pana in', 'pret'],
  ['cat consuma {}', 'informational'],
  ['cum se curata {}', 'informational'],
];

// ---------------------------------------------------------------------------
const rez = new Map(); // termen -> {dep, com, seed, tipuri:Set, poz:[], nSeed:Set}
function adauga(termen, seed, dep, com, tip, poz) {
  const t = fara(termen);
  if (!t || t.length < 6) return;
  const e = rez.get(t) || { dep, com, seed, tipuri: new Set(), poz: [], seeds: new Set() };
  e.tipuri.add(tip); e.poz.push(poz); e.seeds.add(seed);
  if (com > e.com) { e.com = com; e.dep = dep; e.seed = seed; }
  rez.set(t, e);
}

const coada = [];
for (const [seed, dep, com] of SEEDS)
  for (const [tpl, tip] of TIPARE) coada.push([tpl.replace('{}', seed), seed, dep, com, tip]);

console.error(`[suggest] ${SEEDS.length} seeduri x ${TIPARE.length} tipare = ${coada.length} interogari`);
let n = 0, gol = 0;
for (const [q, seed, dep, com, tip] of coada) {
  const s = await suggest(q);
  if (!s.length) gol++;
  s.forEach((x, i) => adauga(x, seed, dep, com, tip, i));
  if (++n % 100 === 0) console.error(`  ${n}/${coada.length} — ${rez.size} termeni unici (${gol} interogari goale)`);
  await sleep(90);
}

// ---------------------------------------------------------------------------
// SCOR DE RANKABILITATE (proxy structural — nu inlocuieste verificarea SERP)
// ---------------------------------------------------------------------------
const CAP = /^(cel mai bun|cele mai bune|cea mai buna|cei mai buni)\s+\S+$/; // "cele mai bune X" gol = cap
const ANI = /\b(20\d\d)\b/;
const rows = [...rez.entries()].map(([t, e]) => {
  const cuv = t.split(' ').length;
  const pozMed = e.poz.reduce((a, b) => a + b, 0) / e.poz.length;
  let scor = 0;
  scor += Math.min(cuv - 2, 5) * 8;                    // long-tail = mai usor de rankat
  if (CAP.test(t)) scor -= 25;                          // termen-cap gol = brutal
  if (/\b(pentru|cu|fara|sub|pana in|de la)\b/.test(t)) scor += 12; // calificator = intentie clara
  if (/\d/.test(t) && !ANI.test(t)) scor += 10;         // prag de pret/dimensiune
  if (ANI.test(t)) scor -= 5;                           // an = concurenta pe freshness
  if (e.tipuri.has('informational')) scor += 14;        // cerere info, concurenta comerciala slaba
  if (e.tipuri.has('comparatie')) scor += 10;
  if (e.tipuri.has('recenzie')) scor += 6;
  scor += Math.max(0, 8 - pozMed) * 2;                  // sus in suggest = cerere reala
  scor += (e.seeds.size - 1) * 5;                       // apare din mai multe seeduri
  return {
    termen: t, dep: e.dep, com: e.com, seed: e.seed, cuv,
    tipuri: [...e.tipuri].join('+'), pozMed: +pozMed.toFixed(1), nSeed: e.seeds.size, scor,
  };
}).sort((a, b) => b.scor - a.scor || b.com - a.com);

fs.writeFileSync(path.join(OUT_DIR, 'suggest_plaja.json'), JSON.stringify(rows));

// raport markdown pe departamente
let md = `# bermo — autosuggest pe toata plaja eMAG\n\n`;
md += `${rows.length} termeni unici din ${coada.length} interogari, ${SEEDS.length} seeduri.\n`;
md += `Scorul = proxy structural de rankabilitate (long-tail, calificatori, intentie), NU verificare SERP.\n\n`;
const peDep = {};
for (const r of rows) (peDep[r.dep] = peDep[r.dep] || []).push(r);
for (const [dep, arr] of Object.entries(peDep).sort((a, b) => b[1].length - a[1].length)) {
  const com = Math.max(...arr.map(r => r.com));
  md += `\n## ${dep} — ${arr.length} termeni, comision pana la ${com.toFixed(2)}%\n\n`;
  for (const r of arr.slice(0, 40)) md += `- **${r.scor}** · ${r.termen} · _${r.tipuri}_ (com ${r.com.toFixed(2)}%)\n`;
}
fs.writeFileSync(path.join(OUT_DIR, 'suggest_plaja.md'), md);

console.error(`\ngata: ${rows.length} termeni unici`);
console.log('\n=== TOP 60 dupa scor de rankabilitate ===');
for (const r of rows.slice(0, 60))
  console.log(String(r.scor).padStart(4), '|', String(r.com.toFixed(2) + '%').padStart(6), '|', r.dep.padEnd(18), '|', r.termen.slice(0, 58).padEnd(58), '|', r.tipuri);
