import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

const ENVS = [
  { name: 'live', api: 'https://giftcards.reloadly.com' },
  { name: 'sandbox', api: 'https://giftcards-sandbox.reloadly.com' },
];

async function getToken(audience) {
  const res = await fetch('https://auth.reloadly.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: secrets.get('RELOADLY_CLIENT_ID'),
      client_secret: secrets.get('RELOADLY_CLIENT_SECRET'),
      grant_type: 'client_credentials',
      audience,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;
  return (await res.json()).access_token || null;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    for (const env of ENVS) {
      const token = await getToken(env.api);
      if (!token) continue;
      const res = await fetch(`${env.api}/discounts?size=100&page=1`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/com.reloadly.giftcards-v1+json' },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) continue;
      const body = await res.json();
      const rows = (body.content || []).map((d) => ({
        product_id: d.product?.productId,
        name: d.product?.productName,
        country: d.product?.countryCode,
        currency: d.product?.currencyCode,
        discount_pct: Number(d.discountPercentage),
      })).filter((d) => d.name && d.discount_pct > 0);
      rows.sort((a, b) => b.discount_pct - a.discount_pct);
      return Response.json({ env: env.name, discounts: rows, fetched_at: new Date().toISOString() });
    }
    return Response.json({ error: 'Reloadly rejected the credentials for both live and sandbox' }, { status: 502 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}