import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, Loader2 } from "lucide-react";

const THRESHOLD = 60;

export default function PullToRefresh({ children }) {
  const qc = useQueryClient();
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const startY = useRef(null);

  const onTouchStart = (e) => {
    if (window.scrollY <= 0 && !busy) startY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e) => {
    if (startY.current == null) return;
    const dy = e.touches[0].clientY - startY.current;
    setPull(dy > 0 && window.scrollY <= 0 ? Math.min(dy * 0.5, 80) : 0);
  };
  const onTouchEnd = async () => {
    if (startY.current == null) return;
    startY.current = null;
    if (pull >= THRESHOLD) {
      setBusy(true);
      setPull(44);
      await qc.invalidateQueries();
      setBusy(false);
    }
    setPull(0);
  };

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}>
      <div className="flex items-end justify-center overflow-hidden text-muted-foreground transition-[height] duration-150" style={{ height: pull }}>
        {pull > 0 && (busy ? <Loader2 className="mb-2 h-5 w-5 animate-spin" /> : <ArrowDown className={`mb-2 h-5 w-5 transition-transform ${pull >= THRESHOLD ? "rotate-180" : ""}`} />)}
      </div>
      {children}
    </div>
  );
}