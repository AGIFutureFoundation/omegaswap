import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Switch } from "@/components/ui/switch";

const EVERY_MS = 5 * 60 * 1000;

export default function HeartbeatCard() {
  const qc = useQueryClient();
  const [auto, setAuto] = useState(false);
  const beat = useQuery({
    queryKey: ["heartbeat"],
    queryFn: async () => (await base44.functions.invoke("heartbeat", {})).data,
    refetchInterval: 60000,
  });
  const tick = useMutation({
    mutationFn: async () => (await base44.functions.invoke("runAgents", {})).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["heartbeat"] });
      qc.invalidateQueries({ queryKey: ["agentPayments"] });
    },
  });

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => tick.mutate(), EVERY_MS);
    return () => clearInterval(id);
  }, [auto]);

  const d = beat.data;
  return (
    <div className="space-y-4 rounded-3xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-heading text-lg font-semibold">
          <Activity className="h-5 w-5 text-primary" /> Heartbeat
          {beat.isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Run Arbiter every 5 min (while this page is open)
          <Switch checked={auto} onCheckedChange={setAuto} />
        </label>
      </div>
      {beat.isError && <div className="text-sm text-destructive">Health check failed.</div>}
      {d && (
        <>
          <div className="grid gap-2 sm:grid-cols-3">
            {d.checks.map((c) => (
              <div key={c.name} className="flex items-center gap-2 rounded-2xl border border-border p-3 text-sm">
                {c.ok ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <XCircle className="h-4 w-4 text-destructive" />}
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.detail}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            {d.open_listings} open listings · Arbiter runs {d.arbiter?.runs ?? 0} · buy window {Math.round((d.arbiter?.min_ratio ?? 0.5) * 100)}–{Math.round((d.arbiter?.max_ratio ?? 0.9) * 100)}% of face · rejection rate {Math.round((d.arbiter?.rejection_rate ?? 0) * 100)}%
            {d.last_trade_at && ` · last trade ${new Date(d.last_trade_at).toLocaleString()}`}
          </div>
          {d.arbiter?.last_adjustment && <div className="text-xs text-muted-foreground">Self-correction: {d.arbiter.last_adjustment}</div>}
        </>
      )}
      {tick.data && (
        <div className="text-sm">Last tick: bought {tick.data.bought}, listed {tick.data.listed}, profit ${tick.data.profit}</div>
      )}
    </div>
  );
}