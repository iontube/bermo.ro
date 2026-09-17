// bermo.ro — endpoint formular contact: verifica Turnstile (captcha CF) + trimite email via Resend.
// Secrete necesare (Pages > Settings > Environment variables / Secrets):
//   TURNSTILE_SECRET  = secret key din Cloudflare Turnstile
//   RESEND_API_KEY    = re_... din Resend
//   CONTACT_TO        = adresa unde primesti mesajele (optional, default contact@bermo.ro)
//   CONTACT_FROM      = expeditor pe domeniul verificat (optional, default "bermo <contact@bermo.ro>")

const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8' } });

export async function onRequestPost(context) {
  const { request, env } = context;
  let data = {};
  try {
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) data = await request.json();
    else data = Object.fromEntries(await request.formData());
  } catch { return json({ ok: false, error: 'Cerere invalida.' }, 400); }

  const nume = String(data.nume || '').trim().slice(0, 120);
  const email = String(data.email || '').trim().slice(0, 160);
  const mesaj = String(data.mesaj || '').trim().slice(0, 5000);
  const token = String(data['cf-turnstile-response'] || '');

  if (!nume || !email || !mesaj) return json({ ok: false, error: 'Completeaza toate campurile.' }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ ok: false, error: 'Adresa de email nu pare valida.' }, 400);
  if (!token) return json({ ok: false, error: 'Confirma ca nu esti robot.' }, 400);

  // 1) verifica Turnstile
  const fv = new FormData();
  fv.append('secret', env.TURNSTILE_SECRET || '');
  fv.append('response', token);
  const ip = request.headers.get('cf-connecting-ip');
  if (ip) fv.append('remoteip', ip);
  let tj = {};
  try {
    const tv = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: fv });
    tj = await tv.json();
  } catch { return json({ ok: false, error: 'Nu am putut verifica captcha. Reincearca.' }, 502); }
  if (!tj.success) return json({ ok: false, error: 'Verificarea anti-robot a esuat. Reincearca.' }, 400);

  // 2) trimite email via Resend
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: env.CONTACT_FROM || 'bermo <contact@bermo.ro>',
        to: [env.CONTACT_TO || 'contact@bermo.ro'],
        reply_to: email,
        subject: `Contact bermo.ro — ${nume}`,
        text: `Nume: ${nume}\nEmail: ${email}\n\nMesaj:\n${mesaj}`,
      }),
    });
    if (!r.ok) return json({ ok: false, error: 'Nu am putut trimite mesajul. Scrie-ne direct la contact@bermo.ro.' }, 502);
  } catch { return json({ ok: false, error: 'Nu am putut trimite mesajul. Scrie-ne direct la contact@bermo.ro.' }, 502); }

  return json({ ok: true });
}

// GET pe /api/contact -> mesaj simplu (nu expune nimic)
export async function onRequestGet() {
  return json({ ok: false, error: 'Foloseste formularul de pe pagina de contact.' }, 405);
}
