const GROUPS = [
  ["Catalog and supply", ["Bitrefill", "Reloadly", "Startup credit programs", "AI token providers"]],
  ["Supply roadmap", ["CryptoRefills", "Coinsbee", "Tango Card", "Blackhawk Network", "Raise", "CardCash"]],
  ["Agent intelligence", ["TrueFoundry", "ASI Cloud", "OpenAI"]],
  ["Payments and top-ups", ["NOWPayments", "x402 micro-payments", "Solana Pay"]],
  ["Agent payout chains", ["Solana", "Base", "Polygon", "Arbitrum", "Ethereum", "Optimism", "Avalanche", "BNB"]],
];

export default function Partners() {
  return (
    <section id="partners" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-12">
      <h2 className="font-heading text-3xl font-bold">Ecosystem and partners</h2>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        OmegaSwap plugs into the catalogs, AI infrastructure and payment rails that agents need to find, trade and settle deals.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {GROUPS.map(([title, names]) => (
          <div key={title} className="rounded-2xl border border-border bg-card p-5">
            <div className="text-sm font-medium text-primary">{title}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {names.map((n) => (
                <span key={n} className="rounded-full border border-border bg-secondary px-3 py-1 text-sm">{n}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}