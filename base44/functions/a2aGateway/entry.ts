import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const BASE = 'https://omegaswap.base44.app';
const QUOTE_PRICE_USDC = '0.001';
const r2 = (n) => Math.round(n * 100) / 100;

const AGENTS = [
  { name: 'Scout', skill: 'discover underpriced gift cards, credits and AI tokens' },
  { name: 'Broker', skill: 'match sellers and buyers across brands' },
  { name: 'Vendor', skill: 'list vendor inventory' },
  { name: 'Arbiter', skill: 'buy underpriced listings and relist them at 97% of face value' },
  { name: 'Credit Manager', skill: 'read vendor QR vouchers and recommend spend, swap or hold' },
];

// Public agent-to-agent endpoint. GET or {action:"card"} returns an agent card (NANDA / A2A style discovery).
// {action:"quote"} is paywalled x402 style: 402 with payment requirements until a payment proof is attached.
export default async function(req) {
  try {
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const action = body.action || 'card';
    const endpoint = `${BASE}/functions/a2aGateway`;

    const card = {
      protocol: 'a2a-card/0.1',
      name: 'OmegaSwap',
      description: 'Gift card, credit and digital asset arbitrage marketplace for agents.',
      endpoint,
      discovery: ['NANDA-style agent facts', 'A2A agent card'],
      agents: AGENTS,
      actions: [
        { action: 'card', price: 'free' },
        { action: 'quote', price: `${QUOTE_PRICE_USDC} USDC`, payment: 'x402' },
      ],
    };
    if (action === 'card') return Response.json(card);

    if (action !== 'quote') return Response.json({ error: 'Unknown action' }, { status: 400 });

    const proof = req.headers.get('X-PAYMENT') || body.payment;
    if (!proof || typeof proof !== 'string') {
      return Response.json({
        x402Version: 1,
        error: 'Payment required',
        accepts: [{
          scheme: 'exact', network: 'solana', asset: 'USDC', maxAmountRequired: QUOTE_PRICE_USDC,
          resource: endpoint, description: 'Arbitrage quote: top open spreads', payTo: 'OmegaSwap treasury',
        }],
      }, { status: 402 });
    }

    const base44 = createClientFromRequest(req);
    const { items } = await base44.asServiceRole.entities.Listing.filter({ status: 'open' }, { limit: 100 });
    const spreads = items
      .map((l) => ({
        id: l.id, title: l.title, asset_type: l.asset_type, face_value: l.face_value, price: l.price,
        discount_pct: r2((1 - l.price / l.face_value) * 100),
      }))
      .sort((a, b) => b.discount_pct - a.discount_pct)
      .slice(0, 10);
    return Response.json({
      quote: spreads,
      settlement: 'unverified: payment proof is accepted but not checked on-chain yet',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}