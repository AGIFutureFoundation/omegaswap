import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlaskConical, Loader2, Wand2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function EvalPanel() {
  const qc = useQueryClient();
  const [agentId, setAgentId] = useState("");
  const agents = useQuery({
    queryKey: ["teamAgents"],
    queryFn: async () => (await base44.entities.TeamAgent.list("-created_date", 50)).items,
  });
  const list = agents.data || [];
  const selected = agentId || list[0]?.id || "";

  const evaluate = useMutation({
    mutationFn: async () => (await base44.functions.invoke("teamConsole", { action: "eval", agent_id: selected })).data,
  });
  const apply = useMutation({
    mutationFn: () => base44.entities.TeamAgent.update(selected, { metaprompt: evaluate.data.improved_metaprompt }),
    onSuccess: () => {
      evaluate.reset();
      qc.invalidateQueries({ queryKey: ["teamAgents"] });
    },
  });

  const r = evaluate.data;
  return (
    <div className="space-y-3 rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 font-heading text-lg font-semibold">
        <FlaskConical className="h-5 w-5 text-primary" /> Evals
      </div>
      <p className="text-sm text-muted-foreground">Test an agent on 3 fixed scenarios, get it scored, and apply an improved metaprompt.</p>
      {!list.length && <div className="text-sm text-muted-foreground">Add an agent first.</div>}
      <div className="flex flex-wrap gap-2">
        {list.map((a) => (
          <button key={a.id} onClick={() => { setAgentId(a.id); evaluate.reset(); }} className={`rounded-full border px-3 py-1 text-sm ${selected === a.id ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
            {a.name}
          </button>
        ))}
      </div>
      <Button disabled={!selected || evaluate.isPending} onClick={() => evaluate.mutate()}>
        {evaluate.isPending ? <Loader2 className="animate-spin" /> : <FlaskConical />} Run eval
      </Button>
      {evaluate.isError && <div className="text-sm text-destructive">Eval failed. Try again.</div>}
      {r && (
        <div className="space-y-3">
          <div className="font-heading text-2xl font-bold text-primary">{r.overall}/10</div>
          {r.scores.map((s) => (
            <div key={s.scenario} className="text-sm">
              <span className="font-medium">{s.score}/10</span> · {r.scenarios[s.scenario - 1]}
              <div className="text-xs text-muted-foreground">{s.issue}</div>
            </div>
          ))}
          {r.improved_metaprompt && (
            <div className="space-y-2 rounded-2xl border border-border p-3">
              <div className="whitespace-pre-wrap text-xs text-muted-foreground">{r.improved_metaprompt}</div>
              <Button size="sm" disabled={apply.isPending} onClick={() => apply.mutate()}>
                <Wand2 /> Apply improved metaprompt
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}