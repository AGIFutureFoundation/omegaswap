import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

const AGENTS = [
  { name: "Scout", color: "hsl(var(--chart-1))" },
  { name: "Broker", color: "hsl(var(--chart-2))" },
  { name: "Vendor", color: "hsl(var(--chart-3))" },
];

// Cost of a trade = profit / (spread_pct / 100); margin = profit / cost
function summarize(payments) {
  const acc = Object.fromEntries(AGENTS.map((a) => [a.name, { profit: 0, cost: 0, trades: 0 }]));
  const series = [];
  [...payments].reverse().forEach((p, i) => {
    const a = acc[p.source_agent];
    if (!a || !p.profit || !p.spread_pct) return;
    a.profit += p.profit;
    a.cost += p.profit / (p.spread_pct / 100);
    a.trades += 1;
    const point = { n: i + 1 };
    AGENTS.forEach(({ name }) => {
      if (acc[name].cost > 0) point[name] = Number(((acc[name].profit / acc[name].cost) * 100).toFixed(2));
    });
    series.push(point);
  });
  const rows = AGENTS.map(({ name }) => ({ name, ...acc[name], margin: acc[name].cost ? (acc[name].profit / acc[name].cost) * 100 : 0 }))
    .sort((x, y) => y.margin - x.margin);
  return { rows, series };
}

export default function PerformanceSummary({ uid }) {
  const q = useQuery({
    queryKey: ["performanceSummary", uid],
    enabled: !!uid,
    queryFn: async () =>
      (await base44.entities.AgentPayment.filter({ created_by_id: uid, profit: { $exists: true } }, { sort: "-created_date", limit: 500 })).items,
  });
  const { rows, series } = summarize(q.data || []);
  const best = rows[0]?.trades ? rows[0] : null;

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="mb-1 font-heading text-lg font-semibold">Performance summary</div>
      <p className="mb-4 text-sm text-muted-foreground">
        Actual profit margin per agent (profit divided by what the Arbiter paid), from your last 500 trades.
        {best && ` Best strategy: ${best.name} at ${best.margin.toFixed(1)}%.`}
      </p>
      {q.isLoading && <div className="py-8 text-sm text-muted-foreground">Loading...</div>}
      {!q.isLoading && !series.length && <div className="py-8 text-sm text-muted-foreground">No trades yet. Run the agents on the Exchange page.</div>}
      {series.length > 0 && (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            {rows.map((r, i) => (
              <div key={r.name} className="rounded-2xl border border-border bg-secondary/40 p-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{r.name}</span>
                  {i === 0 && r.trades > 0 && <span className="text-xs font-medium text-primary">Best</span>}
                </div>
                <div className="mt-1 font-heading text-2xl font-bold">{r.margin.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">${r.profit.toFixed(2)} profit on ${r.cost.toFixed(2)} spent, {r.trades} trades</div>
              </div>
            ))}
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="n" stroke="hsl(var(--muted-foreground))" fontSize={12} label={{ value: "Trade #", position: "insideBottom", offset: -2, fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  formatter={(v) => `${Number(v).toFixed(2)}%`}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                />
                <Legend />
                {AGENTS.map((a) => (
                  <Line key={a.name} type="monotone" dataKey={a.name} stroke={a.color} strokeWidth={2} dot={false} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}