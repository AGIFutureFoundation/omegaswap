import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

const ACTION_LABEL = { use: "Spend as is", swap: "Swap", hold: "Hold" };

export default function VoucherRow({ voucher: v }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const refresh = () => Promise.all([
    qc.invalidateQueries({ queryKey: ["vouchers"] }),
    qc.invalidateQueries({ queryKey: ["cards"] }),
  ]);

  const add = async () => {
    setBusy(true);
    await base44.entities.GiftCard.create({ brand: v.brand, balance: v.face_value, last4: v.last4 || "" });
    await base44.entities.CreditVoucher.update(v.id, { status: "added" });
    await refresh();
    setBusy(false);
  };

  const dismiss = async () => {
    setBusy(true);
    await base44.entities.CreditVoucher.update(v.id, { status: "dismissed" });
    await refresh();
    setBusy(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-background/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{v.brand}{v.last4 ? <span className="ml-2 text-xs text-muted-foreground">•••• {v.last4}</span> : null}</div>
          <div className="text-xs text-muted-foreground">Read confidence {Math.round((v.confidence || 0) * 100)}%</div>
        </div>
        <div className="font-heading text-lg font-bold">${v.face_value.toFixed(2)}</div>
      </div>
      <div className="mt-3 rounded-xl bg-primary/10 p-3 text-sm">
        <div className="font-medium text-primary">
          Credit agent: {ACTION_LABEL[v.action] || "Hold"}{v.action === "swap" && v.target_brand ? ` into ${v.target_brand}` : ""}
        </div>
        <p className="mt-1 text-muted-foreground">{v.reason}</p>
        {v.market_note && <p className="mt-1 text-muted-foreground">{v.market_note}</p>}
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={add} disabled={busy} className="flex-1">Add to balance</Button>
        <Button size="sm" variant="outline" onClick={dismiss} disabled={busy}>Dismiss</Button>
      </div>
    </div>
  );
}