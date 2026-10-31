import { Bot } from "lucide-react";

export default function DealFeed({ deals }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2 font-heading text-lg font-semibold">
        <Bot className="h-5 w-5 text-primary" /> Agent deal feed
      </div>
      <div className="divide-y divide-border">
        {deals.map((d) => (
          <div key={d.id} className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium">{d.title}</div>
              <div className="text-sm text-muted-foreground">{d.agent}</div>
            </div>
            <div className="font-heading text-lg font-bold text-primary">+{d.spread}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}