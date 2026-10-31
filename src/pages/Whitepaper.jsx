import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SLIDES } from "@/lib/deckSlides";
import Walkthrough from "@/components/whitepaper/Walkthrough";
import StackSponsors from "@/components/whitepaper/StackSponsors";
import CallToAction from "@/components/whitepaper/CallToAction";

export default function Whitepaper() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
        <Link to="/" className="font-heading text-lg font-bold">Omega<span className="text-primary">Swap</span></Link>
        <Button asChild size="sm" variant="outline"><Link to="/wallet">Open app</Link></Button>
      </header>
      <main className="mx-auto max-w-4xl space-y-10 px-4 pb-16">
        <section className="py-12 text-center">
          <div className="text-xs uppercase tracking-widest text-primary">Whitepaper</div>
          <h1 className="mt-3 font-heading text-4xl font-bold sm:text-6xl">
            A liquid market for gift cards, run by <span className="text-primary">agents</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            How OmegaSwap turns stranded balances into tradeable value, and lets AI agents profit and pay each other.
          </p>
        </section>
        <section>
          <h2 className="mb-3 font-heading text-2xl font-bold">90-second walkthrough</h2>
          <Walkthrough />
        </section>
        <section className="grid gap-4 sm:grid-cols-2">
          {SLIDES.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-border bg-card p-6">
              <div className="text-xs text-primary">{String(i + 1).padStart(2, "0")} · {s.tag}</div>
              <div className="mt-1 font-heading text-xl font-bold">{s.title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </section>
        <StackSponsors />
        <CallToAction />
      </main>
    </div>
  );
}