import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function AgentForm() {
  const qc = useQueryClient();
  const [f, setF] = useState({ name: "", role: "", metaprompt: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const gen = useMutation({
    mutationFn: () => base44.functions.invoke("teamConsole", { action: "generate", role: f.role }),
    onSuccess: (r) => setF((p) => ({ ...p, metaprompt: r.data.metaprompt })),
  });
  const save = useMutation({
    mutationFn: () => base44.entities.TeamAgent.create(f),
    onSuccess: () => {
      setF({ name: "", role: "", metaprompt: "" });
      qc.invalidateQueries({ queryKey: ["teamAgents"] });
    },
  });

  return (
    <div className="space-y-3 rounded-3xl border border-border bg-card p-6">
      <div className="font-heading text-lg font-semibold">New team agent</div>
      <Input placeholder="Name (e.g. Atlas)" value={f.name} onChange={set("name")} />
      <Input placeholder="Role (e.g. Risk analyst for gift card spreads)" value={f.role} onChange={set("role")} />
      <Textarea rows={7} placeholder="Metaprompt: instructions that define this agent" value={f.metaprompt} onChange={set("metaprompt")} />
      <div className="flex gap-2">
        <Button variant="outline" disabled={!f.role || gen.isPending} onClick={() => gen.mutate()}>
          {gen.isPending ? <Loader2 className="animate-spin" /> : <Sparkles />} Generate metaprompt
        </Button>
        <Button disabled={!f.name || !f.role || !f.metaprompt || save.isPending} onClick={() => save.mutate()}>
          Save agent
        </Button>
      </div>
    </div>
  );
}