import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

const sortKeys = (v) => {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object') {
    return Object.keys(v).sort().reduce((o, k) => { o[k] = sortKeys(v[k]); return o; }, {});
  }
  return v;
};

async function hmacSha512(secret, text) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default async function(req) {
  try {
    const ipnSecret = secrets.get('NOWPAYMENTS_IPN_SECRET');
    if (!ipnSecret) return Response.json({ error: 'Not configured' }, { status: 503 });

    const body = await req.json().catch(() => null);
    const sig = req.headers.get('x-nowpayments-sig');
    if (!body || !sig) return Response.json({ error: 'Bad request' }, { status: 400 });

    const expected = await hmacSha512(ipnSecret, JSON.stringify(sortKeys(body)));
    if (expected !== sig) return Response.json({ error: 'Invalid signature' }, { status: 401 });

    if (body.payment_status !== 'finished') return Response.json({ ok: true, ignored: body.payment_status });

    const sr = createClientFromRequest(req).asServiceRole;
    const deposit = await sr.entities.Deposit.get(body.order_id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!deposit) return Response.json({ error: 'Unknown order' }, { status: 404 });
    if (deposit.status === 'confirmed') return Response.json({ ok: true, duplicate: true });

    // Credit the amount we requested, never an amount from the request body
    await sr.entities.Deposit.update(deposit.id, { status: 'confirmed' });
    await sr.entities.LedgerEntry.create({
      user_id: deposit.user_id,
      amount: deposit.amount,
      kind: 'deposit',
      memo: 'Crypto top-up',
      ref: deposit.id,
    });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}