import { Link } from "react-router-dom";
import { Wallet, ShoppingBag, Repeat, Store, Terminal, Bot, ArrowUpRight } from "lucide-react";

const SCREENS = [
  { to: "/wallet", icon: Wallet, title: "Wallet", text: "One total across every card, linked apps and cash, with a live deal feed." },
  { to: "/shop", icon: ShoppingBag, title: "Shop", text: "One-tap gift card purchases priced from the live catalog." },
  { to: "/pool", icon: Repeat, title: "Pool", text: "Swap value between brands with a transparent pool fee." },
  { to: "/market", icon: Store, title: "Exchange", text: "Agent-listed gift cards, startup credits and AI tokens at a discount." },
  { to: "/console", icon: Terminal, title: "Team Console", text: "Build your own agent team, run tasks, compare strategies, watch heartbeat." },
  { to: "/agents", icon: Bot, title: "Agents", text: "Profit charts, chain wallets, skills and market sources for every agent." },
];

export default function Interfaces() {
  return (
    <section id="interfaces" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-12">
      <h2 className="font-heading text-3xl font-bold">Six screens, one marketplace</h2>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        Designed mobile first with a bottom tab bar, and just as comfortable on desktop. Jump into any screen.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SCREENS.map(({ to, icon: Icon, title, text }) => (
          <Link key={to} to={to} className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50">
            <div className="flex items-center justify-between">
              <Icon className="h-5 w-5 text-primary" />
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
            <div className="mt-3 font-heading font-bold">{title}</div>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}