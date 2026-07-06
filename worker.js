// citykidbk.com worker: serves static assets (automatic), receives email
// forwarded to events@citykidbk.com, and accepts form posts at /submit.
// Everything lands in the citykid-inbox D1 database, read by the twice-weekly sweep.

export default {
  // Cloudflare Email Routing hands forwarded messages here.
  async email(message, env, ctx) {
    const raw = await new Response(message.raw).text();
    await env.DB.prepare(
      "INSERT INTO inbox (source, sender, subject, body) VALUES ('email', ?, ?, ?)"
    )
      .bind(
        message.from || '',
        message.headers.get('subject') || '',
        raw.slice(0, 500000)
      )
      .run();
  },

  // Static assets are served before this handler; only non-asset paths arrive here.
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/submit') {
      let info = '';
      try {
        const ct = request.headers.get('content-type') || '';
        if (ct.includes('json')) {
          info = String((await request.json()).event_info || '');
        } else {
          const fd = await request.formData();
          info = String(fd.get('event_info') || '');
        }
      } catch (e) {
        return new Response('Bad request', { status: 400 });
      }
      info = info.slice(0, 10000);
      if (!info.trim()) return new Response('Empty submission', { status: 400 });
      await env.DB.prepare(
        "INSERT INTO inbox (source, sender, subject, body) VALUES ('form', NULL, 'Website submission', ?)"
      )
        .bind(info)
        .run();
      return Response.redirect(url.origin + '/?submitted=1', 303);
    }
    return new Response('Not found', { status: 404 });
  },
};
