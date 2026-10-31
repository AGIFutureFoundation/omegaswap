import AgentForm from "@/components/console/AgentForm";
import RunConsole from "@/components/console/RunConsole";
import StarterTeam from "@/components/console/StarterTeam";
import PerformanceSummary from "@/components/console/PerformanceSummary";
import StrategyCompare from "@/components/console/StrategyCompare";
import HeartbeatCard from "@/components/console/HeartbeatCard";
import TeamPipeline from "@/components/console/TeamPipeline";
import EvalPanel from "@/components/console/EvalPanel";
import ProfitChart from "@/components/agents/ProfitChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWalletData } from "@/hooks/useWalletData";

export default function Console() {
  const { me } = useWalletData();
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div>
        <h1 className="font-heading text-3xl font-bold">Team console</h1>
        <p className="text-sm text-muted-foreground">Build your agent team, run it end to end, test it with evals, and keep the Arbiter healthy with the heartbeat.</p>
      </div>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="evals">Evals</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6 space-y-6">
          <HeartbeatCard />
          <PerformanceSummary uid={me.data?.id} />
          <StrategyCompare uid={me.data?.id} />
          <ProfitChart uid={me.data?.id} />
        </TabsContent>
        <TabsContent value="team" className="mt-6 space-y-6">
          <StarterTeam />
          <TeamPipeline />
          <div className="grid gap-6 md:grid-cols-2">
            <AgentForm />
            <RunConsole />
          </div>
        </TabsContent>
        <TabsContent value="evals" className="mt-6">
          <EvalPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}