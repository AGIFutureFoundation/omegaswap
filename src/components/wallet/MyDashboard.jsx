import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import BalanceBreakdown from "@/components/wallet/BalanceBreakdown";

export default function MyDashboard({ uid, name, cards = [], cardsLoading }) {
  const agents = useQuery({
    queryKey: ["teamAgents", uid],
    enabled: !!uid,
    queryFn: async () => (await base44.entities.TeamAgent.filter({ created_by_id: uid }, { limit: 50 })).items,
  });
  const trades = useQuery({
    queryKey: ["myTrades", uid],
    enabled: !!uid,
    queryFn: async () => (await base44.entities.Trade.filter({ created_by_id: uid }, { sort: "-created_date", limit: 5 })).items,
  });
  const earnings = useQuery({
    queryKey: ["myEarnings", uid],
    enabled: !!uid,
    queryFn: async () =>
      (await base44.entities.AgentPayment.aggregate({ query: { created_by_id: uid }, sum: ["profit"] })).rows?.[0]?.sum_profit || 0,
  });

  return (
    <div className="space-y-5 rounded-3xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">Welcome back{name ? `, ${name}` : ""}</div>
          <div className="font-heading text-lg font-semibold">Your dashboard</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Arbitrage earnings</div>
          <div className="font-heading text-3xl font-bold text-primary">${Number(earnings.data || 0).toFixed(2)}</div>
        </div>
      </div>
      <BalanceBreakdown cards={cards} loading={cardsLoading} />
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <div className="mb-2 text-sm font-medium">Active agents ({(agents.data || []).length})</div>
          {!(agents.data || []).length && <div className="text-sm text-muted-foreground">None yet. Deploy the starter team in the Console.</div>}
          {(agents.data || []).map((a) => (
            <div key={a.id} className="flex justify-between border-b border-border py-1.5 text-sm last:border-0">
              <span>{a.name}</span>
              <span className="text-muted-foreground">{a.role}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="mb-2 text-sm font-medium">Recent trades</div>
          {!(trades.data || []).length && <div className="text-sm text-muted-foreground">No trades yet.</div>}
          {(trades.data || []).map((t) => (
            <div key={t.id} className="flex justify-between border-b border-border py-1.5 text-sm last:border-0">
              <span>{t.kind === "swap" ? `${t.from_brand} → ${t.to_brand}` : `Spent ${t.from_brand || ""}`}</span>
              <span>${Number(t.amount).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}