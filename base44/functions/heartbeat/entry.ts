import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

async function ping(name, url, key, model) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 }),
      signal: AbortSignal.timeout(8000),
    });
    return { name, ok: res.ok, detail: res.ok ? 'Responding' : `Rejected (${res.status})` };
  } catch (_e) {
    return { name, ok: false, detail: 'Unreachable' };
  }
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const sr = base44.asServiceRole;

    const tfKey = secrets.get('TRUEFOUNDRY_API_KEY');
    const tfBase = (secrets.get('TRUEFOUNDRY_BASE_URL') || '').replace(/\/+$/, '');
    const tfModel = secrets.get('TRUEFOUNDRY_MODEL');
    const asiKey = secrets.get('ASI_CLOUD_API_KEY');
    const brKey = secrets.get('BITREFILL_API_KEY');

    const checks = await Promise.all([
      tfKey && tfBase && tfModel
        ? ping('TrueFoundry AI gateway', `${tfBase.includes('/api/llm') ? tfBase : `${tfBase}/api/llm`}/chat/completions`, tfKey, tfModel)
        : { name: 'TrueFoundry AI gateway', ok: false, detail: 'Not configured' },
      asiKey
        ? ping('ASI Cloud (fallback)', 'https://inference.asicloud.cudos.org/v1/chat/completions', asiKey, 'asi1-mini')
        : { name: 'ASI Cloud (fallback)', ok: false, detail: 'Not configured' },
      brKey
        ? fetch('https://api.bitrefill.com/v2/products/steam-usa', { headers: { Authorization: `Bearer ${brKey}` }, signal: AbortSignal.timeout(8000) })
            .then((r) => ({ name: 'Bitrefill live prices', ok: r.ok, detail: r.ok ? 'Responding' : `Rejected (${r.status})` }))
            .catch(() => ({ name: 'Bitrefill live prices', ok: false, detail: 'Unreachable' }))
        : { name: 'Bitrefill live prices', ok: false, detail: 'Not configured' },
    ]);

    const [{ items: states }, { items: open }, { items: lastPay }] = await Promise.all([
      sr.entities.AgentState.filter({ key: 'arbiter' }, { limit: 1 }),
      sr.entities.Listing.filter({ status: 'open' }, { limit: 100 }),
      sr.entities.AgentPayment.filter({ agent: 'Arbiter' }, { sort: '-created_date', limit: 1 }),
    ]);
    const s = states[0];
    return Response.json({
      checks,
      healthy: checks.some((c) => c.ok),
      arbiter: s ? { runs: s.runs || 0, max_ratio: s.max_ratio, min_ratio: s.min_ratio, rejection_rate: s.rejection_rate || 0, last_adjustment: s.last_adjustment || '' } : null,
      open_listings: open.length,
      last_trade_at: lastPay[0]?.created_date || null,
      checked_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}