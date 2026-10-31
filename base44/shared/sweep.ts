import { POOL_FEE, POOL_RATES } from './rates.ts';

const r2 = (n) => Math.round(n * 100) / 100;

// Converts small gift card balances into cash ledger credits, zeroing each card. Cards are owned by `created_by_id`.
export async function sweepCards(sr, cards, threshold) {
  const small = cards.filter((c) => c.balance > 0 && c.balance < threshold && POOL_RATES[c.brand] !== undefined);
  let credited = 0;
  for (const c of small) {
    const credit = r2(c.balance * POOL_RATES[c.brand] * (1 - POOL_FEE));
    await sr.entities.LedgerEntry.create({
      user_id: c.created_by_id, amount: credit, kind: 'sweep',
      memo: `Swept ${c.brand} $${c.balance.toFixed(2)}`, ref: c.id,
    });
    await sr.entities.GiftCard.update(c.id, { balance: 0 });
    credited += credit;
  }
  return { swept: small.length, credited: r2(credited) };
}