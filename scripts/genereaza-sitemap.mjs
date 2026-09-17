// bermo.ro — generator sitemap (post-build): pagini + articole cu imagini, newest-first, 200/fisier, XSL stilizat.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { categorii } from '../src/date/nav.js';

const SITE = 'https://bermo.ro';
const MAX = 200;
const DIST = fileURLToPath(new URL('../dist', import.meta.url));
const ART_DIR = fileURLToPath(new URL('../src/continut/articole', import.meta.url));
const now = new Date().toISOString().replace(/\.\d{3}Z$/, '+00:00');
const iso = (d) => (d ? new Date(d).toISOString().replace(/\.\d{3}Z$/, '+00:00') : now);
const fmField = (fm, k) => (fm.match(new RegExp(`^${k}:\\s*["']?([^"'\\n]+)["']?\\s*$`, 'm')) || [])[1];

// --- citeste articolele ---
const articole = readdirSync(ART_DIR).filter((f) => (f.endsWith('.md') || f.endsWith('.mdx')) && !f.startsWith('_')).map((f) => {
  const raw = readFileSync(`${ART_DIR}/${f}`, 'utf-8');
  const fm = (raw.match(/^---\n([\s\S]*?)\n---/) || [])[1] || '';
  const body = raw.split(/\n---\n/).slice(1).join('\n---\n');
  const id = f.replace(/\.mdx?$/, '');
  const data = fmField(fm, 'modificat') || fmField(fm, 'data');
  const imagini = new Set();
  const hero = fmField(fm, 'imagine'); if (hero) imagini.add(hero);
  for (const m of body.matchAll(/\/imagini\/[^\s)"']+\.(?:webp|jpg|png)/g)) imagini.add(m[0]);
  return { url: `${SITE}/${id}/`, lastmod: iso(data), ts: new Date(data || 0).getTime(), imagini: [...imagini].map((i) => SITE + i), cat: fmField(fm, 'categorieSlug'), sub: fmField(fm, 'subcategorieSlug') };
}).sort((a, b) => b.ts - a.ts); // newest first

// --- pagini statice (fara categorii) ---
const pagini = [
  ['/', now, 1.0], ['/categorii/', now, 0.6], ['/articole/', articole[0]?.lastmod || now, 0.7],
  ['/cum-alegem/', now, 0.5], ['/redactia/', now, 0.4], ['/contact/', now, 0.3],
  ['/confidentialitate/', now, 0.2], ['/cookies/', now, 0.2], ['/termeni-si-conditii/', now, 0.2], ['/transparenta-afiliere/', now, 0.2],
];

// --- categorii + subcategorii (sitemap separat) ---
// ⛔ Doar cele care AU articole. O categorie goala trimisa in sitemap = pagina subtire indexata,
// exact tiparul care a atras respingerea AdSense pe meseriile.ro. Intra automat cand apare
// primul articol in ea.
const nrArt = (cat, sub) => articole.filter((a) => a.cat === cat && (!sub || a.sub === sub)).length;
const categoriiUrl = [];
for (const c of categorii) {
  if (!nrArt(c.slug)) continue;
  categoriiUrl.push([`/${c.slug}/`, now, 0.7]);
  for (const s of c.subcategorii) if (nrArt(c.slug, s.slug)) categoriiUrl.push([`/${c.slug}/${s.slug}/`, now, 0.6]);
}

const XSL = '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>';
const HEAD_URL = '<?xml version="1.0" encoding="UTF-8"?>\n' + XSL + '\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">';

const urlBlock = (arr) => HEAD_URL + arr.map(([loc, lm, pr]) =>
  `\n  <url><loc>${SITE}${loc}</loc><lastmod>${lm}</lastmod><priority>${pr}</priority></url>`).join('') + '\n</urlset>\n';

// --- sitemap pagini ---
writeFileSync(`${DIST}/sitemap-pagini.xml`, urlBlock(pagini));

// --- sitemap categorii ---
writeFileSync(`${DIST}/sitemap-categorii.xml`, urlBlock(categoriiUrl));

// --- sitemap articole (200/fisier, cu imagini) ---
const bucati = [];
for (let i = 0; i < Math.max(1, articole.length); i += MAX) bucati.push(articole.slice(i, i + MAX));
const numeArt = [];
bucati.forEach((chunk, idx) => {
  const nume = `sitemap-articole-${idx + 1}.xml`;
  numeArt.push(nume);
  const urls = chunk.map((a) => `\n  <url><loc>${a.url}</loc><lastmod>${a.lastmod}</lastmod>` +
    a.imagini.map((im) => `\n    <image:image><image:loc>${im}</image:loc></image:image>`).join('') + '\n  </url>').join('');
  writeFileSync(`${DIST}/${nume}`, HEAD_URL + urls + '\n</urlset>\n');
});

// --- index ---
const latest = articole[0]?.lastmod || now;
const subs = ['sitemap-pagini.xml', 'sitemap-categorii.xml', ...numeArt];
writeFileSync(`${DIST}/sitemap.xml`, '<?xml version="1.0" encoding="UTF-8"?>\n' + XSL +
  '\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
  subs.map((s) => `\n  <sitemap><loc>${SITE}/${s}</loc><lastmod>${latest}</lastmod></sitemap>`).join('') +
  '\n</sitemapindex>\n');

// --- XSL stilizat (paleta bermo) ---
writeFileSync(`${DIST}/sitemap.xsl`, `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
<xsl:output method="html" encoding="UTF-8" indent="yes"/>
<xsl:template match="/">
<html lang="ro"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Harta site bermo.ro</title>
<style>
:root{--ink:#18181b;--muted:#71717a;--accent:#0d9f6e;--line:#e6e6e4;--surface:#f5f5f4;--card:#fff;--bg:#fff}
@media(prefers-color-scheme:dark){:root{--ink:#fafafa;--muted:#9a9aa2;--accent:#26c08a;--line:#292a2e;--surface:#151619;--card:#1a1b1f;--bg:#0b0c0e}}
*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:var(--ink);background:var(--bg);max-width:1100px;margin:0 auto;padding:28px 20px;line-height:1.5}
.logo{font-weight:700;font-size:22px;letter-spacing:-.03em}.logo b{color:var(--accent);font-weight:700}
h1{font-size:26px;margin:6px 0 4px;letter-spacing:-.02em}
.lead{color:var(--muted);font-size:14px;margin-bottom:20px}
.lead b{color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,transparent);padding:1px 8px;border-radius:999px;font-weight:600}
table{border-collapse:collapse;width:100%;background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden;font-size:14px}
th,td{text-align:left;padding:12px 16px;border-bottom:1px solid var(--line)}
th{background:var(--surface);font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);font-weight:600}
tr:last-child td{border-bottom:0}tr:hover td{background:var(--surface)}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
td.num{font-variant-numeric:tabular-nums;color:var(--muted);white-space:nowrap}
.foot{color:var(--muted);font-size:12px;margin-top:20px}
</style></head><body>
<div class="logo">bermo<b>.</b></div>
<xsl:choose>
<xsl:when test="s:sitemapindex">
<h1>Harta site</h1>
<p class="lead">Index cu <b><xsl:value-of select="count(s:sitemapindex/s:sitemap)"/> sitemap-uri</b></p>
<table><tr><th>Sitemap</th><th>Ultima modificare</th></tr>
<xsl:for-each select="s:sitemapindex/s:sitemap"><tr><td><a href="{s:loc}"><xsl:value-of select="s:loc"/></a></td><td class="num"><xsl:value-of select="substring(s:lastmod,1,10)"/></td></tr></xsl:for-each>
</table>
</xsl:when>
<xsl:otherwise>
<h1>Harta site</h1>
<p class="lead"><b><xsl:value-of select="count(s:urlset/s:url)"/> adrese</b></p>
<table><tr><th>Adresa</th><th>Imagini</th><th>Modificat</th></tr>
<xsl:for-each select="s:urlset/s:url"><tr><td><a href="{s:loc}"><xsl:value-of select="s:loc"/></a></td><td class="num"><xsl:value-of select="count(image:image)"/></td><td class="num"><xsl:value-of select="substring(s:lastmod,1,10)"/></td></tr></xsl:for-each>
</table>
</xsl:otherwise>
</xsl:choose>
<p class="foot">bermo.ro — inteligenta de cumparare</p>
</body></html>
</xsl:template></xsl:stylesheet>
`);

// --- robots.txt ---
writeFileSync(`${DIST}/robots.txt`, `User-agent: *\nAllow: /\nDisallow: /out/\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`sitemap: ${articole.length} articole (${numeArt.length} fisiere), ${pagini.length} pagini, ${categoriiUrl.length} categorii, XSL + robots. Newest: ${articole[0]?.url || '-'}`);
