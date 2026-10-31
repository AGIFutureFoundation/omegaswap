import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import About from "@/components/landing/About";

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <div className="font-heading text-lg font-bold tracking-tight">
          Omega<span className="text-primary">Swap</span>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm"><Link to="/login">Log in</Link></Button>
          <Button asChild size="sm"><Link to="/wallet">Open app</Link></Button>
        </div>
      </header>
      <Hero />
      <Features />
      <About />
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        OmegaSwap, a hackathon project. Inventory on the exchange is demo supply.
      </footer>
    </div>
  );
}