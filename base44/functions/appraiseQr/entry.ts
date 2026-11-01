import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const BRANDS = ['Amazon', 'Steam', 'Starbucks', 'Uber Eats', 'Netflix', 'Apple'];
const MAX_REVIEW = 20;
const r2 = (n) => Math.round(n * 100) / 100;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { file_uri } = await req.json().catch(() => ({}));
    if (typeof file_uri !== 'string' || !file_uri || file_uri.length > 500) {
      return Response.json({ error: 'file_uri is required' }, { status: 400 });
    }

    const pending = await base44.entities.CreditVoucher.count({ created_by_id: user.id, status: 'review' });
    if (pending >= MAX_REVIEW) {
      return Response.json({ error: 'Too many vouchers waiting for review. Add or dismiss some first.' }, { status: 429 });
    }

    const core = base44.asServiceRole.integrations.Core;
    const { signed_url } = await core.CreateFileSignedUrl({ file_uri, expires_in: 300 });

    // Credit agent: reads the voucher image and decides what to do with the credit
    const read = await core.InvokeLLM({
      prompt: `You are the Credit Manager agent in a gift card and credit marketplace. The image should be a vendor voucher or gift card, usually with a QR code. Read it carefully.
Return: is_voucher (false if the image is not a voucher, gift card or credit QR), brand (prefer one of ${BRANDS.join(', ')} when it matches, otherwise the vendor name as printed), face_value in USD (0 if not visible), last4 (last 4 characters of any printed code, empty if none), confidence 0 to 1 that this is a genuine, readable voucher.
Never guess a value that is not visible. Do not output the full code.`,
      file_urls: [signed_url],
      response_json_schema: {
        type: 'object',
        properties: {
          is_voucher: { type: 'boolean' },
          brand: { type: 'string' },
          face_value: { type: 'number' },
          last4: { type: 'string' },
          confidence: { type: 'number' },
        },
        required: ['is_voucher', 'brand', 'face_value', 'confidence'],
      },
    });
    if (!read.is_voucher || !read.brand) {
      return Response.json({ error: 'That does not look like a voucher or gift card QR. Try a clearer photo.' }, { status: 422 });
    }
    const face = r2(Math.min(2000, Math.max(0, Number(read.face_value) || 0)));
    if (face <= 0) {
      return Response.json({ error: 'Could not read a value on this voucher. Try a clearer photo.' }, { status: 422 });
    }
    const last4 = /^[A-Za-z0-9]{1,4}$/.test(read.last4 || '') ? read.last4 : '';

    // Arbitrage context: open exchange listings for this brand and the best alternatives
    const { items: open } = await base44.asServiceRole.entities.Listing.filter({ status: 'open' }, { limit: 100 });
    const ratios = open.map((l) => ({ title: l.title, ratio: r2(l.price / l.face_value) }));
    const same = ratios.filter((l) => l.title.toLowerCase().includes(read.brand.toLowerCase()));
    const cheapest = ratios.slice().sort((a, b) => a.ratio - b.ratio).slice(0, 3);

    const plan = await core.InvokeLLM({
      prompt: `You are the Credit Manager agent. A user holds a ${read.brand} voucher worth $${face}. Decide how to manage this credit.
Open exchange listings for the same brand (price as share of face value): ${JSON.stringify(same.slice(0, 5))}.
Cheapest open listings overall: ${JSON.stringify(cheapest)}.
Pool brands available for swaps: ${BRANDS.join(', ')} (a swap costs a 1.5% fee).
Choose action: "use" (spend it as is, best when the brand is commonly redeemed), "swap" (swap into another pool brand with better value) or "hold" (wait, e.g. confidence is low or no better option). Give target_brand only for swap. Write reason as one plain sentence and market_note as one plain sentence about the arbitrage angle. Voucher read confidence: ${read.confidence}.`,
      response_json_schema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['use', 'swap', 'hold'] },
          target_brand: { type: 'string' },
          reason: { type: 'string' },
          market_note: { type: 'string' },
        },
        required: ['action', 'reason', 'market_note'],
      },
    });

    const voucher = await base44.entities.CreditVoucher.create({
      brand: read.brand, face_value: face, last4, qr_file_uri: file_uri,
      confidence: Math.min(1, Math.max(0, Number(read.confidence) || 0)),
      action: plan.action, target_brand: plan.action === 'swap' ? plan.target_brand : undefined,
      reason: plan.reason, market_note: plan.market_note, status: 'review',
    });
    return Response.json({ voucher });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}