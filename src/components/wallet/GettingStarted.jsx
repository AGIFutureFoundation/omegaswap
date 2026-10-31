import { Link } from "react-router-dom";
import { Check, Circle } from "lucide-react";

export default function GettingStarted({ hasCards }) {
  const steps = [
    { done: hasCards, label: "Add your first gift card balance", hint: "Use the Add card form below" },
    { done: false, label: "Browse live deals in the Shop", to: "/shop", hint: "Real Bitrefill prices, bought from your wallet" },
    { done: false, label: "Swap balances in the Pool", to: "/pool", hint: "Turn unused brands into ones you spend" },
  ];
  if (hasCards) return null;
  return (
    <div className="rounded-3xl border border-primary/30 bg-primary/5 p-6">
      <div className="font-heading text-lg font-semibold">Get started in 3 steps</div>
      <div className="mt-3 space-y-3">
        {steps.map((s) => (
          <div key={s.label} className="flex items-start gap-3 text-sm">
            {s.done ? <Check className="mt-0.5 h-4 w-4 text-primary" /> : <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" />}
            <div>
              {s.to ? <Link to={s.to} className="font-medium text-primary hover:underline">{s.label}</Link> : <span className="font-medium">{s.label}</span>}
              <div className="text-xs text-muted-foreground">{s.hint}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}