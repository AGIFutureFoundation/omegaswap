import { Wallet, ShoppingBag, Bot, ShieldCheck } from "lucide-react";

const FEATURES = [
  { icon: Wallet, title: "Unified wallet", text: "Add cards from any brand and see one total. Swap value between brands through the pool." },
  { icon: ShoppingBag, title: "Live shop", text: "Buy gift cards in one tap with real-time catalog pricing and your cash balance." },
  { icon: Bot, title: "Arbitrage agents", text: "Scout, Broker, Vendor and Arbiter agents source deals, buy low, and relist near face value." },
  { icon: ShieldCheck, title: "Risk-reviewed", text: "Every deal passes an automated risk review, and the Arbiter self-corrects its price limits." },
];

export default function Features() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-2xl border border-border bg-card p-5">
            <Icon className="h-5 w-5 text-primary" />
            <div className="mt-3 font-heading font-bold">{title}</div>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}