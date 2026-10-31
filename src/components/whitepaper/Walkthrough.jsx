import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SLIDES, SLIDE_SECONDS } from "@/lib/deckSlides";

const TOTAL = SLIDES.length * SLIDE_SECONDS;

export default function Walkthrough() {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setT((s) => Math.min(TOTAL, s + 0.1)), 100);
    return () => clearInterval(id);
  }, [playing]);

  useEffect(() => {
    if (t >= TOTAL) setPlaying(false);
  }, [t]);

  const idx = Math.min(SLIDES.length - 1, Math.floor(t / SLIDE_SECONDS));
  const slide = SLIDES[idx];
  const left = Math.ceil(TOTAL - t);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div key={idx} className="flex min-h-[260px] animate-in fade-in flex-col justify-center p-8 sm:p-12">
        <div className="text-xs uppercase tracking-widest text-primary">{slide.tag}</div>
        <h3 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">{slide.title}</h3>
        <p className="mt-3 max-w-2xl text-muted-foreground">{slide.text}</p>
      </div>
      <div className="h-1 bg-secondary"><div className="h-full bg-primary" style={{ width: `${(t / TOTAL) * 100}%` }} /></div>
      <div className="flex items-center gap-3 p-3">
        <Button size="sm" onClick={() => setPlaying((p) => !p)}>
          {playing ? <Pause /> : <Play />} {playing ? "Pause" : t > 0 && t < TOTAL ? "Resume" : "Play"}
        </Button>
        <Button size="icon" variant="ghost" aria-label="Restart" onClick={() => { setT(0); setPlaying(true); }}><RotateCcw /></Button>
        <div className="ml-auto text-xs text-muted-foreground">{left}s left of {TOTAL}s</div>
      </div>
    </div>
  );
}