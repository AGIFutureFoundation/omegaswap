import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { amount } = await req.json().catch(() => ({}));
    const usd = Number(amount);
    if (!usd || usd < 5 || usd > 1000) return Response.json({ error: 'Amount must be between $5 and $1000' }, { status: 400 });

    const apiKey = secrets.get('NOWPAYMENTS_API_KEY');
    if (!apiKey) return Response.json({ error: 'Crypto payments are not configured yet' }, { status: 503 });

    const appUrl = req.headers.get('X-Base44-App-Url') || '';
    const deposit = await base44.asServiceRole.entities.Deposit.create({ user_id: user.id, amount: usd, status: 'pending' });

    const res = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        price_amount: usd,
        price_currency: 'usd',
        order_id: deposit.id,
        order_description: 'Wallet top-up',
        ipn_callback_url: `${appUrl}/functions/nowpaymentsWebhook`,
        success_url: appUrl,
        cancel_url: appUrl,
      }),
      signal: AbortSignal.timeout(15000),
    });
    const inv = await res.json();
    if (!res.ok || !inv.invoice_url) {
      await base44.asServiceRole.entities.Deposit.update(deposit.id, { status: 'failed' });
      return Response.json({ error: inv.message || 'Could not create payment' }, { status: 502 });
    }
    await base44.asServiceRole.entities.Deposit.update(deposit.id, { pay_url: inv.invoice_url, provider_ref: String(inv.id) });
    return Response.json({ pay_url: inv.invoice_url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}