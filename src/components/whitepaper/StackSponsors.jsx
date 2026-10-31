import { STACK, SPONSORS } from "@/lib/stackInfo";

function Group({ title, items }) {
  return (
    <div>
      <h2 className="mb-3 font-heading text-2xl font-bold">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((i) => (
          <div key={i.name} className="rounded-2xl border border-border bg-card p-5">
            <div className="font-heading font-bold text-primary">{i.name}</div>
            <p className="mt-1 text-sm text-muted-foreground">{i.use}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StackSponsors() {
  return (
    <section className="space-y-8">
      <Group title="Tech stack" items={STACK} />
      <Group title="How we used the sponsor tools" items={SPONSORS} />
    </section>
  );
}