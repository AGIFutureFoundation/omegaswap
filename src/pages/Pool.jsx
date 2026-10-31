import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useWalletData } from "@/hooks/useWalletData";
import { BRANDS, POOL_FEE, AGENT_FEE, rateOf } from "@/lib/brands";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Pool() {
  const qc = useQueryClient();
  const { cards, trades } = useWalletData();
  const list = (cards.data || []).filter((c) => c.balance > 0);
  const [fromId, setFromId] = useState("");
  const [toBrand, setToBrand] = useState(BRANDS[0].name);
  const [amount, setAmount] = useState("");

  const from = list.find((c) => c.id === fromId);
  const amt = Number(amount) || 0;
  const received = from ? amt * (rateOf(from.brand) / rateOf(toBrand)) * (1 - POOL_FEE) : 0;

  const swap = async (e) => {
    e.preventDefault();
    if (!from || amt <= 0 || amt > from.balance || from.brand === toBrand) return toast.error("Check the amount and brands");
    const fee = +(amt * POOL_FEE).toFixed(2);
    const target = (cards.data || []).find((c) => c.brand === toBrand);
    await base44.entities.GiftCard.update(from.id, { balance: +(from.balance - amt).toFixed(2) });
    if (target) await base44.entities.GiftCard.update(target.id, { balance: +(target.balance + received).toFixed(2) });
    else await base44.entities.GiftCard.create({ brand: toBrand, balance: +received.toFixed(2) });
    await base44.entities.Trade.create({ kind: "swap", from_brand: from.brand, to_brand: toBrand, amount: amt, fee, received: +received.toFixed(2) });
    await base44.entities.AgentPayment.create({ agent: "Router agent", protocol: "x402", amount: +(amt * AGENT_FEE).toFixed(4), memo: `Routed ${from.brand} to ${toBrand}` });
    await qc.invalidateQueries();
    setAmount("");
    toast.success(`Swapped to $${received.toFixed(2)} ${toBrand}`);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <h1 className="font-heading text-3xl font-bold">Liquidity pool</h1>
      <p className="text-muted-foreground">Swap one gift card balance into another. A {(POOL_FEE * 100).toFixed(1)}% pool fee applies.</p>
      <form onSubmit={swap} className="space-y-3 rounded-3xl border border-border bg-card p-6">
        <select value={fromId} onChange={(e) => setFromId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value="">Swap from...</option>
          {list.map((c) => <option key={c.id} value={c.id}>{c.brand} (${c.balance.toFixed(2)})</option>)}
        </select>
        <select value={toBrand} onChange={(e) => setToBrand(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          {BRANDS.map((b) => <option key={b.name}>{b.name}</option>)}
        </select>
        <Input type="number" step="0.01" min="0" placeholder="Amount (USD)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <div className="text-sm text-muted-foreground">You receive about <span className="font-bold text-primary">${received.toFixed(2)}</span> in {toBrand}</div>
        <Button type="submit" className="w-full" disabled={!from}>Swap</Button>
      </form>
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="mb-3 font-heading text-lg font-semibold">Recent trades</div>
        {!(trades.data || []).length && <div className="text-sm text-muted-foreground">No trades yet.</div>}
        {(trades.data || []).map((t) => (
          <div key={t.id} className="flex justify-between border-b border-border py-2 text-sm last:border-0">
            <span>{t.kind === "swap" ? `${t.from_brand} to ${t.to_brand}` : `Spent: ${t.note || "wallet payment"}`}</span>
            <span className="font-medium">${t.amount.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}