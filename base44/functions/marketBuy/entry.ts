import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { getBalance } from '../../shared/ledger.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { listing_id } = await req.json().catch(() => ({}));
    if (!listing_id) return Response.json({ error: 'listing_id is required' }, { status: 400 });

    const sr = base44.asServiceRole;
    const listing = await sr.entities.Listing.get(listing_id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!listing) return Response.json({ error: 'Listing not found' }, { status: 404 });
    if (listing.status !== 'open') return Response.json({ error: 'Already sold' }, { status: 409 });

    const balance = await getBalance(base44, user.id);
    if (balance < listing.price) {
      return Response.json({ error: `Not enough balance. You have $${balance.toFixed(2)}, this costs $${listing.price.toFixed(2)}.` }, { status: 402 });
    }

    await sr.entities.Listing.update(listing.id, { status: 'sold', buyer: user.id });
    await sr.entities.LedgerEntry.create({
      user_id: user.id,
      amount: -listing.price,
      kind: 'purchase',
      memo: `Bought ${listing.title}`,
      ref: listing.id,
    });
    // Delivered into the buyer's wallet as a balance they own
    await base44.entities.GiftCard.create({ brand: listing.title, balance: listing.face_value });

    return Response.json({ ok: true, balance: balance - listing.price });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}