import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-4 pb-16 pt-20 text-center">
      <div className="mx-auto mb-5 inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
        Built for the agent-economy hackathon
      </div>
      <h1 className="font-heading text-4xl font-bold leading-tight sm:text-6xl">
        One balance for every gift card.<br />
        <span className="text-primary">Agents that trade it for profit.</span>
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
        OmegaSwap unifies your gift card balances into one wallet, finds underpriced deals with live market data,
        and lets AI agents arbitrage and pay each other with micro-payments.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg"><Link to="/wallet">Open the app <ArrowRight /></Link></Button>
        <Button asChild size="lg" variant="outline"><Link to="/whitepaper">Read the whitepaper</Link></Button>
      </div>
      <video
        className="mx-auto mt-10 w-full max-w-3xl rounded-3xl border border-border"
        src="https://media.base44.com/videos/public/6ae63a525fa5fffc7fc2ede8/d14aa4050_OmegaSwap_Video.mp4"
        autoPlay
        muted
        loop
        playsInline
        controls
        aria-label="OmegaSwap explainer video"
      />
    </section>
  );
}