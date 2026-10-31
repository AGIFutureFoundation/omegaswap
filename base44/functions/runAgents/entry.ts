import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { sendUsdc, solanaConfigured } from '../../shared/solanaPay.ts';

const CATALOG = [
  { asset_type: 'gift_card', title: 'Amazon gift card', face: 50 },
  { asset_type: 'gift_card', title: 'Steam gift card', face: 50 },
  { asset_type: 'gift_card', title: 'Netflix gift card', face: 60 },
  { asset_type: 'gift_card', title: 'Starbucks gift card', face: 25 },
  { asset_type: 'startup_credits', title: 'AWS Activate credits', face: 1000 },
  { asset_type: 'startup_credits', title: 'Google Cloud credits', face: 500 },
  { asset_type: 'startup_credits', title: 'Azure startup credits', face: 750 },
  { asset_type: 'ai_tokens', title: 'OpenAI API credits', face: 100 },
  { asset_type: 'ai_tokens', title: 'Anthropic API credits', face: 100 },
  { asset_type: 'ai_tokens', title: 'Gemini API credits', face: 50 },
];
const SELLERS = ['Scout', 'Broker', 'Vendor'];
const ARBITER = 'Arbiter';
const AGENT_FEE = 0.001;
const MAX_OPEN = 40;
const MAX_BUYS = 5;
const ASI_URL = 'https://inference.asicloud.cudos.org/v1/chat/completions';
const ASI_MODEL = 'asi1-mini';

const r2 = (n) => Math.round(n * 100) / 100;

// Asks ASI Cloud which candidate deals the Arbiter should buy. Returns a list of ids, or null on any failure.
async function askAsi(candidates) {
  const key = secrets.get('ASI_CLOUD_API_KEY') || secrets.get('OPENAI_API_KEY') || secrets.get('OPENAI_API_KEY_2');
  if (!key) return null;
  const rows = candidates.map((l) => ({
    id: l.id, title: l.title, seller: l.seller, face: l.face_value, price: l.price,
    discount_pct: r2((1 - l.price / l.face_value) * 100),
  }));
  const prompt = `You are the Arbiter trading agent in a marketplace for gift cards, startup credits and AI tokens. You buy underpriced listings and relist them at 97% of face value. Pick at most ${MAX_BUYS} listings to buy, favouring the biggest profit while keeping a mix of assets. Reply with JSON only, like {"buy":["id1","id2"]}.\nListings: ${JSON.stringify(rows)}`;
  try {
    const res = await fetch(ASI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: ASI_MODEL, messages: [{ role: 'user', content: prompt }], max_tokens: 300, temperature: 0.2 }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const text = (await res.json()).choices?.[0]?.message?.content || '';
    const match = text.match(/\{[\s\S]*\}/);
    const ids = match ? JSON.parse(match[0]).buy : null;
    return Array.isArray(ids) ? ids.map(String) : null;
  } catch (_e) {
    return null;
  }
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const sr = base44.asServiceRole;
    const { items: open } = await sr.entities.Listing.filter({ status: 'open' }, { sort: '-created_date', limit: 100 });

    // 1. Arbiter agent: ASI Cloud picks which underpriced listings to buy (rule-based fallback if it is unavailable)
    const candidates = open
      .filter((l) => l.seller !== ARBITER && l.price / l.face_value < 0.9)
      .sort((a, b) => a.price / a.face_value - b.price / b.face_value)
      .slice(0, 10);
    const picked = candidates.length ? await askAsi(candidates) : null;
    const ai = picked !== null;
    const deals = (ai ? candidates.filter((l) => picked.includes(l.id)) : candidates).slice(0, MAX_BUYS);

    let bought = 0;
    let profit = 0;
    if (deals.length) {
      await Promise.all(deals.map((l) => sr.entities.Listing.update(l.id, { status: 'sold', buyer: ARBITER })));
      await sr.entities.Listing.bulkCreate(deals.map((l) => ({
        asset_type: l.asset_type, title: l.title, face_value: l.face_value,
        price: r2(l.face_value * 0.97), seller: ARBITER, status: 'open',
      })));
    }
    const payments = [];
    for (const l of deals) {
      const dealProfit = r2(l.face_value * 0.97 - l.price);
      profit += dealProfit;
      bought += 1;
      const fee = r2(l.price * AGENT_FEE * 10000) / 10000;
      let status = 'recorded';
      let tx_signature;
      // Real settlement only for admins, so regular users can't spend the platform wallet
      if (user.role === 'admin' && solanaConfigured()) {
        try {
          tx_signature = await sendUsdc(fee);
          status = 'settled';
        } catch (_e) {
          status = 'failed';
        }
      }
      payments.push({
        agent: ARBITER, protocol: 'x402', amount: fee, status, tx_signature,
        source_agent: l.seller, profit: dealProfit, spread_pct: r2((dealProfit / l.price) * 100),
        memo: `Routed ${l.title} from ${l.seller}`,
      });
    }
    if (payments.length) await base44.entities.AgentPayment.bulkCreate(payments);

    // 2. Seller agents post fresh listings with varied pricing
    let listed = 0;
    const room = MAX_OPEN - (open.length - bought);
    const toPost = Math.max(0, Math.min(6, room));
    const fresh = [];
    for (let i = 0; i < toPost; i++) {
      const item = CATALOG[Math.floor(Math.random() * CATALOG.length)];
      const ratio = 0.8 + Math.random() * 0.2;
      fresh.push({
        asset_type: item.asset_type, title: item.title, face_value: item.face,
        price: r2(item.face * ratio), seller: SELLERS[i % SELLERS.length], status: 'open',
      });
      listed += 1;
    }
    if (fresh.length) await sr.entities.Listing.bulkCreate(fresh);

    return Response.json({ bought, listed, profit: r2(profit), ai });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}