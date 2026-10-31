import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

const PRODUCTS = {
  "Amazon": "amazon-usa",
  "Steam": "steam-usa",
  "Starbucks": "starbucks-usa",
  "Uber Eats": "uber-eats-usa",
  "Netflix": "netflix-usa",
  "Apple": "itunes-usa",
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const headers = { Authorization: `Bearer ${secrets.get("BITREFILL_API_KEY")}` };
    const spotRes = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot', { signal: AbortSignal.timeout(10000) });
    const btcUsd = Number((await spotRes.json())?.data?.amount);
    if (!btcUsd) return Response.json({ error: 'BTC price unavailable' }, { status: 502 });

    const entries = Object.entries(PRODUCTS);
    const results = await Promise.allSettled(entries.map(async ([name, id]) => {
      const r = await fetch(`https://api.bitrefill.com/v2/products/${id}`, { headers, signal: AbortSignal.timeout(10000) });
      if (!r.ok) throw new Error(`${id} ${r.status}`);
      const p = (await r.json()).data;
      const pkgs = (p.packages || []).map((k) => ({ value: Number(k.value), sats: Number(k.price) })).filter((k) => k.value > 0 && k.sats > 0);
      if (!pkgs.length) throw new Error(`${id} no packages`);
      pkgs.sort((a, b) => Math.abs(a.value - 50) - Math.abs(b.value - 50));
      const best = pkgs[0];
      const cost = (best.sats / 1e8 * btcUsd) / best.value;
      return { name, product_id: id, face: best.value, cost, in_stock: p.in_stock !== false };
    }));

    const brands = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    const failed = results.map((r, i) => (r.status === 'rejected' ? `${entries[i][0]}: ${r.reason?.message}` : null)).filter(Boolean);
    return Response.json({ brands, failed, btcUsd, fetched_at: new Date().toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}