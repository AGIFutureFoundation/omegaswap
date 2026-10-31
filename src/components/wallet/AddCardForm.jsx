import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BRANDS } from "@/lib/brands";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AddCardForm() {
  const qc = useQueryClient();
  const [brand, setBrand] = useState(BRANDS[0].name);
  const [balance, setBalance] = useState("");
  const [last4, setLast4] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!(Number(balance) > 0)) return;
    setBusy(true);
    await base44.entities.GiftCard.create({ brand, balance: Number(balance), last4 });
    await qc.invalidateQueries({ queryKey: ["cards"] });
    setBalance("");
    setLast4("");
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="rounded-3xl border border-border bg-card p-6 space-y-3">
      <div className="font-heading text-lg font-semibold">Add a card balance</div>
      <select
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
      >
        {BRANDS.map((b) => (
          <option key={b.name}>{b.name}</option>
        ))}
      </select>
      <Input type="number" step="0.01" min="0" placeholder="Balance (USD)" value={balance} onChange={(e) => setBalance(e.target.value)} />
      <Input maxLength={4} placeholder="Last 4 of code (optional)" value={last4} onChange={(e) => setLast4(e.target.value)} />
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Adding..." : "Add to wallet"}
      </Button>
    </form>
  );
}