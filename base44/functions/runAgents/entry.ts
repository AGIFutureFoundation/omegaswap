import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

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

const r2 = (n) => Math.round(n * 100) / 100;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const sr = base44.asServiceRole;
    const { items: open } = await sr.entities.Listing.filter({ status: 'open' }, { sort: '-created_date', limit: 100 });

    // 1. Arbiter agent buys underpriced listings from other agents and relists at a profit
    let bought = 0;
    let profit = 0;
    const deals = open.filter((l) => l.seller !== ARBITER && l.price / l.face_value < 0.9).slice(0, 5);
    for (const l of deals) {
      await sr.entities.Listing.update(l.id, { status: 'sold', buyer: ARBITER });
      const resale = r2(l.face_value * 0.97);
      await sr.entities.Listing.create({
        asset_type: l.asset_type, title: l.title, face_value: l.face_value,
        price: resale, seller: ARBITER, status: 'open',
      });
      profit += resale - l.price;
      bought += 1;
      await base44.entities.AgentPayment.create({
        agent: ARBITER, protocol: 'x402', amount: r2(l.price * AGENT_FEE * 10000) / 10000,
        memo: `Routed ${l.title} from ${l.seller}`,
      });
    }

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

    return Response.json({ bought, listed, profit: r2(profit) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}