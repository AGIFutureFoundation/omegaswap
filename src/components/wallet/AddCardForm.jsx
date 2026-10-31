import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BRANDS } from "@/lib/brands";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OptionSelect from "@/components/ui/option-select";

export default function AddCardForm() {
  const qc = useQueryClient();
  const [brand, setBrand] = useState(BRANDS[0].name);
  const [balance, setBalance] = useState("");
  const [last4, setLast4] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const n = Number(balance);
    if (!(n >= 0.01 && n <= 2000)) {
      setError("Enter a balance between $0.01 and $2,000.");
      return;
    }
    if (last4 && !/^[A-Za-z0-9]{1,4}$/.test(last4)) {
      setError("Last 4 must be letters or numbers only.");
      return;
    }
    setError("");
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
      <OptionSelect label="Brand" value={brand} onChange={setBrand} options={BRANDS.map((b) => ({ value: b.name, label: b.name }))} />
      <Input type="number" step="0.01" min="0" placeholder="Balance (USD)" value={balance} onChange={(e) => setBalance(e.target.value)} />
      <Input maxLength={4} placeholder="Last 4 of code (optional)" value={last4} onChange={(e) => setLast4(e.target.value)} />
      {error && <div className="text-sm text-destructive">{error}</div>}
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Adding..." : "Add to wallet"}
      </Button>
    </form>
  );
}