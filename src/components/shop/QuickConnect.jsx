import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";

const APPS = [
  { name: "PayPal", url: "https://www.paypal.com/myaccount/money" },
  { name: "Cash App", url: "https://cash.app/" },
  { name: "Venmo", url: "https://venmo.com/" },
  { name: "Coinbase", url: "https://www.coinbase.com/" },
  { name: "Steam Wallet", url: "https://store.steampowered.com/steamaccount/addfunds" },
  { name: "Starbucks", url: "https://www.starbucks.com/account/card" },
  { name: "Amazon Balance", url: "https://www.amazon.com/gc/reload" },
  { name: "Apple Account", url: "https://support.apple.com/apple-account" },
];

export default function QuickConnect() {
  const qc = useQueryClient();
  const apps = useQuery({
    queryKey: ["linkedApps"],
    queryFn: async () => (await base44.entities.LinkedApp.list("-created_date", 100)).items ?? [],
  });
  const linked = new Set((apps.data || []).map((a) => a.name));

  const connect = async (a) => {
    await base44.entities.LinkedApp.create({ name: a.name, balance: 0, refill_url: a.url });
    qc.invalidateQueries({ queryKey: ["linkedApps"] });
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="mb-1 font-heading text-lg font-semibold">Connect your apps</div>
      <p className="mb-4 text-sm text-muted-foreground">
        One tap adds an app with its refill link to your wallet. Set its balance later under Linked apps on the Wallet page.
      </p>
      <div className="flex flex-wrap gap-2">
        {APPS.map((a) => {
          const done = linked.has(a.name);
          return (
            <button key={a.name} disabled={done || apps.isLoading} onClick={() => connect(a)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
                done ? "border-primary/40 bg-primary/10 text-primary" : "border-border hover:border-primary"
              }`}>
              {done ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {a.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}