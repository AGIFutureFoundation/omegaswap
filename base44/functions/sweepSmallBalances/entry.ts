import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { POOL_FEE, POOL_RATES } from '../../shared/rates.ts';

const THRESHOLD = 10;
const r2 = (n) => Math.round(n * 100) / 100;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { items } = await base44.entities.GiftCard.filter({ created_by_id: user.id }, { limit: 200 });
    const small = items.filter((c) => c.balance > 0 && c.balance < THRESHOLD && POOL_RATES[c.brand] !== undefined);

    let credited = 0;
    for (const c of small) {
      const credit = r2(c.balance * POOL_RATES[c.brand] * (1 - POOL_FEE));
      await base44.asServiceRole.entities.LedgerEntry.create({
        user_id: user.id, amount: credit, kind: 'sweep',
        memo: `Swept ${c.brand} $${c.balance.toFixed(2)}`, ref: c.id,
      });
      await base44.entities.GiftCard.update(c.id, { balance: 0 });
      credited += credit;
    }
    return Response.json({ swept: small.length, credited: r2(credited) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}