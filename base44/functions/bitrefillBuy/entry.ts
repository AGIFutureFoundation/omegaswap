import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { getBalance } from '../../shared/ledger.ts';
import { markCardVerified } from '../../shared/sweep.ts';

const PRODUCTS = {
  "Amazon": "amazon-usa",
  "Steam": "steam-usa",
  "Starbucks": "starbucks-usa",
  "Uber Eats": "uber-eats-usa",
  "Netflix": "netflix-usa",
  "Apple": "itunes-usa",
};
const MARKUP = 0.02;
const ALLOWED_VALUES = [10, 25, 50, 100];
const r2 = (n) => Math.round(n * 100) / 100;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { brand, value } = await req.json().catch(() => ({}));
    const productId = PRODUCTS[brand];
    const face = Number(value);
    if (!productId) return Response.json({ error: 'Unsupported brand' }, { status: 400 });
    if (!ALLOWED_VALUES.includes(face)) return Response.json({ error: 'Choose $10, $25, $50 or $100' }, { status: 400 });
    const apiKey = secrets.get('BITREFILL_API_KEY');
    if (!apiKey) return Response.json({ error: 'Bitrefill is not configured' }, { status: 503 });

    const sr = base44.asServiceRole;
    const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };

    // 1. Live quote: Bitrefill price in sats -> USD, plus our markup
    const pRes = await fetch(`https://api.bitrefill.com/v2/products/${productId}`, { headers, signal: AbortSignal.timeout(10000) });
    if (!pRes.ok) return Response.json({ error: `Bitrefill product unavailable (${pRes.status})` }, { status: 502 });
    const product = (await pRes.json()).data;
    const pkg = (product.packages || []).find((k) => Number(k.value) === face);
    if (!pkg || product.in_stock === false) return Response.json({ error: `${brand} $${face} is not available right now` }, { status: 409 });
    const spot = Number((await (await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot', { signal: AbortSignal.timeout(10000) })).json())?.data?.amount);
    if (!spot) return Response.json({ error: 'BTC price unavailable' }, { status: 502 });
    const price = r2((Number(pkg.price) / 1e8) * spot * (1 + MARKUP));

    // 2. Debit first, and undo if the balance was overdrawn by a parallel request
    const balance = await getBalance(base44, user.id);
    if (balance < price) return Response.json({ error: `Not enough balance. You have $${balance.toFixed(2)}, this costs $${price.toFixed(2)}.` }, { status: 402 });
    const ref = `bitrefill:${crypto.randomUUID()}`;
    const debit = await sr.entities.LedgerEntry.create({ user_id: user.id, amount: -price, kind: 'purchase', memo: `Bitrefill ${brand} $${face}`, ref });
    const refund = (why) => sr.entities.LedgerEntry.create({ user_id: user.id, amount: price, kind: 'purchase', memo: `Refund: ${why}`, ref: `${ref}:refund` });
    if ((await getBalance(base44, user.id)) < 0) {
      await sr.entities.LedgerEntry.delete(debit.id);
      return Response.json({ error: 'Not enough balance' }, { status: 402 });
    }

    // 3. Real purchase from the Bitrefill account balance
    try {
      const iRes = await fetch('https://api.bitrefill.com/v2/invoices', {
        method: 'POST', headers, signal: AbortSignal.timeout(30000),
        body: JSON.stringify({
          products: [{ product_id: productId, package_id: pkg.package_id || `${productId}<&>${face}`, quantity: 1 }],
          payment_method: 'balance', auto_pay: true,
        }),
      });
      const inv = (await iRes.json())?.data;
      if (!iRes.ok || inv?.status !== 'complete') throw new Error(`Bitrefill ${inv?.status || iRes.status}`);
      const orderId = inv.orders?.[0]?.id;
      const oRes = await fetch(`https://api.bitrefill.com/v2/orders/${orderId}`, { headers, signal: AbortSignal.timeout(15000) });
      const info = (await oRes.json())?.data?.redemption_info || {};
      const code = String(info.code || '');
      const card = await base44.entities.GiftCard.create({ brand, balance: face, last4: code.slice(-4) });
      await markCardVerified(sr, card, user.id);
      return Response.json({ ok: true, brand, value: face, price, code, link: info.link || null, pin: info.pin || null });
    } catch (e) {
      await refund('purchase failed');
      return Response.json({ error: `Purchase failed and your balance was refunded: ${e.message}` }, { status: 502 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}