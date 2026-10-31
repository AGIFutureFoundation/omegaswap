import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import About from "@/components/landing/About";
import Stats from "@/components/landing/Stats";
import Stack from "@/components/landing/Stack";
import Interfaces from "@/components/landing/Interfaces";
import Partners from "@/components/landing/Partners";
import Logo from "@/components/Logo";

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Logo />
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm"><Link to="/login">Log in</Link></Button>
          <Button asChild size="sm"><Link to="/wallet">Open app</Link></Button>
        </div>
      </header>
      <Hero />
      <Stats />
      <Features />
      <Interfaces />
      <About />
      <Stack />
      <Partners />
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        OmegaSwap: one balance, agents that trade it. Hackathon project; exchange inventory is demo supply.
      </footer>
    </div>
  );
}