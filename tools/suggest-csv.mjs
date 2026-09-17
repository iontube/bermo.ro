#!/usr/bin/env node
// Scoate TOTI termenii culesi intr-un CSV lizibil in Excel.
// Separator ';' + BOM UTF-8 + zecimala cu virgula = se deschide corect in Excel RO.
import fs from 'fs';

const rows = JSON.parse(fs.readFileSync('/sites/bermo-work/research/suggest_plaja.json', 'utf8'));

const STOP = new Set(['de', 'cu', 'pentru', 'la', 'in', 'pe', 'si', 'a', 'un', 'o']);
const radacina = seed => {
  const w = seed.split(' ').filter(x => !STOP.has(x));
  return (w[0] || seed).replace(/(uri|ure|ele|ile|lor|le|i|e)$/, '');
};
const COD = /\b[a-z]{1,5}\d{2,}[a-z0-9]*\b|\b\d{3,}[a-z]{1,4}\b/;
const BRAND = /\b(tefal|philips|bosch|samsung|lg|xiaomi|instant|intex|frezyderm|anthelios|skil|kaminer|diplomat|sonicare|saunier duval|whirlpool|beko|arctic|heinner|tesla|hisense|tcl|zanussi|electrolux|gorenje|indesit|hotpoint|delonghi|krups|braun|rowenta|kärcher|karcher|makita|dewalt|stanley|einhell|ryobi|husqvarna|stihl|nike|adidas|puma|sprayground)\b/;
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

const out = rows.map(r => {
  const t = r.termen, cuv = t.split(' ').length;
  let forma = null, motiv = '';
  for (const [re, f] of FORME) if (re.test(t)) { forma = f; break; }

  if (!t.includes(radacina(r.seed))) motiv = 'nu contine radacina seedului';
  else if (cuv > 8) motiv = 'prea lung (titlu de produs)';
  else if (COD.test(t)) motiv = 'cod de model';
  else if (BRAND.test(t)) motiv = 'nume de brand';
  else if (/\b(emag|altex|olx|dedeman|pret|preturi)\b/.test(t)) motiv = 'termen de magazin';
  else if (!forma) motiv = 'fara forma de intentie clara';

  const pastrat = !motiv;
  let scor = 0;
  if (pastrat) {
    const CAP = /^(cel mai bun|cele mai bune|cea mai buna|cei mai buni)\s+\S+$/.test(t);
    if (forma === 'informational') scor += 40;
    if (forma === 'comparatie') scor += 34;
    if (forma === 'segment') scor += 26;
    if (forma === 'pret') scor += 22;
    if (forma === 'recenzie') scor += 18;
    if (forma === 'roundup') scor += CAP ? 2 : 16;
    scor += Math.min(cuv - 2, 4) * 4;
    scor += Math.max(0, 8 - r.pozMed) * 2;
    scor += (r.nSeed - 1) * 4;
  }
  return {
    Termen: t,
    Departament: r.dep,
    Intentie: forma || '',
    Seed: r.seed,
    'Comision %': r.com,
    Scor: pastrat ? scor : '',
    Cuvinte: cuv,
    'Pozitie in suggest': r.pozMed,
    'Nr seeduri': r.nSeed,
    Pastrat: pastrat ? 'DA' : 'NU',
    'Motiv excludere': motiv,
  };
});

// ordonare: intai cei pastrati, pe departament, apoi scor descrescator
const rang = { DA: 0, NU: 1 };
out.sort((a, b) =>
  rang[a.Pastrat] - rang[b.Pastrat] ||
  a.Departament.localeCompare(b.Departament, 'ro') ||
  (b.Scor || 0) - (a.Scor || 0) ||
  a.Termen.localeCompare(b.Termen, 'ro'));

const CAMPURI = Object.keys(out[0]);
const cel = v => {
  if (typeof v === 'number') return String(v).replace('.', ',');   // zecimala RO
  const s = String(v ?? '');
  return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const csv = '﻿' + [CAMPURI.join(';'), ...out.map(r => CAMPURI.map(c => cel(r[c])).join(';'))].join('\r\n');
fs.writeFileSync('/sites/bermo-work/research/termeni-bermo.csv', csv);

const pastrati = out.filter(r => r.Pastrat === 'DA').length;
console.log('scris research/termeni-bermo.csv');
console.log('  randuri:', out.length, '| pastrati:', pastrati, '| exclusi:', out.length - pastrati);
const m = {};
for (const r of out) if (r.Pastrat === 'NU') m[r['Motiv excludere']] = (m[r['Motiv excludere']] || 0) + 1;
console.log('\nmotive de excludere:');
for (const [k, v] of Object.entries(m).sort((a, b) => b[1] - a[1])) console.log(' ', String(v).padStart(5), k);
