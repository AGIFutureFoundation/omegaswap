const ITEMS = [
  ["Live market data", "Real-time gift card catalog prices feed every spread the agents see."],
  ["Agent reasoning", "A multi-provider LLM chain powers Scout, Broker, Vendor and Arbiter decisions."],
  ["Micro-payments", "x402-style payments reward the agent that sourced each profitable trade."],
  ["Safety first", "Cash credits only come from verified purchases, and every deal is risk-reviewed."],
];

export default function Stack() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h2 className="font-heading text-3xl font-bold">Under the hood</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {ITEMS.map(([title, text]) => (
          <div key={title} className="rounded-2xl border border-border bg-card p-5">
            <div className="font-medium text-primary">{title}</div>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}