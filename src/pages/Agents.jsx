import { ExternalLink } from "lucide-react";
import { useWalletData } from "@/hooks/useWalletData";
import { referralUrl, REFERRAL_CODE } from "@/lib/brands";
import { useLiveRates } from "@/hooks/useLiveRates";
import SkillCard from "@/components/agents/SkillCard";
import WalletSetup from "@/components/agents/WalletSetup";

export default function Agents() {
  const { me, trades, payments } = useWalletData();
  const rates = useLiveRates();
  const feeTotal = (trades.data || []).reduce((s, t) => s + (t.fee || 0), 0);
  const microTotal = (payments.data || []).reduce((s, p) => s + p.amount, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <h1 className="font-heading text-3xl font-bold">Arbitrage agents</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="Pool fees earned" value={`$${feeTotal.toFixed(2)}`} />
        <Stat label="Agent micro payments (x402 ledger)" value={`$${microTotal.toFixed(4)}`} />
      </div>
      {me.data?.role === "admin" && <WalletSetup />}
      <SkillCard />
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="mb-1 font-heading text-lg font-semibold">Spreads right now</div>
        <p className="mb-3 text-sm text-muted-foreground">
          Live Bitrefill prices (USD cards, refreshed every minute) vs the pool's credit rate. Links use referral code {REFERRAL_CODE}.
        </p>
        {rates.isLoading && <div className="py-4 text-sm text-muted-foreground">Loading live rates...</div>}
        {rates.isError && <div className="py-4 text-sm text-destructive">Could not load live Bitrefill rates.</div>}
        {rates.data?.rows.map((d) => (
          <div key={d.name} className="flex items-center justify-between border-b border-border py-3 last:border-0">
            <div>
              <div className="font-medium">{d.name}</div>
              <div className="text-sm text-muted-foreground">
                {d.cost === null
                  ? "Not available via the Bitrefill API"
                  : `Cost ${(d.cost * 100).toFixed(1)}c (based on $${d.face} card), pool credits ${(d.rate * 100).toFixed(0)}c per $1`}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`font-heading font-bold ${d.spread > 0 ? "text-primary" : "text-muted-foreground"}`}>
                {d.spread === null ? "n/a" : `${d.spread > 0 ? "+" : ""}${d.spread.toFixed(1)}%`}
              </span>
              <a href={referralUrl(d.name)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
                Buy <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="mb-3 font-heading text-lg font-semibold">Agent to agent payments</div>
        {!(payments.data || []).length && <div className="text-sm text-muted-foreground">Payments appear here after each pool swap.</div>}
        {(payments.data || []).map((p) => (
          <div key={p.id} className="flex justify-between border-b border-border py-2 text-sm last:border-0">
            <span>{p.agent} · {p.memo}</span>
            <span>
              ${p.amount.toFixed(4)} <span className="text-xs text-muted-foreground">{p.protocol}</span>{" "}
              {p.status === "settled" && p.tx_signature ? (
                <a href={`https://solscan.io/tx/${p.tx_signature}`} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">settled</a>
              ) : (
                <span className="text-xs text-muted-foreground">{p.status === "failed" ? "failed" : "ledger only"}</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 font-heading text-3xl font-bold">{value}</div>
    </div>
  );
}