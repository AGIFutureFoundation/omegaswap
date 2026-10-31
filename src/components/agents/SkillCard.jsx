import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const SKILL_URL = "https://www.bitrefill.com/agents/SKILL.md";

export default function SkillCard() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(SKILL_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="mb-1 font-heading text-lg font-semibold">Bitrefill agent skill</div>
      <p className="mb-3 text-sm text-muted-foreground">
        Give this skill to your AI assistant (Claude, OpenClaw, Cursor) so it can search and buy Bitrefill gift cards, top-ups and eSIMs for you. It confirms each purchase with you first.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="rounded-md bg-muted px-3 py-2 text-xs">{SKILL_URL}</code>
        <Button size="sm" variant="secondary" onClick={copy}>
          {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
        </Button>
        <Button size="sm" variant="ghost" asChild>
          <a href={SKILL_URL} target="_blank" rel="noreferrer">Open <ExternalLink /></a>
        </Button>
      </div>
    </div>
  );
}