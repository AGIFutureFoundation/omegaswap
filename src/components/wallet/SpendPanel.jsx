import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SpendPanel({ cards }) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const total = cards.reduce((s, c) => s + c.balance, 0);

  const spend = async (e) => {
    e.preventDefault();
    let left = Number(amount);
    if (!(left > 0) || left > total) return toast.error("Amount exceeds your wallet total");
    const spent = left;
    for (const c of [...cards].sort((a, b) => b.balance - a.balance)) {
      if (left <= 0) break;
      const take = Math.min(c.balance, left);
      await base44.entities.GiftCard.update(c.id, { balance: +(c.balance - take).toFixed(2) });
      left -= take;
    }
    await base44.entities.Trade.create({ kind: "spend", amount: spent, fee: 0, note });
    await qc.invalidateQueries();
    setAmount("");
    setNote("");
    toast.success(`$${spent.toFixed(2)} deducted from your wallet`);
  };

  return (
    <form onSubmit={spend} className="rounded-3xl border border-border bg-card p-6 space-y-3">
      <div className="font-heading text-lg font-semibold">Pay from wallet</div>
      <p className="text-sm text-muted-foreground">Draws from your largest balances first. Records the spend in your wallet ledger.</p>
      <Input type="number" step="0.01" min="0" placeholder="Amount (USD)" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <Input placeholder="What are you paying for?" value={note} onChange={(e) => setNote(e.target.value)} />
      <Button type="submit" className="w-full" disabled={!cards.length}>Pay</Button>
    </form>
  );
}