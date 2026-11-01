import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

// Invoicing through Chargebee: create an invoice with a hosted pay link, or list the caller's invoices.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const key = secrets.get('CHARGEBEE_API_KEY');
    const site = String(secrets.get('CHARGEBEE_SITE') || '').trim();
    if (!key || !/^[a-z0-9-]+$/i.test(site)) return Response.json({ error: 'Chargebee is not configured' }, { status: 503 });

    const api = `https://${site}.chargebee.com/api/v2`;
    const auth = { Authorization: `Basic ${btoa(`${key.trim()}:`)}` };
    const send = async (path, params) => {
      const res = await fetch(`${api}${path}`, {
        method: params ? 'POST' : 'GET',
        headers: params ? { ...auth, 'Content-Type': 'application/x-www-form-urlencoded' } : auth,
        body: params ? new URLSearchParams(params).toString() : undefined,
        signal: AbortSignal.timeout(15000),
      });
      return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
    };

    const { action, amount } = await req.json().catch(() => ({}));
    const cid = `u_${user.id}`;

    if (action === 'list') {
      const r = await send(`/invoices?limit=20&sort_by[desc]=date&customer_id[is]=${encodeURIComponent(cid)}`);
      if (!r.ok) return Response.json({ error: r.data.message || 'Could not load invoices' }, { status: 502 });
      const invoices = (r.data.list || []).map(({ invoice: i }) => ({
        id: i.id, status: i.status, total: i.total / 100, currency: i.currency_code, date: i.date,
      }));
      return Response.json({ invoices });
    }

    if (action === 'create') {
      const usd = Number(amount);
      if (!usd || usd < 5 || usd > 1000) return Response.json({ error: 'Amount must be between $5 and $1000' }, { status: 400 });

      // Customer is created once; an existing one is fine
      await send('/customers', { id: cid, email: user.email, first_name: user.full_name || '' });

      const inv = await send('/invoices/create_for_charge_items_and_charges', {
        customer_id: cid,
        'charges[amount][0]': String(Math.round(usd * 100)),
        'charges[description][0]': 'OmegaSwap wallet top-up',
      });
      if (!inv.ok) return Response.json({ error: inv.data.message || 'Could not create invoice' }, { status: 502 });
      const invoiceId = inv.data.invoice.id;

      const page = await send('/hosted_pages/collect_now', { 'customer[id]': cid, 'invoice[id]': invoiceId });
      const payUrl = page.ok ? page.data.hosted_page?.url : null;
      return Response.json({ invoice_id: invoiceId, pay_url: payUrl || null });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}