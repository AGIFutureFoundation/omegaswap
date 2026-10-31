import { Wallet, ArrowUpRight } from "lucide-react";

export default function BalanceHero({ total, cardCount, saved }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 md:p-10">
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="relative flex items-center gap-2 text-sm text-muted-foreground">
        <Wallet className="h-4 w-4" /> Unified wallet
      </div>
      <div className="relative mt-3 font-heading text-5xl font-bold tracking-tight md:text-7xl">
        ${total.toFixed(2)}
      </div>
      <p className="relative mt-2 text-muted-foreground">
        Spendable across {cardCount} gift card balances. Pay anywhere from one pool.
      </p>
      <div className="relative mt-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
        <ArrowUpRight className="h-4 w-4" /> ${saved.toFixed(2)} saved by agent deals
      </div>
    </div>
  );
}