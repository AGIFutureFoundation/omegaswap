import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { sweepCards } from '../../shared/sweep.ts';

const THRESHOLD = 10;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { items } = await base44.entities.GiftCard.filter({ created_by_id: user.id }, { limit: 200 });
    return Response.json(await sweepCards(base44.asServiceRole, items, THRESHOLD));
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}