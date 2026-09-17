#!/usr/bin/env node
// Calculeaza scorul fiecarui produs din date REALE (rating + numar de recenzii eMAG)
// si scrie src/date/scoruri.json (id -> {scor, rating, recenzii}).
// Inlocuieste scorurile tastate de mana din .mdx, care erau inventate.
//
// METODA (se explica si pe site, la /cum-alegem/):
// 1. Ratingul brut se corecteaza dupa cate recenzii are (medie bayesiana): un 5,0 din 3 recenzii
//    nu cantareste cat un 4,7 din 800. Se trage spre media categoriei cu o greutate de m recenzii.
// 2. Ratingurile eMAG sunt inghesuite sus (p25 4,41 / mediana 4,61 / p75 4,74), asa ca un simplu
//    "rating x 2" ar da tuturor 9,x si n-ar spune nimic. Scorul final e POZITIA produsului fata de
//    toate celelalte din aceeasi categorie, intinsa pe intervalul 6,0-9,8.
import fs from 'fs';

const SURSA = '/sites/bermo-work/research/emag-produse.json';
const IESIRE = '/sites/bermo-work/src/date/scoruri.json';
const M = 50;            // greutatea mediei de categorie, in recenzii
const MIN = 6.0, MAX = 9.8;

const produse = JSON.parse(fs.readFileSync(SURSA, 'utf8')).filter(p => p.rating);

// grupare pe categoria din care a fost colectat
const peTag = {};
for (const p of produse) (peTag[p.collectTag || 'altele'] = peTag[p.collectTag || 'altele'] || []).push(p);

const out = {};
for (const [tag, arr] of Object.entries(peTag)) {
  const media = arr.reduce((a, p) => a + p.rating, 0) / arr.length;
  const bayes = p => {
    const v = p.reviewCount || 0;
    return (v * p.rating + M * media) / (v + M);
  };
  const scoruri = arr.map(p => ({ p, b: bayes(p) })).sort((a, b) => a.b - b.b);
  scoruri.forEach((x, i) => {
    const pct = scoruri.length > 1 ? i / (scoruri.length - 1) : 0.5;
    out[x.p.id] = {
      scor: +(MIN + (MAX - MIN) * pct).toFixed(1),
      rating: +x.p.rating.toFixed(2),
      recenzii: x.p.reviewCount || 0,
      categorie: tag,
    };
  });
}

fs.writeFileSync(IESIRE, JSON.stringify(out, null, 0));
console.log('scris src/date/scoruri.json:', Object.keys(out).length, 'produse,', Object.keys(peTag).length, 'categorii');

// control: cum arata distributia pe o categorie
const proba = 'becuri';
if (peTag[proba]) {
  console.log(`\nverificare pe "${proba}" (${peTag[proba].length} produse):`);
  const r = peTag[proba].map(p => ({ n: p.name.slice(0, 44), ...out[p.id] })).sort((a, b) => b.scor - a.scor);
  for (const x of [...r.slice(0, 4), null, ...r.slice(-3)]) {
    if (!x) { console.log('   ...'); continue; }
    console.log('  ', String(x.scor).padStart(4), '| rating', String(x.rating).padStart(4), '|', String(x.recenzii).padStart(5), 'rec |', x.n);
  }
}
