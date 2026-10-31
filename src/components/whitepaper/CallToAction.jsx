import { Github, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GITHUB_URL, CONTACT_EMAIL, QR_URL } from "@/lib/links";

export default function CallToAction() {
  return (
    <section className="rounded-2xl border border-primary/30 bg-primary/5 p-8 sm:p-12">
      <div className="flex flex-col items-center gap-8 sm:flex-row">
        <div className="flex-1">
          <h2 className="font-heading text-3xl font-bold">Build the agent economy with us</h2>
          <p className="mt-2 text-muted-foreground">Scan the code or open the repository to read the source, run the agents, and contribute.</p>
          <Button asChild size="lg" className="mt-5">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer"><Github /> View on GitHub</a>
          </Button>
          <div className="mt-3 break-all text-xs text-muted-foreground">{GITHUB_URL}</div>
          <a href={`mailto:${CONTACT_EMAIL}`} className="mt-2 flex items-center gap-2 text-sm text-primary hover:underline">
            <Mail className="h-4 w-4" /> {CONTACT_EMAIL}
          </a>
        </div>
        <img src={QR_URL} alt="QR code linking to the GitHub repository" className="h-40 w-40 rounded-xl bg-white" />
      </div>
    </section>
  );
}