#!/usr/bin/env node
// Starea articolelor bermo — pentru regulile de OSCILARE (nr. produse, template-uri, h2).
// Read-only: citeste .mdx si tools/imagini/_gen-*.mjs. Nu scrie nimic, nu atinge build-ul.
// Ruleaza: node tools/stare-articole.mjs        (tabel + sumar)
//          node tools/stare-articole.mjs --json (pentru alte scripturi)

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR_ART = join(ROOT, 'src/continut/articole');
const DIR_GEN = join(ROOT, 'tools/imagini');

// --- template-uri folosite per articol, din scripturile de generare ---------
// Mapam dupa folderul de output (`.../articole/<slug>`), nu dupa numele scriptului
// (numele sunt inconsecvente: _gen-blend, _gen-art2, _gen-lapoff...).
const templatePerSlug = new Map();
for (const f of readdirSync(DIR_GEN).filter((n) => /^_gen-.*\.mjs$/.test(n))) {
  const src = readFileSync(join(DIR_GEN, f), 'utf8');
  const slug = src.match(/articole\/([a-z0-9-]+)/)?.[1];
  if (!slug) continue;
  // Doua stiluri de apel in repo: `G.heroRow(...)` (majoritatea) si `heroRow(...)`
  // cu import numit (primele articole). Le prindem pe ambele, dar NU linia de import.
  const corpScript = src.replace(/^import[\s\S]*?from .*$/gm, '');
  const hero = [...new Set([...corpScript.matchAll(/\b(?:G\.)?(hero[A-Z]\w*)\s*\(/g)].map((m) => m[1]))];
  const inline = [...new Set([...corpScript.matchAll(/\b(?:G\.)?(inline[A-Z]\w*)\s*\(/g)].map((m) => m[1]))];
  const prev = templatePerSlug.get(slug);
  // daca un slug are mai multe scripturi (regenerari), le unim
  templatePerSlug.set(slug, {
    hero: [...new Set([...(prev?.hero ?? []), ...hero])],
    inline: [...new Set([...(prev?.inline ?? []), ...inline])],
    script: prev ? `${prev.script},${f}` : f,
  });
}

// --- articolele -------------------------------------------------------------
const articole = [];
for (const f of readdirSync(DIR_ART).filter((n) => n.endsWith('.mdx'))) {
  const slug = f.replace(/\.mdx$/, '');
  const src = readFileSync(join(DIR_ART, f), 'utf8');

  const fmEnd = src.indexOf('\n---', 4);
  const fm = fmEnd > 0 ? src.slice(0, fmEnd) : '';
  const corp = fmEnd > 0 ? src.slice(fmEnd + 4) : src;

  const camp = (k) => fm.match(new RegExp(`^${k}:\\s*"?(.*?)"?\\s*$`, 'm'))?.[1] ?? '';

  const produse = (corp.match(/^<Produs\b/gm) || []).length;
  const h2 = [...corp.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());

  // Cuvinte REALE de pe pagina = proza markdown + textele din carduri + FAQ.
  // (`wc -w` pe fisier NU e bun: numara si numele de atribute, path-uri, coduri.)
  const nrCuv = (s) => s.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const blocuriProdus = [...corp.matchAll(/^<Produs[\s\S]*?\/>$/gm)].join(' ');
  const proza = nrCuv(corp.replace(/^<Produs[\s\S]*?\/>$/gm, ' '));
  const carduri = nrCuv(
    [...blocuriProdus.matchAll(/"([^"]{15,})"/g)].map((m) => m[1]).join(' '),
  );
  const faq = nrCuv([...fm.matchAll(/^\s+[qa]:\s*"([\s\S]*?)"\s*$/gm)].map((m) => m[1]).join(' '));
  const cuvinte = proza + carduri + faq;

  const t = templatePerSlug.get(slug) ?? { hero: [], inline: [], script: '—' };

  articole.push({
    slug,
    data: camp('data').slice(0, 10),
    categorie: camp('categorie'),
    produse,
    h2Carduri: h2[0] ?? '—',
    nrH2: h2.length,
    cuvinte,
    proza,
    carduri,
    faq,
    hero: t.hero,
    inline: t.inline,
    script: t.script,
  });
}
articole.sort((a, b) => (a.data < b.data ? 1 : -1)); // cel mai nou primul

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(articole, null, 2));
  process.exit(0);
}

// --- tabel ------------------------------------------------------------------
const col = (s, n) => String(s).padEnd(n).slice(0, n);
console.log(`\n${articole.length} articole\n`);
console.log(col('slug', 34), col('pr', 3), col('cuv', 5), col('proza', 6), col('card', 5),
  col('faq', 4), col('hero', 15), 'inline');
console.log('-'.repeat(125));
for (const a of articole) {
  console.log(
    col(a.slug, 34),
    col(a.produse, 3),
    col(a.cuvinte, 5),
    col(a.proza < 1400 ? `${a.proza} !` : a.proza, 6),
    col(a.carduri, 5),
    col(a.faq, 4),
    col(a.hero.join(',') || '—', 15),
    a.inline.join(',') || '—',
  );
}

