import BalanceHero from "@/components/wallet/BalanceHero";
import DealFeed from "@/components/wallet/DealFeed";
import AddCardForm from "@/components/wallet/AddCardForm";
import SpendPanel from "@/components/wallet/SpendPanel";
import { useWalletData } from "@/hooks/useWalletData";
import { deals } from "@/lib/brands";

export default function Wallet() {
  const { cards } = useWalletData();
  const list = cards.data || [];
  const total = list.reduce((s, c) => s + c.balance, 0);
  const feed = deals().slice(0, 3).map((d) => ({ id: d.name, title: `${d.name}: buy low, pool high`, agent: "Scout agent", spread: d.spread.toFixed(1) }));

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <BalanceHero total={total} cardCount={list.length} saved={0} />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="mb-4 font-heading text-lg font-semibold">Your balances</div>
          {cards.isLoading && <div className="text-sm text-muted-foreground">Loading...</div>}
          {!cards.isLoading && !list.length && (
            <div className="text-sm text-muted-foreground">No balances yet. Add your first gift card balance.</div>
          )}
          {list.map((c) => (
            <div key={c.id} className="flex justify-between border-b border-border py-3 last:border-0">
              <span>{c.brand}{c.last4 ? <span className="ml-2 text-xs text-muted-foreground">•••• {c.last4}</span> : null}</span>
              <span className="font-heading font-bold">${c.balance.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <DealFeed deals={feed} />
        <AddCardForm />
        <SpendPanel cards={list.filter((c) => c.balance > 0)} />
      </div>
    </div>
  );
}