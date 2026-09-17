// bermo.ro — generator imagini articole (hero fara text + inline cu text).
// Randeaza template-uri HTML stilizate cu chromium (umbre/gradienturi/Geist), din imagini de produs eMAG.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const CHROME = process.env.CHROME || `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
// caile se calculeaza fata de repo, ca scriptul sa mearga pe orice masina (inainte erau fixe pe server)
const RADACINA = new URL('../../', import.meta.url).pathname;
const FONT = `file://${RADACINA}public/fonturi/geist.woff2`;
const FONT_M = `file://${RADACINA}public/fonturi/geist-mono.woff2`;
const CACHE = `${RADACINA}tools/imagini/cache`;
const TMP = '/tmp/bermo-img';
mkdirSync(CACHE, { recursive: true });
mkdirSync(TMP, { recursive: true });

// paleta bermo
const P = { ink: '#18181b', ink2: '#52525b', muted: '#71717a', accent: '#0d9f6e', accent2: '#0b8a5f', line: '#e6e6e4', card: '#ffffff' };

// ---- descarca imagine produs eMAG la rezolutie mare (cache local) ----
export async function descarca(url) {
  const clean = url.replace(/&amp;/g, '&').replace(/\?.*/, '');
  const h = createHash('md5').update(clean).digest('hex').slice(0, 16);
  const dest = `${CACHE}/${h}.jpg`;
  if (existsSync(dest)) return dest;
  const res = await fetch(`${clean}?width=1200&height=1200`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error('img fetch ' + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  return dest;
}
export async function descargaLista(urls) { const o = []; for (const u of urls) { try { o.push(await descarca(u)); } catch { o.push(null); } } return o; }

// ---- randeaza HTML -> webp ----
function render(html, w, h, out, scale = 1.5) {
  const f = `${TMP}/x.html`;
  writeFileSync(f, html);
  const png = `${TMP}/x.png`;
  execFileSync(CHROME, ['--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', `--force-device-scale-factor=${scale}`, `--window-size=${w},${h}`, `--screenshot=${png}`, `file://${f}`], { stdio: 'ignore' });
  // downscale la latimea logica (dims mici pt Lighthouse) + sharpen (claritate)
  return sharp(png).resize(w, h, { fit: 'inside' }).sharpen({ sigma: 0.7 }).webp({ quality: 86 }).toFile(out);
}

const head = (extra = '') => `<style>
@font-face{font-family:Geist;src:url(${FONT});font-weight:100 900}
@font-face{font-family:GeistMono;src:url(${FONT_M});font-weight:400 700}
*{margin:0;box-sizing:border-box}
body{font-family:Geist;color:${P.ink};-webkit-font-smoothing:antialiased}
/* tile: card alb rotunjit cu umbra (rezolva fundalul alb al produselor) */
.tile{background:#fff;border-radius:20px;box-shadow:0 2px 4px rgba(16,44,32,.05), 0 20px 44px -16px rgba(16,44,32,.22);display:grid;place-items:center;overflow:hidden}
.tile img{max-width:100%;max-height:100%;object-fit:contain}
${extra}</style>`;

// fundal subtil cu tenta verde (carduri albe deasupra)
const bgSoft = `background:radial-gradient(120% 100% at 50% -10%, #f3f6f2 0%, #e6efe8 100%)`;
const tile = (src, pad = '7%', flex = 1) => `<div class="tile" style="padding:${pad};flex:${flex}">${src ? `<img src="file://${src}">` : ''}</div>`;
const bgCard = `background:#f4f6f2`;

const img = (src, style) => src ? `<img src="file://${src}" style="object-fit:contain;${style}">` : `<div style="${style};background:#eef1ec;border-radius:16px"></div>`;

// ---- taie marginile albe dintr-o poza de produs (ca sa umple tile-ul) ----
export async function taie(src, pad = 0.05) {
  const h = createHash('md5').update('trim' + src + pad).digest('hex').slice(0, 16);
  const dest = `${TMP}/${h}.png`;
  if (existsSync(dest)) return dest;
  const buf = await sharp(src).flatten({ background: '#ffffff' }).trim({ background: '#ffffff', threshold: 14 }).png().toBuffer();
  const m = await sharp(buf).metadata();
  const pw = Math.round(m.width * pad), ph = Math.round(m.height * pad);
  await sharp(buf).extend({ top: ph, bottom: ph, left: pw, right: pw, background: '#ffffff' }).toFile(dest);
  return dest;
}
export async function taieLista(srcs, pad) { const o = []; for (const s of srcs) o.push(s ? await taie(s, pad) : null); return o; }

// ============ HERO (fara text) ============

// 3 produse pe tile-uri care umplu cadrul, centrul dominant
export async function heroTrio({ imagini, out, w = 1400, h = 788 }) {
  const [a, b, c] = imagini;
  const html = head(`.wrap{width:${w}px;height:${h}px;${bgSoft};display:flex;align-items:stretch;gap:22px;padding:34px}`) +
    `<div class="wrap">${tile(a, '7%', 1)}${tile(b, '6%', 1.35)}${tile(c, '7%', 1)}</div>`;
  return render(html, w, h, out);
}

// rand de tile-uri care umplu cadrul
export async function heroRow({ imagini, out, w = 1400, h = 788 }) {
  const cells = imagini.map((s) => tile(s, '8%', 1)).join('');
  const html = head(`.wrap{width:${w}px;height:${h}px;${bgSoft};display:flex;align-items:stretch;gap:16px;padding:34px}`) +
    `<div class="wrap">${cells}</div>`;
  return render(html, w, h, out);
}

// 1 tile mare stanga + 3 tile-uri mici dreapta
export async function heroSpotlight({ imagini, out, w = 1400, h = 788 }) {
  const [hero, ...rest] = imagini;
  const mici = rest.slice(0, 3).map((s) => tile(s, '9%', 1)).join('');
  const html = head(`.wrap{width:${w}px;height:${h}px;${bgSoft};display:flex;align-items:stretch;gap:20px;padding:34px}`) +
    `<div class="wrap">${tile(hero, '7%', 1.5)}<div style="flex:1;display:flex;flex-direction:column;gap:16px">${mici}</div></div>`;
  return render(html, w, h, out);
}

// rand de carduri subtile care umplu cadrul (2, 3 sau 4 produse pe un singur rand)
export async function heroGrid({ imagini, out, w = 1200, h = 675 }) {
  const n = imagini.length;
  const cells = imagini.map((s) => `<div style="background:#fff;border-radius:20px;box-shadow:0 10px 30px -12px rgba(20,50,38,.14);display:grid;place-items:center;padding:7%">${img(s, 'max-height:100%;max-width:100%')}</div>`).join('');
  const html = head(`.wrap{width:${w}px;height:${h}px;${bgCard};display:grid;grid-template-columns:repeat(${n},1fr);grid-auto-rows:1fr;gap:22px;padding:40px}`) +
    `<div class="wrap">${cells}</div>`;
  return render(html, w, h, out);
}

// ============ INLINE (cu text) ============

// comparatie 2-3 produse: card + nume + o valoare + caption
export async function inlineCompare({ items, caption, out, w = 1040, h = 620 }) {
  // items: [{src, nume, valoare, sub}]
  const cards = items.map((it) => `
    <div style="flex:1;background:#fff;border:1px solid ${P.line};border-radius:16px;display:flex;flex-direction:column;overflow:hidden">
      <div style="flex:1;display:grid;place-items:center;padding:22px;background:#fafbf9">${img(it.src, 'max-height:100%;max-width:100%;filter:none')}</div>
      <div style="padding:16px 18px;border-top:1px solid ${P.line}">
        <div style="font-size:23px;font-weight:600;line-height:1.25">${it.nume}</div>
        ${it.valoare ? `<div style="font-family:GeistMono;font-size:19px;color:${P.accent};margin-top:6px">${it.valoare}</div>` : ''}
        ${it.sub ? `<div style="font-size:18px;color:${P.muted};margin-top:4px">${it.sub}</div>` : ''}
      </div>
    </div>`).join('');
  const html = head(`.wrap{width:${w}px;height:${h}px;background:#f4f6f2;padding:34px;display:flex;flex-direction:column;gap:18px}`) +
    `<div class="wrap"><div style="display:flex;gap:18px;flex:1">${cards}</div>${caption ? `<div style="font-family:GeistMono;font-size:17px;color:${P.muted};text-align:center">${caption}</div>` : ''}</div>`;
  return render(html, w, h, out);
}

// grafic bare orizontale (ex: putere Pa, pret) cu mini-thumb produs
export async function inlineBars({ titlu, unitate, data, out, w = 1040, h = 560, imagini = true }) {
  // data: [{src, nume, valoare, eticheta}]  valoare numeric pt lungimea barei
  // imagini:false  -> fara coloana de poze. Foloseste cand comparatia NU e intre produse anume
  // (tipuri de bec, scenarii de consum). Altfel ai pune poza unui produs langa o eticheta care
  // vorbeste despre altceva, ceea ce e pur si simplu gresit.
  const max = Math.max(...data.map((d) => d.valoare));
  const rows = data.map((d, i) => {
    const pct = Math.round((d.valoare / max) * 100);
    return `<div style="display:flex;align-items:center;gap:16px">
      ${imagini ? `<div style="width:60px;height:60px;flex:none;background:#fff;border:1px solid ${P.line};border-radius:12px;display:grid;place-items:center;padding:6px">${img(d.src, 'max-height:48px;max-width:48px;object-fit:contain;filter:none')}</div>` : ''}
      <div style="flex:1">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;gap:12px"><span style="font-size:19px;font-weight:600">${d.nume}</span><span style="font-family:GeistMono;font-size:18px;color:${P.ink2};white-space:nowrap">${d.eticheta}</span></div>
        <div style="height:16px;background:#e7ebe4;border-radius:8px;overflow:hidden"><div style="width:${pct}%;height:100%;background:linear-gradient(90deg,${P.accent2},${P.accent});border-radius:8px"></div></div>
      </div></div>`;
  }).join('');
  const html = head(`.wrap{width:${w}px;height:${h}px;background:#f4f6f2;padding:36px 42px;display:flex;flex-direction:column}`) +
    `<div class="wrap"><div style="font-size:26px;font-weight:600;letter-spacing:-.01em">${titlu}</div>${unitate ? `<div style="font-family:GeistMono;font-size:16px;color:${P.muted};margin-top:6px;text-transform:uppercase;letter-spacing:.06em">${unitate}</div>` : ''}<div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:22px;margin-top:12px">${rows}</div></div>`;
  return render(html, w, h, out);
}

// podium: castigatorul in centru, ridicat; doua laterale mai joase (fara text)
export async function heroPodium({ imagini, out, w = 1400, h = 720 }) {
  const [a, b, c] = imagini;
  const cell = (src, hp, flex) => `<div class="tile" style="height:${hp}%;flex:${flex};padding:7%">${src ? `<img src="file://${src}">` : ''}</div>`;
  const html = head(`.wrap{width:${w}px;height:${h}px;${bgSoft};display:flex;align-items:flex-end;justify-content:center;gap:26px;padding:44px 46px 50px}`) +
    `<div class="wrap">${cell(a, 78, 1)}${cell(b, 100, 1.28)}${cell(c, 78, 1)}</div>`;
  return render(html, w, h, out);
}

// offset: doua produse asimetric, cel din fata mai mare, suprapunere editoriala (fara text)
export async function heroOffset({ imagini, out, w = 1400, h = 720 }) {
  const [a, b] = imagini;
  const card = (src, s) => `<div style="position:absolute;background:#fff;border-radius:22px;box-shadow:0 8px 20px -8px rgba(16,44,32,.16),0 34px 60px -24px rgba(16,44,32,.30);display:grid;place-items:center;overflow:hidden;${s}">${src ? `<img src="file://${src}" style="max-width:100%;max-height:100%;object-fit:contain">` : ''}</div>`;
  const html = head(`.wrap{width:${w}px;height:${h}px;${bgSoft};position:relative}`) +
    `<div class="wrap">${card(b, `right:6%;top:16%;width:46%;height:60%;padding:5%`)}${card(a, `left:6%;top:9%;width:52%;height:78%;padding:6%;z-index:2`)}</div>`;
  return render(html, w, h, out);
}

// vs: doua produse fata in fata, cu randuri de comparatie sub ele (cu text)
export async function inlineVs({ a, b, randuri = [], caption, out, w = 1040, h = 660 }) {
  const col = (it) => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px">
    <div style="width:100%;height:210px;background:#fff;border:1px solid ${P.line};border-radius:16px;display:grid;place-items:center;padding:18px">${img(it.src, 'max-height:184px;max-width:100%;filter:none')}</div>
    <div style="font-size:22px;font-weight:600;line-height:1.2">${it.nume}</div>
    ${it.sub ? `<div style="font-size:17px;color:${P.muted}">${it.sub}</div>` : ''}</div>`;
  const rows = randuri.map((r) => `<div style="display:flex;align-items:center;padding:13px 0;border-top:1px solid ${P.line}">
    <div style="flex:1;text-align:right;font-size:19px;font-weight:600">${r.a}</div>
    <div style="width:190px;text-align:center;font-family:GeistMono;font-size:14px;color:${P.muted};text-transform:uppercase;letter-spacing:.05em">${r.eticheta}</div>
    <div style="flex:1;text-align:left;font-size:19px;font-weight:600">${r.b}</div></div>`).join('');
  const html = head(`.wrap{width:${w}px;height:${h}px;background:#f4f6f2;padding:34px 38px;display:flex;flex-direction:column}`) +
    `<div class="wrap"><div style="display:flex;align-items:flex-start;gap:26px;position:relative">${col(a)}
      <div style="position:absolute;left:50%;top:78px;transform:translateX(-50%);width:52px;height:52px;border-radius:50%;background:${P.accent};color:#fff;display:grid;place-items:center;font-family:GeistMono;font-weight:700;font-size:16px;box-shadow:0 6px 16px -4px rgba(13,159,110,.5)">VS</div>${col(b)}</div>
      <div style="margin-top:16px">${rows}</div>
      ${caption ? `<div style="font-family:GeistMono;font-size:15px;color:${P.muted};text-align:center;margin-top:14px">${caption}</div>` : ''}</div>`;
  return render(html, w, h, out);
}

// specs: matrice de specificatii, produse pe coloane cu thumbnail (cu text)
export async function inlineSpecs({ produse = [], specs = [], caption, out, w = 1100 }) {
  const n = produse.length;
  const gt = `160px repeat(${n},1fr)`;
  const head0 = `<div style="display:grid;grid-template-columns:${gt};gap:0;align-items:end;padding-bottom:14px">
    <div></div>${produse.map((p) => `<div style="text-align:center;padding:0 8px">
      <div style="height:96px;display:grid;place-items:center;margin-bottom:8px">${img(p.src, 'max-height:96px;max-width:100%;filter:none')}</div>
      <div style="font-size:16px;font-weight:600;line-height:1.2">${p.nume}</div></div>`).join('')}</div>`;
  const rows = specs.map((s, i) => `<div style="display:grid;grid-template-columns:${gt};align-items:center;background:${i % 2 ? '#fff' : 'transparent'};border-radius:8px">
    <div style="font-family:GeistMono;font-size:13px;color:${P.muted};text-transform:uppercase;letter-spacing:.04em;padding:12px 10px">${s.eticheta}</div>
    ${s.valori.map((v) => `<div style="text-align:center;font-size:17px;font-weight:${s.hl ? 600 : 500};color:${s.hl ? P.accent : P.ink};padding:12px 8px">${v}</div>`).join('')}</div>`).join('');
  const h = 150 + specs.length * 50 + (caption ? 40 : 0) + 68;
  const html = head(`.wrap{width:${w}px;background:#f4f6f2;padding:32px 34px}`) +
    `<div class="wrap" style="min-height:${h}px">${head0}${rows}${caption ? `<div style="font-family:GeistMono;font-size:14px;color:${P.muted};text-align:center;margin-top:16px">${caption}</div>` : ''}</div>`;
  return render(html, w, h, out);
}

// duo: doua produse egale, fata in fata, divizor subtil (fara text)
export async function heroDuo({ imagini, out, w = 1400, h = 700 }) {
  const [a, b] = imagini;
  const html = head(`.wrap{width:${w}px;height:${h}px;${bgSoft};display:flex;align-items:stretch;gap:0;padding:46px}
  .half{flex:1;display:grid;place-items:center;padding:3%}
  .half .tile{width:100%;height:100%;padding:7%}
  .div{width:1px;background:linear-gradient(180deg,rgba(16,44,32,0),rgba(16,44,32,.14),rgba(16,44,32,0));margin:6% 0}`) +
    `<div class="wrap"><div class="half">${tile(a, '7%', 1)}</div><div class="div"></div><div class="half">${tile(b, '7%', 1)}</div></div>`;
  return render(html, w, h, out);
}

// halo: un singur produs dominant, tile mare centrat, glow radial in spate (fara text)
export async function heroHalo({ imagine, out, w = 1400, h = 700 }) {
  const src = Array.isArray(imagine) ? imagine[0] : imagine;
  const html = head(`.wrap{width:${w}px;height:${h}px;${bgSoft};display:grid;place-items:center;position:relative}
  .glow{position:absolute;width:56%;height:72%;border-radius:50%;background:radial-gradient(circle,#ffffff 0%,rgba(255,255,255,0) 68%)}
  .big{position:relative;width:46%;height:80%;padding:6%}`) +
    `<div class="wrap"><div class="glow"></div>${tile(src, '6%', 1).replace('class="tile"', 'class="tile big"')}</div>`;
  return render(html, w, h, out);
}

// mosaic: asimetric, 1 mare stanga + 2 sus dreapta + 1 lat jos (fara text)
export async function heroMosaic({ imagini, out, w = 1400, h = 760 }) {
  const [a, b, c, dd] = imagini;
  const t = (src, area, pad = '8%') => `<div class="tile" style="grid-area:${area};padding:${pad}">${src ? `<img src="file://${src}">` : ''}</div>`;
  const html = head(`.wrap{width:${w}px;height:${h}px;${bgSoft};display:grid;gap:20px;padding:40px;grid-template-columns:1.35fr 1fr 1fr;grid-template-rows:1fr 1fr;grid-template-areas:"A B C" "A D D"}`) +
    `<div class="wrap">${t(a, 'A', '9%')}${t(b, 'B')}${t(c, 'C')}${t(dd, 'D', '6%')}</div>`;
  return render(html, w, h, out);
}

// stat: carduri cu o cifra mare per produs (cu text)
export async function inlineStat({ titlu, items, caption, out, w = 1040, h = 540 }) {
  const cards = items.map((it) => `<div style="flex:1;background:#fff;border:1px solid ${P.line};border-radius:16px;padding:22px 16px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px">
    <div style="height:74px;display:grid;place-items:center">${img(it.src, 'max-height:74px;max-width:100%;filter:none')}</div>
    <div style="font-family:GeistMono;font-size:38px;font-weight:700;color:${P.accent};line-height:1">${it.valoare}</div>
    <div style="font-size:14px;color:${P.muted}">${it.eticheta}</div>
    <div style="font-size:16px;font-weight:600;margin-top:2px">${it.nume}</div></div>`).join('');
  const html = head(`.wrap{width:${w}px;height:${h}px;background:#f4f6f2;padding:34px;display:flex;flex-direction:column;gap:18px}`) +
    `<div class="wrap">${titlu ? `<div style="font-size:24px;font-weight:600;letter-spacing:-.01em">${titlu}</div>` : ''}<div style="display:flex;gap:16px;flex:1;align-items:stretch">${cards}</div>${caption ? `<div style="font-family:GeistMono;font-size:15px;color:${P.muted};text-align:center">${caption}</div>` : ''}</div>`;
  return render(html, w, h, out);
}

// checklist: matrice produse x functii, bifa verde / minus rosu (cu text)
export async function inlineChecklist({ produse = [], functii = [], caption, out, w = 1100 }) {
  const n = produse.length;
  const gt = `210px repeat(${n},1fr)`;
  const bifa = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${P.accent}" stroke-width="2.8"><path d="M20 6L9 17l-5-5"/></svg>`;
  const minus = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#c94a4a" stroke-width="2.8"><path d="M6 12h12"/></svg>`;
  const head0 = `<div style="display:grid;grid-template-columns:${gt};align-items:end;padding-bottom:14px">
    <div></div>${produse.map((p) => `<div style="text-align:center;padding:0 8px"><div style="height:86px;display:grid;place-items:center;margin-bottom:8px">${img(p.src, 'max-height:86px;max-width:100%;filter:none')}</div><div style="font-size:16px;font-weight:600;line-height:1.2">${p.nume}</div></div>`).join('')}</div>`;
  const rows = functii.map((f, i) => `<div style="display:grid;grid-template-columns:${gt};align-items:center;background:${i % 2 ? '#fff' : 'transparent'};border-radius:8px">
    <div style="font-size:15px;padding:13px 10px">${f.eticheta}</div>
    ${f.valori.map((v) => `<div style="display:grid;place-items:center;padding:13px 8px">${v ? bifa : minus}</div>`).join('')}</div>`).join('');
  const h = 150 + functii.length * 50 + (caption ? 40 : 0) + 64;
  const html = head(`.wrap{width:${w}px;background:#f4f6f2;padding:32px 34px}`) +
    `<div class="wrap" style="min-height:${h}px">${head0}${rows}${caption ? `<div style="font-family:GeistMono;font-size:14px;color:${P.muted};text-align:center;margin-top:16px">${caption}</div>` : ''}</div>`;
  return render(html, w, h, out);
}

// gauge: inele (ring) cu scor/procent per produs (cu text)
export async function inlineGauge({ titlu, items, max = 10, unitate, caption, out, w = 1040, h = 520 }) {
  const R = 52, C = 2 * Math.PI * R;
  const ring = (val) => {
    const pct = Math.max(0, Math.min(1, val / max));
    return `<svg viewBox="0 0 130 130" style="width:132px;height:132px">
      <circle cx="65" cy="65" r="${R}" fill="none" stroke="#e2e7e0" stroke-width="12"/>
      <circle cx="65" cy="65" r="${R}" fill="none" stroke="${P.accent}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}" transform="rotate(-90 65 65)"/>
      <text x="65" y="72" text-anchor="middle" font-family="GeistMono" font-size="30" font-weight="700" fill="${P.ink}">${val}</text></svg>`;
  };
  const cards = items.map((it) => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px">
    <div style="height:60px;display:grid;place-items:center">${img(it.src, 'max-height:60px;max-width:80%;filter:none')}</div>
    ${ring(it.valoare)}<div style="font-size:17px;font-weight:600">${it.nume}</div>${it.sub ? `<div style="font-size:14px;color:${P.muted}">${it.sub}</div>` : ''}</div>`).join('');
  const html = head(`.wrap{width:${w}px;height:${h}px;background:#f4f6f2;padding:34px;display:flex;flex-direction:column;gap:16px}`) +
    `<div class="wrap">${titlu ? `<div style="font-size:23px;font-weight:600">${titlu}${unitate ? ` <span style="font-family:GeistMono;font-size:14px;color:${P.muted};font-weight:400">${unitate}</span>` : ''}</div>` : ''}<div style="display:flex;gap:16px;flex:1;align-items:center">${cards}</div>${caption ? `<div style="font-family:GeistMono;font-size:15px;color:${P.muted};text-align:center">${caption}</div>` : ''}</div>`;
  return render(html, w, h, out);
}

// range: axa cu produse pozitionate dupa o valoare (ex: pret) (cu text)
export async function inlineRange({ titlu, unitate, min, max, items, caption, out, w = 1040, h = 480 }) {
  const pct = (v) => Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
  const pins = items.map((it) => `<div style="position:absolute;left:${pct(it.valoare)}%;bottom:64px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:6px;width:150px">
    <div style="width:60px;height:60px;background:#fff;border:1px solid ${P.line};border-radius:12px;display:grid;place-items:center;padding:6px">${img(it.src, 'max-height:48px;max-width:48px;object-fit:contain;filter:none')}</div>
    <div style="font-size:14px;font-weight:600;text-align:center;line-height:1.15">${it.nume}</div>
    <div style="font-family:GeistMono;font-size:13px;color:${P.accent}">${it.eticheta}</div>
    <div style="width:2px;height:14px;background:${P.accent}"></div></div>`).join('');
  const html = head(`.wrap{width:${w}px;height:${h}px;background:#f4f6f2;padding:34px 40px;display:flex;flex-direction:column}`) +
    `<div class="wrap">${titlu ? `<div style="font-size:23px;font-weight:600">${titlu}${unitate ? ` <span style="font-family:GeistMono;font-size:14px;color:${P.muted};font-weight:400">${unitate}</span>` : ''}</div>` : ''}
      <div style="flex:1;position:relative;margin-top:20px">${pins}
        <div style="position:absolute;left:0;right:0;bottom:56px;height:4px;background:linear-gradient(90deg,${P.accent2},${P.accent});border-radius:2px"></div>
        <div style="position:absolute;left:0;bottom:28px;font-family:GeistMono;font-size:13px;color:${P.muted}">${min}</div>
        <div style="position:absolute;right:0;bottom:28px;font-family:GeistMono;font-size:13px;color:${P.muted}">${max}</div></div>
      ${caption ? `<div style="font-family:GeistMono;font-size:14px;color:${P.muted};text-align:center">${caption}</div>` : ''}</div>`;
  return render(html, w, h, out);
}

export const paleta = P;
