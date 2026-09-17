// bermo eMAG collector — content script.
// Pe o pagina de categorie/cautare eMAG: aduna linkuri /pd din primele N pagini,
// fetch fiecare /pd din SESIUNEA TA (IP rezidential -> fara WAF), extrage JSON-LD + specs,
// filtreaza dupa nr. recenzii, ataseaza eticheta ta de categorie, trimite la colector.
(() => {
  if (window.__bermoEmag) return; window.__bermoEmag = true;

  const DEF = { minReviews: 3, maxPages: 15, pacingMs: 2200, tag: '' };
  let cfg = { ...DEF };
  let running = false, scanned = 0, sent = 0, queue = [];
  const seen = new Set();
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const pid = (u) => (u.match(/\/pd\/([A-Z0-9]+)/i) || [])[1];

  chrome.storage.local.get(DEF, (d) => { cfg = { ...DEF, ...d }; renderCfg(); });

  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;z-index:2147483647;right:14px;bottom:14px;width:270px;background:#fff;border:2px solid #0d9f6e;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.2);font:13px/1.4 system-ui,sans-serif;color:#222;padding:12px';
  box.innerHTML = `
    <div style="font-weight:700;color:#0d9f6e;margin-bottom:6px">bermo collector</div>
    <label style="display:block;margin:4px 0">Eticheta categorie: <input id="cc-tag" type="text" placeholder="ex: piscine" style="width:130px"></label>
    <label style="display:block;margin:4px 0">Min. recenzii: <input id="cc-min" type="number" min="0" style="width:60px"></label>
    <label style="display:block;margin:4px 0">Pagini/categorie: <input id="cc-pg" type="number" min="1" max="40" style="width:50px"></label>
    <label style="display:block;margin:4px 0">Pauza (ms): <input id="cc-pace" type="number" min="800" step="500" style="width:70px"></label>
    <div id="cc-status" style="margin:8px 0;font-size:12px;color:#555">gata</div>
    <button id="cc-go" style="background:#0d9f6e;color:#fff;border:0;border-radius:8px;padding:7px 12px;cursor:pointer;font-weight:600;width:100%">Start pe pagina asta</button>
    <div style="margin-top:6px;font-size:11px;color:#888">Pune eticheta, deschide o categorie/cautare eMAG si apasa Start.</div>`;
  const add = () => (document.body ? document.body.appendChild(box) : setTimeout(add, 300));
  add();

  const $ = (id) => box.querySelector(id);
  const status = (t) => { const s = $('#cc-status'); if (s) s.textContent = t; };
  function renderCfg() { $('#cc-tag').value = cfg.tag || ''; $('#cc-min').value = cfg.minReviews; $('#cc-pg').value = cfg.maxPages; $('#cc-pace').value = cfg.pacingMs; }
  function readCfg() {
    cfg.tag = ($('#cc-tag').value || '').trim();
    cfg.minReviews = +$('#cc-min').value || 0;
    cfg.maxPages = Math.min(60, +$('#cc-pg').value || 15);
    cfg.pacingMs = Math.max(800, +$('#cc-pace').value || 2200);
    chrome.storage.local.set(cfg);
  }
  $('#cc-go').addEventListener('click', () => {
    if (running) { running = false; $('#cc-go').textContent = 'Start pe pagina asta'; return; }
    readCfg();
    $('#cc-go').textContent = 'Stop'; run();
  });

  async function getHtml(url) {
    try { const r = await fetch(url, { credentials: 'include' }); return r.ok ? await r.text() : null; } catch { return null; }
  }

  function parsePd(html, url) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    let prod = null, crumbs = [];
    doc.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
      let o; try { o = JSON.parse(s.textContent); } catch { return; }
      const arr = Array.isArray(o) ? o : (o['@graph'] ? o['@graph'] : [o]);
      for (const it of arr) {
        if (it && it['@type'] === 'Product') prod = it;
        if (it && it['@type'] === 'BreadcrumbList') crumbs = (it.itemListElement || []).map((e) => e.name || (e.item && e.item.name)).filter(Boolean);
      }
    });
    if (!prod) return null;
    const off = Array.isArray(prod.offers) ? (prod.offers[0] || {}) : (prod.offers || {});
    const ar = prod.aggregateRating || {};
    const imgs = Array.isArray(prod.image) ? prod.image : (prod.image ? [prod.image] : []);
    const specs = {};
    doc.querySelectorAll('.specifications tr, .product-specifications tr, table tr').forEach((tr) => {
      const c = tr.querySelectorAll('td,th');
      if (c.length >= 2) { const k = c[0].textContent.trim(), v = c[1].textContent.trim(); if (k && v && k.length < 60 && Object.keys(specs).length < 40) specs[k] = v; }
    });
    return {
      id: pid(url), url: url.split('?')[0], name: prod.name || '', sku: prod.sku || prod.mpn || '',
      brand: (prod.brand && (prod.brand.name || prod.brand)) || '',
      price: off.price != null ? +off.price : null, currency: off.priceCurrency || 'RON', availability: off.availability || '',
      rating: ar.ratingValue ? +ar.ratingValue : null, reviewCount: +(ar.reviewCount || ar.ratingCount || 0),
      images: imgs, description: (prod.description || '').slice(0, 1200), specs, breadcrumb: crumbs,
      collectTag: cfg.tag || '', scrapedAt: Date.now(),
    };
  }

  function enqueue(p) { queue.push(p); if (queue.length >= 8) flush(); }
  function flush() {
    if (!queue.length) return;
    const batch = queue.splice(0);
    chrome.runtime.sendMessage({ type: 'products', items: batch }, () => {});
    sent += batch.length;
  }

  async function run() {
    running = true; scanned = 0; status('pornit…');
    const page1html = document.documentElement.outerHTML;
    // Descopera SABLONUL de paginare din link-urile REALE ale paginii (nu ghicim).
    // Merge pe categorie (/slug/pN/c) SI pe cautare (/search/q/pN[?...]).
    let tmpl = null;
    const abs = (u) => (u.startsWith('http') ? u : location.origin + u);
    // 1) paginare pe PATH: /slug/pN/c  sau  /search/q/pN
    const mm = page1html.match(/href="([^"]*\/p)\d+((?:\/c)?[^"?]*)(\?[^"]*)?"/i);
    if (mm) {
      const pre = mm[1], suf = (mm[2] || ''), qs = (mm[3] || '').replace(/&amp;/g, '&');
      tmpl = (n) => abs(pre + n + suf + qs);
    } else {
      // 2) fallback paginare pe QUERY: ?page=N sau &page=N (unele liste eMAG)
      const qm = page1html.match(/href="([^"]*[?&]page=)\d+([^"]*)"/i);
      if (qm) { const pre = qm[1].replace(/&amp;/g, '&'), suf = (qm[2] || '').replace(/&amp;/g, '&'); tmpl = (n) => abs(pre + n + suf); }
    }
    const pages = [location.href];
    if (tmpl) { for (let p = 2; p <= cfg.maxPages; p++) pages.push(tmpl(p)); }
    else { status('o singura pagina (fara paginare detectata)'); }

    const pdUrls = new Set();
    for (const pu of pages) {
      if (!running) break;
      const html = (pu === location.href) ? page1html : await getHtml(pu);
      if (html) {
        const before = pdUrls.size;
        for (const m of html.matchAll(/\/[a-z0-9\-]+\/pd\/[A-Z0-9]+/gi)) pdUrls.add(location.origin + m[0]);
        status(`paginare ${pu.split('/').pop().split('?')[0]} • ${pdUrls.size} produse gasite`);
        // daca o pagina noua nu aduce nimic nou, am depasit ultima pagina -> oprim paginarea
        if (pu !== location.href && pdUrls.size === before) break;
      }
      if (pu !== location.href) await sleep(cfg.pacingMs);
    }

    for (const pu of pdUrls) {
      if (!running) break;
      const id = pid(pu); if (!id || seen.has(id)) continue; seen.add(id);
      const html = await getHtml(pu); scanned++;
      if (html) {
        const prod = parsePd(html, pu);
        if (prod && prod.reviewCount >= cfg.minReviews) enqueue(prod);
      }
      status(`scanate ${scanned}/${pdUrls.size} • trimise ${sent} (≥${cfg.minReviews} rec.${cfg.tag ? ' • '+cfg.tag : ''})`);
      await sleep(cfg.pacingMs);
    }
    flush();
    running = false; $('#cc-go').textContent = 'Start pe pagina asta';
    status(`GATA. scanate ${scanned}, trimise ${sent}.`);
  }
})();
