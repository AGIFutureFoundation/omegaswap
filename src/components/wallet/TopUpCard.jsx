import { useState } from "react";
import { Loader2, Coins } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWalletData } from "@/hooks/useWalletData";
import { useBalance } from "@/hooks/useMarket";

export default function TopUpCard() {
  const { me } = useWalletData();
  const balance = useBalance(me.data?.id);
  const [amount, setAmount] = useState("25");
  const [busy, setBusy] = useState(false);

  const topUp = async () => {
    setBusy(true);
    try {
      const { data } = await base44.functions.invoke("createDeposit", { amount: Number(amount) });
      window.location.href = data.pay_url;
    } catch (e) {
      toast.error(e?.response?.data?.error || "Could not start the payment");
      setBusy(false);
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="mb-1 flex items-center gap-2 font-heading text-lg font-semibold">
        <Coins className="h-5 w-5 text-primary" /> Fund your wallet
      </div>
      <div className="mb-3 text-sm text-muted-foreground">
        Cash balance <span className="font-heading font-bold text-foreground">${(balance.data ?? 0).toFixed(2)}</span>. Pay with crypto (BTC, ETH, USDC and more). Credited after the payment confirms.
      </div>
      <div className="flex gap-2">
        <Input type="number" min="5" max="1000" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Button disabled={busy} onClick={topUp}>
          {busy && <Loader2 className="animate-spin" />} Add funds
        </Button>
      </div>
    </div>
  );
}