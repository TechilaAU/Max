// Cloudflare Pages Function: POST /api/enquiry
// Creates a Case in Salesforce from any website form (contact, equipment request, order, trial, imprest, careers).
// Env vars (Cloudflare Pages > Settings > Environment variables):
//   SF_LOGIN_URL       e.g. https://maxhealthcare.my.salesforce.com
//   SF_CLIENT_ID       Connected/External Client App with Client Credentials flow enabled
//   SF_CLIENT_SECRET
//   SF_CASE_RECORD_TYPE_ID  (optional)
//   NOTIFY_WEBHOOK     (optional) Slack/Teams/etc. webhook, also used as a fallback if Salesforce fails

const LABELS = {
  contact: 'General enquiry',
  'equipment-request': 'Referrer equipment request',
  order: 'Order request',
  trial: 'Trial booking request',
  imprest: 'Imprest cabinet enquiry',
  careers: 'Careers expression of interest',
};

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function sfToken(env) {
  const res = await fetch(`${env.SF_LOGIN_URL}/services/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: env.SF_CLIENT_ID, client_secret: env.SF_CLIENT_SECRET }),
  });
  const t = await res.json();
  if (!t.access_token) throw new Error(`Salesforce auth failed: ${JSON.stringify(t)}`);
  return t;
}

export async function onRequestPost({ request, env }) {
  const form = await request.formData();
  if (form.get('company_website')) return json({ ok: true }); // honeypot

  const type = String(form.get('type') || 'contact');
  const name = String(form.get('name') || '').trim();
  const email = String(form.get('email') || '').trim();
  const phone = String(form.get('phone') || '').trim();
  if (!name || (!email && !phone)) return json({ ok: false, error: 'Name and a phone or email are required.' }, 400);

  const skip = new Set(['type', 'company_website', 'consent', 'name', 'email', 'phone']);
  const lines = [];
  for (const [k, v] of form.entries()) {
    if (skip.has(k) || typeof v !== 'string' || !v.trim()) continue;
    lines.push(`${k.replace(/_/g, ' ')}: ${v.trim()}`);
  }
  const subject = `[Website] ${LABELS[type] || 'Enquiry'}: ${name}`.slice(0, 255);
  const description = [`Form: ${LABELS[type] || type}`, `Name: ${name}`, `Email: ${email}`, `Phone: ${phone}`, '', ...lines].join('\n').slice(0, 31000);

  let ok = false;
  if (env.SF_LOGIN_URL && env.SF_CLIENT_ID && env.SF_CLIENT_SECRET) {
    try {
      const t = await sfToken(env);
      const body = { Subject: subject, Description: description, Origin: 'Web', SuppliedName: name, SuppliedEmail: email, SuppliedPhone: phone };
      if (env.SF_CASE_RECORD_TYPE_ID) body.RecordTypeId = env.SF_CASE_RECORD_TYPE_ID;
      const res = await fetch(`${t.instance_url}/services/data/v62.0/sobjects/Case`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      ok = res.ok;
      if (!ok) console.error('Case create failed', res.status, await res.text());
    } catch (e) {
      console.error(e);
    }
  }
  if (env.NOTIFY_WEBHOOK) {
    try {
      await fetch(env.NOTIFY_WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: `${subject}\n${description}` }) });
      ok = ok || true;
    } catch (e) { console.error(e); }
  }
  if (!ok) return json({ ok: false, error: 'Could not send. Please call 1800 684 277.' }, 502);

  // Non-JS form posts get redirected to the thank-you page
  if ((request.headers.get('accept') || '').includes('text/html')) return Response.redirect(new URL('/thank-you/', request.url), 303);
  return json({ ok: true });
}