// --- sumar pentru regulile de oscilare --------------------------------------
const freq = (arr) =>
  [...arr.reduce((m, v) => m.set(v, (m.get(v) ?? 0) + 1), new Map())]
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}:${v}`)
    .join('  ');

const TOATE_HERO = ['heroTrio', 'heroRow', 'heroSpotlight', 'heroGrid', 'heroPodium',
  'heroOffset', 'heroDuo', 'heroHalo', 'heroMosaic'];
const TOATE_INLINE = ['inlineCompare', 'inlineBars', 'inlineVs', 'inlineSpecs',
  'inlineStat', 'inlineChecklist', 'inlineGauge', 'inlineRange'];

const ultimele = articole.slice(0, 6);
const heroRecent = ultimele.flatMap((a) => a.hero);
const inlineRecent = ultimele.flatMap((a) => a.inline);

console.log('\n--- OSCILARE: ce sa NU repeti la urmatorul articol ---\n');
console.log('produse, ultimele 6 :', ultimele.map((a) => a.produse).join(', '),
  `  (distributie totala: ${freq(articole.map((a) => a.produse))})`);
console.log('hero folosit recent :', [...new Set(heroRecent)].join(', ') || '—');
console.log('hero NEFOLOSIT (6)  :', TOATE_HERO.filter((h) => !heroRecent.includes(h)).join(', ') || 'toate folosite recent');
console.log('inline recent       :', [...new Set(inlineRecent)].join(', ') || '—');
console.log('inline NEFOLOSIT (6):', TOATE_INLINE.filter((i) => !inlineRecent.includes(i)).join(', ') || 'toate folosite recent');
console.log('\nh2 dinainte de carduri, ultimele 6 (formuleaza DIFERIT):');
for (const a of ultimele) console.log('  •', a.h2Carduri);
const med = (sel) => Math.round(articole.reduce((s, a) => s + sel(a), 0) / articole.length);
console.log('\ncuvinte REALE (proza + carduri + faq): min', Math.min(...articole.map((a) => a.cuvinte)),
  '/ mediu', med((a) => a.cuvinte), '/ max', Math.max(...articole.map((a) => a.cuvinte)));
const subMinim = articole.filter((a) => a.cuvinte < 3000);
if (subMinim.length) console.log('⚠️  sub 3000 cuvinte:', subMinim.map((a) => a.slug).join(', '));
console.log('mediu pe componente: proza', med((a) => a.proza), '| carduri', med((a) => a.carduri),
  '| faq', med((a) => a.faq));
const prozaSubtire = articole.filter((a) => a.proza < 1400);
if (prozaSubtire.length) {
  console.log(`⚠️  PROZA SUBTIRE (<1400 cuv de corp, restul e umplut de carduri+faq): ${prozaSubtire.length}/${articole.length}`);
  console.log('    Corpul editorial e ce rankeaza si ce citeste omul. Nu compensa cu mai multe carduri.');
}
const fara = articole.filter((a) => a.hero.length === 0).map((a) => a.slug);
if (fara.length) console.log('\n⚠️  fara script de imagini detectat:', fara.join(', '));

// --- taguri din colector fara articol (optional: dump-ul e in /tmp, efemer) --
const DUMP = '/tmp/bermo-dump.json';
if (existsSync(DUMP)) {
  try {
    const d = JSON.parse(readFileSync(DUMP, 'utf8'));
    const perTag = new Map();
    for (const p of d.products ?? []) {
      if (p.collectTag) perTag.set(p.collectTag, (perTag.get(p.collectTag) ?? 0) + 1);
    }
    // Normalizam ca sa nu ratam `scaune-birou` vs `cele-mai-bune-scaune-DE-birou`:
    // scoatem prefixul, cuvintele de legatura si cratimele.
    const norm = (s) => s
      .replace(/^cele-mai-bune-/, '')
      .split('-')
      .filter((w) => !['de', 'cu', 'si', 'pentru', 'la'].includes(w))
      .join('');
    const slugs = articole.map((a) => norm(a.slug));
    // Indiciu, nu adevar absolut (ex: tagul `smartphone` e acoperit de articolul `telefoane`).
    const acoperit = (tag) => slugs.some((s) => s.includes(norm(tag)) || norm(tag).includes(s));
    const ramase = [...perTag].filter(([t]) => !acoperit(t)).sort((a, b) => b[1] - a[1]);
    console.log(`\n--- COLECTOR: taguri fara articol (${d.products?.length ?? 0} produse total) ---`);
    console.log(ramase.map(([t, n]) => `${t}(${n})`).join(', ') || 'niciunul');
    console.log('(potrivire aproximativa dupa slug — verifica inainte sa te bazezi pe ea)');
  } catch (e) {
    console.log('\n⚠️  dump colector necitibil:', e.message);
  }
} else {
  console.log(`\n(pentru taguri ramase: regenereaza ${DUMP} din colector, apoi rerulează)`);
}
console.log();
