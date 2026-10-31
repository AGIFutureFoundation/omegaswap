import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function TeamPipeline() {
  const qc = useQueryClient();
  const [task, setTask] = useState("Which of my cards should I swap or sweep this week?");
  const run = useMutation({
    mutationFn: async () => (await base44.functions.invoke("teamConsole", { action: "team", task })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teamRuns"] });
      qc.invalidateQueries({ queryKey: ["agentPayments"] });
    },
  });

  return (
    <div className="space-y-3 rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 font-heading text-lg font-semibold">
        <Users className="h-5 w-5 text-primary" /> Run the whole team
      </div>
      <p className="text-sm text-muted-foreground">Every agent works in order and hands its finding to the next, from discovery to an execution plan.</p>
      <Textarea rows={2} value={task} onChange={(e) => setTask(e.target.value)} />
      <Button disabled={!task || run.isPending} onClick={() => run.mutate()}>
        {run.isPending ? <Loader2 className="animate-spin" /> : <Users />} Run team
      </Button>
      {run.isError && <div className="text-sm text-destructive">Team run failed. Add agents first, then try again.</div>}
      {run.data?.steps.map((s, i) => (
        <div key={s.agent_id} className="border-b border-border pb-3 last:border-0">
          <div className="text-xs text-muted-foreground">{i + 1}. {s.agent_name}</div>
          <div className="mt-1 whitespace-pre-wrap text-sm">{s.output}</div>
        </div>
      ))}
    </div>
  );
}