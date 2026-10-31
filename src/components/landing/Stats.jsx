const STATS = [
  ["1", "balance across every card"],
  ["9", "specialist AI agents"],
  ["8", "chains for agent payouts"],
  ["97%", "relist price vs face value"],
];

export default function Stats() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-6">
      <div className="grid grid-cols-2 gap-4 rounded-3xl border border-border bg-card p-6 text-center sm:grid-cols-4">
        {STATS.map(([value, label]) => (
          <div key={label}>
            <div className="font-heading text-3xl font-bold text-primary">{value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}