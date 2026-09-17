// bermo.ro — colector eMAG (CF Worker + KV).
// POST ?k=SECRET {products:[...]}  -> salveaza pe id in KV
// GET /dump?k=SECRET[&cursor=..][&limit=200]  -> {count, products, cursor, done}
// GET /keys?k=SECRET  -> {count} (doar listare, fara citiri: ieftin)
// GET /reset?k=SECRET -> sterge tot (inainte de o scanare noua)
//
// ⛔ De ce paginare: varianta veche citea TOATE produsele intr-o singura cerere, cate un
// KV.get secvential per produs. Peste ~1000 de produse depaseste limita de subrequests a
// Workerului si raspunsul devine 500 (error code 1101). Datele raman intacte in KV —
// doar citirea pica. Clientul: tools/emag-dump.mjs (parcurge paginile si le lipeste).
const SECRET = 'bermo_emag_2026';
const LIMIT_MAX = 400;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'POST,GET,OPTIONS' };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (url.searchParams.get('k') !== SECRET) return new Response('forbidden', { status: 403, headers: cors });

    if (request.method === 'POST') {
      let body; try { body = await request.json(); } catch { return new Response('bad json', { status: 400, headers: cors }); }
      const items = Array.isArray(body.products) ? body.products : [];
      let saved = 0;
      for (const p of items) { if (p && p.id) { await env.EMAG.put('p:' + p.id, JSON.stringify(p)); saved++; } }
      return Response.json({ saved }, { headers: cors });
    }

    // numara cheile fara sa citeasca valorile (1 subrequest per pagina de 1000)
    if (url.pathname === '/keys') {
      let cursor, n = 0;
      do {
        const list = await env.EMAG.list({ prefix: 'p:', cursor });
        n += list.keys.length;
        cursor = list.list_complete ? null : list.cursor;
      } while (cursor);
      return Response.json({ count: n }, { headers: cors });
    }

    if (url.pathname === '/dump') {
      const limit = Math.min(+(url.searchParams.get('limit') || 200) || 200, LIMIT_MAX);
      const list = await env.EMAG.list({ prefix: 'p:', limit, cursor: url.searchParams.get('cursor') || undefined });
      // citirile in paralel: acelasi numar de subrequests, dar mult mai putin timp de asteptare
      const vals = await Promise.all(list.keys.map((k) => env.EMAG.get(k.name)));
      const products = [];
      for (const v of vals) { if (v) { try { products.push(JSON.parse(v)); } catch { /* cheie corupta, o sarim */ } } }
      return Response.json({
        count: products.length,
        products,
        cursor: list.list_complete ? null : list.cursor,
        done: !!list.list_complete,
      }, { headers: cors });
    }

    if (url.pathname === '/reset') {
      let cursor, n = 0;
      do {
        const list = await env.EMAG.list({ prefix: 'p:', cursor });
        for (const k of list.keys) { await env.EMAG.delete(k.name); n++; }
        cursor = list.list_complete ? null : list.cursor;
      } while (cursor);
      return Response.json({ deleted: n }, { headers: cors });
    }

    return new Response('bermo emag collector ok', { headers: cors });
  }
};
