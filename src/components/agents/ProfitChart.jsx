import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

const AGENTS = [
  { name: "Scout", color: "hsl(var(--chart-1))" },
  { name: "Broker", color: "hsl(var(--chart-2))" },
  { name: "Vendor", color: "hsl(var(--chart-3))" },
];

// Cumulative profit per sourcing agent, one point per trade
function buildSeries(payments) {
  const totals = { Scout: 0, Broker: 0, Vendor: 0 };
  return payments
    .filter((p) => p.profit !== undefined && p.profit !== null && totals[p.source_agent] !== undefined)
    .reverse()
    .map((p) => {
      totals[p.source_agent] += p.profit;
      return { time: new Date(p.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), ...totals };
    });
}

export default function ProfitChart({ uid }) {
  const q = useQuery({
    queryKey: ["profitSeries", uid],
    enabled: !!uid,
    queryFn: async () =>
      (await base44.entities.AgentPayment.filter({ created_by_id: uid }, { sort: "-created_date", limit: 200 })).items,
  });
  const data = buildSeries(q.data || []);
  const totals = data.length ? data[data.length - 1] : null;
  const best = totals ? AGENTS.reduce((a, b) => (totals[b.name] > totals[a.name] ? b : a)) : null;

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="mb-1 font-heading text-lg font-semibold">Agent profit over time</div>
      <p className="mb-4 text-sm text-muted-foreground">
        Cumulative profit the Arbiter captured on deals sourced by each agent.
        {best && ` Top performer: ${best.name} ($${totals[best.name].toFixed(2)}).`}
      </p>
      {q.isLoading && <div className="py-8 text-sm text-muted-foreground">Loading...</div>}
      {!q.isLoading && !data.length && (
        <div className="py-8 text-sm text-muted-foreground">No trades yet. Run the agents on the Exchange page to start the chart.</div>
      )}
      {data.length > 0 && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(v) => `$${Number(v).toFixed(2)}`}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
              />
              <Legend />
              {AGENTS.map((a) => (
                <Line key={a.name} type="monotone" dataKey={a.name} stroke={a.color} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}