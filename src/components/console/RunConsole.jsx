import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Play, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function RunConsole() {
  const qc = useQueryClient();
  const [agentId, setAgentId] = useState("");
  const [task, setTask] = useState("");
  const agents = useQuery({
    queryKey: ["teamAgents"],
    queryFn: async () => (await base44.entities.TeamAgent.list("-created_date", 50)).items,
  });
  const runs = useQuery({
    queryKey: ["teamRuns"],
    queryFn: async () => (await base44.entities.TeamRun.list("-created_date", 10)).items,
  });
  const list = agents.data || [];
  const selected = agentId || list[0]?.id || "";

  const run = useMutation({
    mutationFn: () => base44.functions.invoke("teamConsole", { action: "run", agent_id: selected, task }),
    onSuccess: () => {
      setTask("");
      qc.invalidateQueries({ queryKey: ["teamRuns"] });
    },
  });
  const remove = useMutation({
    mutationFn: (id) => base44.entities.TeamAgent.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teamAgents"] }),
  });

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-3xl border border-border bg-card p-6">
        <div className="font-heading text-lg font-semibold">Console</div>
        {!list.length && <div className="text-sm text-muted-foreground">Create an agent to start.</div>}
        <div className="flex flex-wrap gap-2">
          {list.map((a) => (
            <div key={a.id} className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${selected === a.id ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
              <button onClick={() => setAgentId(a.id)}>{a.name} · {a.role}</button>
              <button onClick={() => remove.mutate(a.id)} aria-label="Delete agent"><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
        </div>
        <Textarea rows={3} placeholder="Give the agent a task, e.g. Which of my cards should I swap this week?" value={task} onChange={(e) => setTask(e.target.value)} />
        <Button disabled={!selected || !task || run.isPending} onClick={() => run.mutate()}>
          {run.isPending ? <Loader2 className="animate-spin" /> : <Play />} Run
        </Button>
        {run.isError && <div className="text-sm text-destructive">Run failed. Try again.</div>}
      </div>
      <div className="space-y-3 rounded-3xl border border-border bg-card p-6">
        <div className="font-heading text-lg font-semibold">Recent runs</div>
        {!(runs.data || []).length && <div className="text-sm text-muted-foreground">No runs yet.</div>}
        {(runs.data || []).map((r) => (
          <div key={r.id} className="border-b border-border pb-3 last:border-0">
            <div className="text-xs text-muted-foreground">{r.agent_name} · {r.task}</div>
            <div className="mt-1 whitespace-pre-wrap text-sm">{r.output}</div>
          </div>
        ))}
      </div>
    </div>
  );
}