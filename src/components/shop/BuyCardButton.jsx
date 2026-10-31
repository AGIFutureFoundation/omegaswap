import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

const VALUES = [10, 25, 50, 100];

export default function BuyCardButton({ brand }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const buy = async (value) => {
    setBusy(value);
    setError("");
    try {
      const res = await base44.functions.invoke("bitrefillBuy", { brand, value });
      setResult(res.data);
      qc.invalidateQueries();
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setBusy(null);
    }
  };

  if (result) {
    return (
      <div className="mt-3 space-y-1 rounded-xl border border-primary/40 bg-primary/10 p-3 text-sm">
        <div className="font-medium">Bought {result.brand} ${result.value} for ${result.price.toFixed(2)}</div>
        {result.code && <div className="break-all font-mono">Code: {result.code}</div>}
        {result.pin && <div className="font-mono">PIN: {result.pin}</div>}
        {result.link && <a className="text-primary hover:underline" href={result.link} target="_blank" rel="noreferrer">Open redemption link</a>}
        <div className="text-xs text-muted-foreground">Save this code now. It is also added to your wallet.</div>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="grid grid-cols-4 gap-2">
        {VALUES.map((v) => (
          <Button key={v} variant="secondary" className="h-11 border border-primary/40 text-primary" disabled={busy !== null} onClick={() => buy(v)}>
            {busy === v ? <Loader2 className="animate-spin" /> : `$${v}`}
          </Button>
        ))}
      </div>
      <div className="text-center text-xs text-muted-foreground">Tap an amount to buy instantly from your wallet balance</div>
      {error && <div className="text-xs text-destructive">{error}</div>}
    </div>
  );
}