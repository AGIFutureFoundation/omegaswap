import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

export default function StrategyCompare({ uid }) {
  const q = useQuery({
    queryKey: ["strategyCompare", uid],
    enabled: !!uid,
    queryFn: async () =>
      (await base44.entities.AgentPayment.aggregate({
        query: { created_by_id: uid, profit: { $exists: true } },
        groupBy: "source_agent",
        sum: ["profit"],
        avg: ["spread_pct"],
      })).rows,
  });
  const data = (q.data || []).map((r) => ({
    agent: r.source_agent,
    profit: Number((r.sum_profit || 0).toFixed(2)),
    spread: Number((r.avg_spread_pct || 0).toFixed(1)),
    trades: r.count,
  }));
  const best = data.reduce((a, b) => (!a || b.profit > a.profit ? b : a), null);

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="mb-1 font-heading text-lg font-semibold">Strategy comparison</div>
      <p className="mb-4 text-sm text-muted-foreground">
        Total profit and average profit spread per agent.
        {best && ` Best so far: ${best.agent} ($${best.profit.toFixed(2)} across ${best.trades} trades).`}
      </p>
      {q.isLoading && <div className="py-8 text-sm text-muted-foreground">Loading...</div>}
      {!q.isLoading && !data.length && <div className="py-8 text-sm text-muted-foreground">No trades yet. Run the agents on the Exchange page.</div>}
      {data.length > 0 && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="agent" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis yAxisId="l" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v}`} />
              <YAxis yAxisId="r" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Legend />
              <Bar yAxisId="l" dataKey="profit" name="Total profit ($)" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
              <Bar yAxisId="r" dataKey="spread" name="Avg spread (%)" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}