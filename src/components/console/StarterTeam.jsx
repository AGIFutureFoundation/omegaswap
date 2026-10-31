import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { STARTER_TEAM } from "@/lib/starterTeam";

export default function StarterTeam() {
  const qc = useQueryClient();
  const deploy = useMutation({
    mutationFn: async () => {
      const existing = (await base44.entities.TeamAgent.list("-created_date", 100)).items.map((a) => a.name);
      const missing = STARTER_TEAM.filter((a) => !existing.includes(a.name));
      if (missing.length) await base44.entities.TeamAgent.bulkCreate(missing);
      return missing.length;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teamAgents"] }),
  });

  return (
    <div className="space-y-3 rounded-3xl border border-border bg-card p-6">
      <div className="font-heading text-lg font-semibold">Starter team</div>
      <p className="text-sm text-muted-foreground">
        Six agents in two layers. Hermes (Scout, Courier, Sweeper) finds and routes deals. Omega (Strategist, Risk, Executor) decides and plans execution. Each run earns an x402 micro-payment.
      </p>
      <Button disabled={deploy.isPending} onClick={() => deploy.mutate()}>
        {deploy.isPending ? <Loader2 className="animate-spin" /> : <Users />} Deploy starter team
      </Button>
      {deploy.isSuccess && <div className="text-sm text-primary">{deploy.data ? `${deploy.data} agents added.` : "Team already deployed."}</div>}
    </div>
  );
}