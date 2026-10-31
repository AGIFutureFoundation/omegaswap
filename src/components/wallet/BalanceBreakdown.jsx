import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function BalanceBreakdown({ cards, loading }) {
  const positions = useQuery({
    queryKey: ["arbiterPositions"],
    queryFn: async () =>
      (await base44.entities.Listing.filter({ status: "open", seller: "Arbiter" }, { sort: "-created_date", limit: 50 })).items,
  });

  const byBrand = Object.values(
    cards.reduce((acc, c) => {
      acc[c.brand] = acc[c.brand] || { brand: c.brand, balance: 0, count: 0 };
      acc[c.brand].balance += c.balance;
      acc[c.brand].count += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.balance - a.balance);
  const total = byBrand.reduce((s, b) => s + b.balance, 0);

  const pos = positions.data || [];
  const posValue = pos.reduce((s, p) => s + p.price, 0);
  const posUpside = pos.reduce((s, p) => s + (p.face_value - p.price), 0);

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="rounded-2xl border border-border bg-background/40 p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <div className="text-sm font-medium">Gift card balances</div>
          <div className="font-heading text-xl font-bold">${total.toFixed(2)}</div>
        </div>
        {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
        {!loading && !byBrand.length && <div className="text-sm text-muted-foreground">No balances yet.</div>}
        {byBrand.map((b) => (
          <div key={b.brand} className="mb-3 last:mb-0">
            <div className="mb-1 flex justify-between text-sm">
              <span>{b.brand} <span className="text-xs text-muted-foreground">{b.count} {b.count === 1 ? "card" : "cards"}</span></span>
              <span className="font-medium">${b.balance.toFixed(2)} <span className="text-xs text-muted-foreground">{total ? ((b.balance / total) * 100).toFixed(0) : 0}%</span></span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary" style={{ width: `${total ? (b.balance / total) * 100 : 0}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-background/40 p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <div className="text-sm font-medium">Active arbitrage positions ({pos.length})</div>
          <div className="text-right">
            <div className="font-heading text-xl font-bold">${posValue.toFixed(2)}</div>
            <div className="text-xs text-primary">+${posUpside.toFixed(2)} potential</div>
          </div>
        </div>
        {positions.isLoading && <div className="text-sm text-muted-foreground">Loading...</div>}
        {!positions.isLoading && !pos.length && <div className="text-sm text-muted-foreground">No open positions. Run the agents on the Exchange page.</div>}
        <div className="max-h-48 overflow-y-auto">
          {pos.map((p) => (
            <div key={p.id} className="flex justify-between border-b border-border py-1.5 text-sm last:border-0">
              <span className="truncate pr-2">{p.title}</span>
              <span className="shrink-0">${p.price.toFixed(2)} <span className="text-xs text-muted-foreground">of ${p.face_value.toFixed(0)}</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}