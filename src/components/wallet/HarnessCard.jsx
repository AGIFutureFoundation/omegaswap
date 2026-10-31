import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Layers } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useWalletData } from "@/hooks/useWalletData";
import { useBalance } from "@/hooks/useMarket";

const THRESHOLD = 10;

export default function HarnessCard() {
  const qc = useQueryClient();
  const { me, cards } = useWalletData();
  const cash = useBalance(me.data?.id);
  const linked = useQuery({
    queryKey: ["linkedApps"],
    queryFn: async () => (await base44.entities.LinkedApp.list("-created_date", 100)).items ?? [],
  });
  const [busy, setBusy] = useState(false);

  const list = cards.data || [];
  const small = list.filter((c) => c.balance > 0 && c.balance < THRESHOLD);
  const cardTotal = list.reduce((s, c) => s + c.balance, 0);
  const linkedTotal = (linked.data || []).reduce((s, a) => s + a.balance, 0);
  const total = (cash.data ?? 0) + cardTotal + linkedTotal;

  const sweep = async () => {
    setBusy(true);
    try {
      const { data } = await base44.functions.invoke("sweepSmallBalances", {});
      toast.success(`Swept ${data.swept} balances into $${data.credited.toFixed(2)} cash`);
    } catch (e) {
      toast.error(e?.response?.data?.error || "Sweep failed");
    }
    qc.invalidateQueries({ queryKey: ["cards"] });
    qc.invalidateQueries({ queryKey: ["balance"] });
    setBusy(false);
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 md:col-span-2">
      <div className="mb-1 flex items-center gap-2 font-heading text-lg font-semibold">
        <Layers className="h-5 w-5 text-primary" /> Harness balance
      </div>
      <div className="font-heading text-4xl font-bold text-primary">${total.toFixed(2)}</div>
      <div className="mt-1 text-sm text-muted-foreground">
        Cash ${(cash.data ?? 0).toFixed(2)} · Gift cards ${cardTotal.toFixed(2)} · Linked apps ${linkedTotal.toFixed(2)}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button disabled={busy || !small.length} onClick={sweep}>
          {busy && <Loader2 className="animate-spin" />} Sweep {small.length} small balance{small.length === 1 ? "" : "s"}
        </Button>
        <span className="text-sm text-muted-foreground">
          Converts gift card balances under ${THRESHOLD} into cash at the pool rate, minus the 1.5% pool fee.
        </span>
      </div>
    </div>
  );
}