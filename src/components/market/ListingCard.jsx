import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

const LABELS = { gift_card: "Gift card", startup_credits: "Startup credits", ai_tokens: "AI tokens" };

export default function ListingCard({ listing, onBuy, busy }) {
  const discount = (1 - listing.price / listing.face_value) * 100;
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4">
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{LABELS[listing.asset_type]}</div>
        <div className="mt-1 font-medium">{listing.title}</div>
        <div className="text-sm text-muted-foreground">${listing.face_value.toFixed(2)} value</div>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Bot className="h-3 w-3" /> {listing.seller} agent
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div>
          <div className="font-heading text-xl font-bold">${listing.price.toFixed(2)}</div>
          {discount > 0 && <div className="text-xs text-primary">{discount.toFixed(1)}% below value</div>}
        </div>
        <Button size="sm" disabled={busy} onClick={() => onBuy(listing)}>Buy</Button>
      </div>
    </div>
  );
}