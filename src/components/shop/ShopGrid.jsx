import { useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BRANDS, referralUrl } from "@/lib/brands";
import { useLiveRates } from "@/hooks/useLiveRates";
import BuyCardButton from "@/components/shop/BuyCardButton";

export default function ShopGrid() {
  const [q, setQ] = useState("");
  const rates = useLiveRates();
  const live = Object.fromEntries((rates.data?.rows || []).map((r) => [r.name, r]));
  const shown = BRANDS.filter((b) => b.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="mb-1 font-heading text-lg font-semibold">Shop gift cards</div>
      <p className="mb-4 text-sm text-muted-foreground">Pick a brand and buy in one tap. Prices update live when available.</p>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search brands" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((b) => {
          const cost = live[b.name]?.cost ?? b.cost;
          return (
            <div key={b.name} className="group rounded-2xl border border-border bg-secondary/40 p-4 transition-colors hover:border-primary">
              <div className="flex items-center justify-between">
                <span className="font-heading text-lg font-semibold">{b.name}</span>
                <a href={referralUrl(b.name)} target="_blank" rel="noreferrer" title="Open on Bitrefill">
                  <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                </a>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">You pay about {(cost * 100).toFixed(0)}c per $1</div>
              <div className="text-sm text-primary">Pool credits {(b.rate * 100).toFixed(0)}c per $1</div>
              <BuyCardButton brand={b.name} />
            </div>
          );
        })}
        {!shown.length && <div className="text-sm text-muted-foreground">No brands match.</div>}
      </div>
    </div>
  );
}