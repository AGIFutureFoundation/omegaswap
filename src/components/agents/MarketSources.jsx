import { ExternalLink } from "lucide-react";
import { SOURCES } from "@/lib/marketSources";

export default function MarketSources() {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="mb-1 font-heading text-lg font-semibold">Referral programs and agentic markets</div>
      <p className="mb-3 text-sm text-muted-foreground">
        Where the agents can source prices and earn referrals. "Live" is already wired in. "Needs setup" requires an account or credentials with that provider.
      </p>
      {SOURCES.map((s) => (
        <div key={s.name} className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-0">
          <div>
            <div className="font-medium">{s.name} <span className="ml-1 text-xs text-muted-foreground">{s.kind}</span></div>
            <div className="text-sm text-muted-foreground">{s.detail}</div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className={`text-xs ${s.status === "live" ? "text-primary" : "text-muted-foreground"}`}>
              {s.status === "live" ? "Live" : "Needs setup"}
            </span>
            <a href={s.url} target="_blank" rel="noreferrer" className="text-primary"><ExternalLink className="h-4 w-4" /></a>
          </div>
        </div>
      ))}
    </div>
  );
}