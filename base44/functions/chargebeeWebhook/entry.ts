import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

const safeEqual = (a, b) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

// Chargebee webhook: when a wallet top-up invoice is paid, credit the user's cash balance once.
export default async function(req) {
  try {
    const user = secrets.get('CHARGEBEE_WEBHOOK_USER');
    const pass = secrets.get('CHARGEBEE_WEBHOOK_PASSWORD');
    const key = secrets.get('CHARGEBEE_API_KEY');
    const site = String(secrets.get('CHARGEBEE_SITE') || '').trim();
    if (!user || !pass || !key || !/^[a-z0-9-]+$/i.test(site)) {
      return Response.json({ error: 'Not configured' }, { status: 503 });
    }

    // Basic auth check: anyone can reach this URL
    const expected = `Basic ${btoa(`${user}:${pass}`)}`;
    if (!safeEqual(req.headers.get('authorization') || '', expected)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const event = await req.json().catch(() => null);
    if (!event) return Response.json({ error: 'Bad request' }, { status: 400 });
    if (event.event_type !== 'payment_succeeded') return Response.json({ ok: true, ignored: event.event_type });

    const invoiceId = event.content?.invoice?.id;
    if (!invoiceId) return Response.json({ ok: true, ignored: 'no invoice' });

    // Read the invoice from Chargebee; never trust amounts in the request
    const res = await fetch(`https://${site}.chargebee.com/api/v2/invoices/${encodeURIComponent(invoiceId)}`, {
      headers: { Authorization: `Basic ${btoa(`${key.trim()}:`)}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return Response.json({ error: 'Could not load invoice' }, { status: 502 });
    const inv = (await res.json().catch(() => ({}))).invoice;

    const isTopUp = inv?.line_items?.some((l) => l.description === 'OmegaSwap wallet top-up');
    if (!inv || inv.status !== 'paid' || inv.currency_code !== 'USD' || !isTopUp || !String(inv.customer_id).startsWith('u_')) {
      return Response.json({ ok: true, ignored: 'not a paid wallet top-up' });
    }

    const userId = String(inv.customer_id).slice(2);
    const ref = `chargebee_${inv.id}`;
    const sr = createClientFromRequest(req).asServiceRole;

    const existing = await sr.entities.LedgerEntry.filter({ ref }, { limit: 1 });
    if (existing.items.length) return Response.json({ ok: true, duplicate: true });

    await sr.entities.LedgerEntry.create({
      user_id: userId,
      amount: inv.total / 100,
      kind: 'deposit',
      memo: 'Chargebee invoice top-up',
      ref,
    });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}