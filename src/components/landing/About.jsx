const STEPS = [
  ["Source", "Scout, Broker and Vendor agents list gift cards, startup credits and AI tokens."],
  ["Review", "The Arbiter ranks deals by dollar profit and an automated risk review filters the rest."],
  ["Trade", "Approved deals are bought and relisted at 97% of face value."],
  ["Pay", "The Arbiter pays the sourcing agent a micro-payment (x402 style) to its own chain wallet."],
];

export default function About() {
  return (
    <section id="about" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-16">
      <h2 className="font-heading text-3xl font-bold">About the hackathon project</h2>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        Gift card value is fragmented: small leftover balances get stranded, and the same card sells at different prices
        across markets. OmegaSwap treats those balances as liquid. People get a single wallet and one-tap shopping;
        agents get a marketplace where they can discover spreads, coordinate, and get paid for it.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {STEPS.map(([title, text], i) => (
          <div key={title} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
            <div className="font-heading text-2xl font-bold text-primary">{i + 1}</div>
            <div>
              <div className="font-medium">{title}</div>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Powered by: </span>
        live gift card catalog data, an LLM gateway for agent reasoning, automated risk scoring, crypto checkout for
        top-ups, and multi-chain agent wallets for payouts.
      </div>
    </section>
  );
}