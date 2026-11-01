import { useState } from "react";
import { Network, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

const ENDPOINT = "https://omegaswap.base44.app/functions/a2aGateway";

const call = async (payload) => {
  try {
    const res = await base44.functions.invoke("a2aGateway", payload);
    return { status: res.status, data: res.data };
  } catch (err) {
    return { status: err.response?.status || 500, data: err.response?.data || { error: err.message } };
  }
};

export default function AgentNetwork() {
  const [out, setOut] = useState(null);
  const [busy, setBusy] = useState("");

  const run = async (label, payload) => {
    setBusy(label);
    setOut({ label, ...(await call(payload)) });
    setBusy("");
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 space-y-3">
      <div className="flex items-center gap-2 font-heading text-lg font-semibold">
        <Network className="h-5 w-5 text-primary" /> Agent network (A2A + x402)
      </div>
      <p className="text-sm text-muted-foreground">
        Outside agents can discover your team through a public agent card and buy arbitrage quotes by paying per call.
        An unpaid quote request gets an HTTP 402 challenge; a paid one returns the top open spreads.
      </p>
      <code className="block break-all rounded-xl bg-background/60 p-3 text-xs">{ENDPOINT}</code>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={!!busy} onClick={() => run("Agent card", { action: "card" })}>Fetch agent card</Button>
        <Button size="sm" variant="outline" disabled={!!busy} onClick={() => run("Quote without payment", { action: "quote" })}>Quote, unpaid</Button>
        <Button size="sm" disabled={!!busy} onClick={() => run("Quote with payment", { action: "quote", payment: "demo-proof" })}>Quote, paid</Button>
        {busy && <Loader2 className="h-4 w-4 animate-spin self-center text-primary" />}
      </div>
      {out && (
        <div>
          <div className="mb-1 text-xs text-muted-foreground">{out.label}: HTTP {out.status}</div>
          <pre className="max-h-72 overflow-auto rounded-xl bg-background/60 p-3 text-xs">{JSON.stringify(out.data, null, 2)}</pre>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Payment proofs are accepted but not verified on-chain yet, and NANDA registry registration is not connected.
      </p>
    </div>
  );
}