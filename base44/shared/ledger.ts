export async function getBalance(base44: any, userId: string): Promise<number> {
  const res = await base44.asServiceRole.entities.LedgerEntry.aggregate({
    query: { user_id: userId },
    sum: ['amount'],
  });
  return Number(res?.rows?.[0]?.sum_amount ?? 0);
}