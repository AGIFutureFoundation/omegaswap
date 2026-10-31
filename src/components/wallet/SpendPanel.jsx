import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Splits a payment across the selected cards, largest balance first
function plan(cards, amount) {
  let left = amount;
  const parts = [];
  for (const c of [...cards].sort((a, b) => b.balance - a.balance)) {
    if (left <= 0) break;
    const take = Math.min(c.balance, left);
    parts.push({ card: c, take });
    left = +(left - take).toFixed(2);
  }
  return { parts, short: left };
}

export default function SpendPanel({ cards }) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [off, setOff] = useState([]);
  const usable = cards.filter((c) => c.balance > 0 && !off.includes(c.id));
  const total = usable.reduce((s, c) => s + c.balance, 0);
  const amt = Number(amount);
  const { parts, short } = amt > 0 ? plan(usable, amt) : { parts: [], short: 0 };

  const toggle = (id) => setOff((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));

  const spend = async (e) => {
    e.preventDefault();
    if (!(amt > 0) || short > 0) return toast.error("Amount exceeds the selected cards");
    await Promise.all(parts.map((p) => base44.entities.GiftCard.update(p.card.id, { balance: +(p.card.balance - p.take).toFixed(2) })));
    const split = parts.map((p) => `${p.card.brand} $${p.take.toFixed(2)}`).join(", ");
    await base44.entities.Trade.create({ kind: "spend", amount: amt, fee: 0, note: `${note}${note ? " | " : ""}Paid with ${split}` });
    await qc.invalidateQueries();
    setAmount("");
    setNote("");
    toast.success(`$${amt.toFixed(2)} paid using ${parts.length} card${parts.length === 1 ? "" : "s"}`);
  };

  return (
    <form onSubmit={spend} className="rounded-3xl border border-border bg-card p-6 space-y-3">
      <div className="font-heading text-lg font-semibold">Pay from wallet</div>
      <p className="text-sm text-muted-foreground">One payment, split across your gift cards. Untick any card you want to keep out.</p>
      <div className="flex flex-wrap gap-2">
        {cards.filter((c) => c.balance > 0).map((c) => (
          <label key={c.id} className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${off.includes(c.id) ? "border-border text-muted-foreground" : "border-primary text-primary"}`}>
            <input type="checkbox" className="hidden" checked={!off.includes(c.id)} onChange={() => toggle(c.id)} />
            {c.brand} ${c.balance.toFixed(2)}
          </label>
        ))}
      </div>
      <Input type="number" step="0.01" min="0" placeholder={`Amount (USD, up to $${total.toFixed(2)})`} value={amount} onChange={(e) => setAmount(e.target.value)} />
      <Input placeholder="What are you paying for?" value={note} onChange={(e) => setNote(e.target.value)} />
      {parts.length > 0 && (
        <div className="rounded-xl bg-muted p-3 text-sm">
          {parts.map((p) => (
            <div key={p.card.id} className="flex justify-between"><span>{p.card.brand}</span><span>${p.take.toFixed(2)}</span></div>
          ))}
          {short > 0 && <div className="mt-1 text-destructive">Short by ${short.toFixed(2)}</div>}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={!usable.length || short > 0 || !(amt > 0)}>Pay</Button>
    </form>
  );
}