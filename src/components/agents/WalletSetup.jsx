import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function WalletSetup() {
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState(null);
  const status = useQuery({
    queryKey: ["agentWallet"],
    queryFn: async () => (await base44.functions.invoke("agentWallet", { action: "status" })).data,
  });

  const generate = async () => {
    setBusy(true);
    try {
      const { data } = await base44.functions.invoke("agentWallet", { action: "generate" });
      setFresh(data);
    } catch (e) {
      toast.error(e?.response?.data?.error || "Could not generate a wallet");
    }
    setBusy(false);
  };

  const s = status.data;
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="mb-1 flex items-center gap-2 font-heading text-lg font-semibold">
        <KeyRound className="h-5 w-5 text-primary" /> Agent wallet (USDC on Solana)
      </div>
      {status.isLoading && <div className="text-sm text-muted-foreground">Checking wallet...</div>}
      {s && (
        <div className="space-y-1 text-sm text-muted-foreground">
          <div>Wallet key: {s.keyConfigured ? "set" : "not set"}{s.address && <span className="ml-2 break-all text-foreground">{s.address}</span>}</div>
          <div>Payout address: {s.payoutConfigured ? "set" : "not set"}</div>
        </div>
      )}
      {!s?.keyConfigured && (
        <div className="mt-4">
          <Button size="sm" variant="outline" disabled={busy} onClick={generate}>
            {busy && <Loader2 className="animate-spin" />} Generate a new wallet
          </Button>
        </div>
      )}
      {fresh && (
        <div className="mt-4 space-y-2 rounded-2xl border border-primary/40 p-4 text-sm">
          <div className="font-medium">Save these now. The private key is shown only once.</div>
          <div>Address (fund this with USDC plus a little SOL):<div className="break-all text-primary">{fresh.address}</div></div>
          <div>Private key:<div className="break-all rounded bg-muted p-2 font-mono text-xs">{fresh.private_key}</div></div>
          <div className="text-muted-foreground">
            Add the private key as the secret SOLANA_WALLET_PRIVATE_KEY, and the address that should receive agent payments as AGENT_PAYOUT_ADDRESS, on the dashboard's Secrets page.
          </div>
        </div>
      )}
    </div>
  );
}