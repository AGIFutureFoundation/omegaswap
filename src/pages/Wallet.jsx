import GettingStarted from "@/components/wallet/GettingStarted";
import MyDashboard from "@/components/wallet/MyDashboard";
import BalanceHero from "@/components/wallet/BalanceHero";
import DealFeed from "@/components/wallet/DealFeed";
import AddCardForm from "@/components/wallet/AddCardForm";
import SpendPanel from "@/components/wallet/SpendPanel";
import TopUpCard from "@/components/wallet/TopUpCard";
import HarnessCard from "@/components/wallet/HarnessCard";
import LinkedApps from "@/components/wallet/LinkedApps";
import { useWalletData } from "@/hooks/useWalletData";
import { deals } from "@/lib/brands";

export default function Wallet() {
  const { cards, me } = useWalletData();
  const list = cards.data || [];
  const total = list.reduce((s, c) => s + c.balance, 0);
  const feed = deals().slice(0, 3).map((d) => ({ id: d.name, title: `${d.name}: buy low, pool high`, agent: "Scout agent", spread: d.spread.toFixed(1) }));

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <MyDashboard uid={me.data?.id} name={me.data?.full_name?.split(" ")[0]} cards={list} cardsLoading={cards.isLoading} />
      <BalanceHero total={total} cardCount={list.length} saved={0} />
      {!cards.isLoading && <GettingStarted hasCards={list.length > 0} />}
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
        <AddCardForm />
        <SpendPanel cards={list.filter((c) => c.balance > 0)} />
        <TopUpCard />
        <DealFeed deals={feed} />
        <HarnessCard />
        <LinkedApps />
      </div>
    </div>
  );
}