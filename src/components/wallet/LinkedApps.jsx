import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Link2, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PRESETS = [
  { name: "Bitrefill", refill_url: "https://www.bitrefill.com/" },
  { name: "Reloadly", refill_url: "https://www.reloadly.com/" },
  { name: "Coinbase", refill_url: "https://www.coinbase.com/" },
  { name: "PayPal", refill_url: "https://www.paypal.com/" },
  { name: "Cash App", refill_url: "https://cash.app/" },
  { name: "Steam", refill_url: "https://store.steampowered.com/steamaccount/addfunds" },
  { name: "Amazon", refill_url: "https://www.amazon.com/gc" },
  { name: "OpenAI credits", refill_url: "https://platform.openai.com/settings/organization/billing" },
];

export default function LinkedApps() {
  const qc = useQueryClient();
  const apps = useQuery({
    queryKey: ["linkedApps"],
    queryFn: async () => (await base44.entities.LinkedApp.list("-created_date", 100)).items ?? [],
  });
  const [form, setForm] = useState({ name: "", balance: "", refill_url: "" });
  const refresh = () => qc.invalidateQueries({ queryKey: ["linkedApps"] });

  const add = async (e) => {
    e.preventDefault();
    await base44.entities.LinkedApp.create({
      name: form.name.trim(),
      balance: Number(form.balance),
      refill_url: form.refill_url.trim() || undefined,
    });
    setForm({ name: "", balance: "", refill_url: "" });
    refresh();
  };
  const remove = async (id) => {
    await base44.entities.LinkedApp.delete(id);
    refresh();
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 md:col-span-2">
      <div className="mb-1 flex items-center gap-2 font-heading text-lg font-semibold">
        <Link2 className="h-5 w-5 text-primary" /> Linked apps and refills
      </div>
      <p className="mb-3 text-sm text-muted-foreground">
        Track balances held in other apps and keep their refill links here. These are entered by you and count toward your harness balance; they can't be moved automatically.
      </p>
      {(apps.data || []).map((a) => (
        <div key={a.id} className="flex items-center justify-between border-b border-border py-2 last:border-0">
          <span>{a.name}</span>
          <span className="flex items-center gap-3">
            <span className="font-heading font-bold">${a.balance.toFixed(2)}</span>
            {a.refill_url && (
              <a href={a.refill_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
                Refill <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <button onClick={() => remove(a.id)} aria-label="Remove" className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          </span>
        </div>
      ))}
      <div className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Button key={p.name} type="button" size="sm" variant="secondary" onClick={() => setForm({ ...form, name: p.name, refill_url: p.refill_url })}>
            + {p.name}
          </Button>
        ))}
      </div>
      <form onSubmit={add} className="mt-4 grid gap-2 sm:grid-cols-[1fr_120px_1fr_auto]">
        <Input required placeholder="App name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input required type="number" min="0" step="0.01" placeholder="Balance" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} />
        <Input type="url" placeholder="Refill link (optional)" value={form.refill_url} onChange={(e) => setForm({ ...form, refill_url: e.target.value })} />
        <Button type="submit">Add</Button>
      </form>
    </div>
  );
}