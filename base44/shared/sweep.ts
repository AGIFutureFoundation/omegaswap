import { POOL_FEE, POOL_RATES } from './rates.ts';

const r2 = (n) => Math.round(n * 100) / 100;
const provRef = (cardId) => `card:${cardId}`;

// Server-side proof that a card was minted by a backend flow (purchase). LedgerEntry writes are admin-only,
// so users cannot forge this. Records the verified face value (zero cash impact).
export async function markCardVerified(sr, card, userId) {
  await sr.entities.LedgerEntry.create({
    user_id: userId, amount: 0, kind: 'purchase', ref: provRef(card.id),
    memo: `verified:${card.balance}`,
  });
}

// Converts small gift card balances into cash ledger credits, zeroing each card. Cards are owned by `created_by_id`.
// Only cards with server-verified provenance are credited, and never more than their verified face value.
export async function sweepCards(sr, cards, threshold) {
  const candidates = cards.filter((c) => c.balance > 0 && c.balance < threshold && POOL_RATES[c.brand] !== undefined);
  if (!candidates.length) return { swept: 0, credited: 0 };
  const { items: proofs } = await sr.entities.LedgerEntry.filter(
    { ref: { $in: candidates.map((c) => provRef(c.id)) } }, { limit: 500 },
  );
  const verified = new Map();
  for (const p of proofs) {
    const m = /^verified:([\d.]+)$/.exec(p.memo || '');
    if (m) verified.set(p.ref, Number(m[1]));
  }
  const small = candidates.filter((c) => verified.has(provRef(c.id)));
  let credited = 0;
  for (const c of small) {
    const face = Math.min(c.balance, verified.get(provRef(c.id)));
    const credit = r2(face * POOL_RATES[c.brand] * (1 - POOL_FEE));
    await sr.entities.LedgerEntry.create({
      user_id: c.created_by_id, amount: credit, kind: 'sweep',
      memo: `Swept ${c.brand} $${face.toFixed(2)}`, ref: c.id,
    });
    await sr.entities.GiftCard.update(c.id, { balance: 0 });
    credited += credit;
  }
  return { swept: small.length, credited: r2(credited) };
}