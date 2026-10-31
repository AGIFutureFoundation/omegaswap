import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bot, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import OptionSelect from "@/components/ui/option-select";
import { useWalletData } from "@/hooks/useWalletData";
import { useBalance, useListings } from "@/hooks/useMarket";
import ListingCard from "@/components/market/ListingCard";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "gift_card", label: "Gift cards" },
  { key: "startup_credits", label: "Startup credits" },
  { key: "ai_tokens", label: "AI tokens" },
];

export default function Market() {
  const qc = useQueryClient();
  const { me } = useWalletData();
  const balance = useBalance(me.data?.id);
  const listings = useListings();
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [sort, setSort] = useState("profit");

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["listings"] });
    qc.invalidateQueries({ queryKey: ["balance"] });
    qc.invalidateQueries({ queryKey: ["cards"] });
    qc.invalidateQueries({ queryKey: ["agentPayments"] });
  };

  const buy = async (l) => {
    setBusy(true);
    try {
      await base44.functions.invoke("marketBuy", { listing_id: l.id });
      toast.success(`Bought ${l.title}. It's in your wallet.`);
    } catch (e) {
      toast.error(e?.response?.data?.error || "Purchase failed");
    }
    refresh();
    setBusy(false);
  };

  const runAgents = async () => {
    setBusy(true);
    try {
      const { data } = await base44.functions.invoke("runAgents", {});
      toast.success(`Agents listed ${data.listed}, traded ${data.bought} (agent profit $${data.profit.toFixed(2)})`);
    } catch (e) {
      toast.error(e?.response?.data?.error || "Agent round failed");
    }
    refresh();
    setBusy(false);
  };

  const save = (l) => l.face_value - l.price;
  const shown = (listings.data || [])
    .filter((l) => filter === "all" || l.asset_type === filter)
    .sort(sort === "profit" ? (a, b) => save(b) - save(a) : (a, b) => a.price - b.price);
  const bestSave = shown.length ? Math.max(...shown.map(save)) : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Agent exchange</h1>
          <p className="text-sm text-muted-foreground">
            Agents list and trade gift cards, startup credits and AI tokens with each other. Inventory shown here is demo supply.
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Your cash balance</div>
          <div className="font-heading text-2xl font-bold text-primary">${(balance.data ?? 0).toFixed(2)}</div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Button key={f.key} size="sm" variant={filter === f.key ? "default" : "secondary"} onClick={() => setFilter(f.key)}>
            {f.label}
          </Button>
        ))}
        <OptionSelect
          label="Sort listings"
          className="w-auto text-xs md:h-8"
          value={sort}
          onChange={setSort}
          options={[{ value: "profit", label: "Biggest savings first" }, { value: "price", label: "Lowest price first" }]}
        />
        <Button size="sm" variant="outline" className="ml-auto" disabled={busy} onClick={runAgents}>
          {busy ? <Loader2 className="animate-spin" /> : <Bot />} Run agent round
        </Button>
      </div>
      {bestSave > 0 && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 text-sm">
          Best deal here saves <span className="font-semibold text-primary">${bestSave.toFixed(2)}</span> against face value. The Arbiter agent buys these and relists at 97%, paying the sourcing agent a micro fee on each trade.
        </div>
      )}
      {listings.isLoading && <div className="text-sm text-muted-foreground">Loading listings...</div>}
      {!listings.isLoading && !shown.length && (
        <div className="text-sm text-muted-foreground">No listings yet. Run an agent round to stock the exchange.</div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((l) => <ListingCard key={l.id} listing={l} onBuy={buy} busy={busy} />)}
      </div>
    </div>
  );
}