import AgentForm from "@/components/console/AgentForm";
import RunConsole from "@/components/console/RunConsole";
import StarterTeam from "@/components/console/StarterTeam";
import PerformanceSummary from "@/components/console/PerformanceSummary";
import StrategyCompare from "@/components/console/StrategyCompare";
import HeartbeatCard from "@/components/console/HeartbeatCard";
import TeamPipeline from "@/components/console/TeamPipeline";
import AgentNetwork from "@/components/console/AgentNetwork";
import EvalPanel from "@/components/console/EvalPanel";
import ProfitChart from "@/components/agents/ProfitChart";
import BalanceBreakdown from "@/components/wallet/BalanceBreakdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWalletData } from "@/hooks/useWalletData";

export default function Console() {
  const { me, cards } = useWalletData();
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div>
        <h1 className="font-heading text-3xl font-bold">Team console</h1>
        <p className="text-sm text-muted-foreground">Your balances, your agent team, and how your trades have performed.</p>
      </div>
      <Tabs defaultValue="wallet">
        <TabsList className="grid w-full grid-cols-3 sm:inline-flex sm:w-auto">
          <TabsTrigger value="wallet">Wallet balances</TabsTrigger>
          <TabsTrigger value="agents">Active agents</TabsTrigger>
          <TabsTrigger value="performance">Trade performance</TabsTrigger>
        </TabsList>
        <TabsContent value="wallet" className="mt-6">
          <BalanceBreakdown cards={cards.data || []} loading={cards.isLoading} />
        </TabsContent>
        <TabsContent value="agents" className="mt-6 space-y-6">
          <HeartbeatCard />
          <StarterTeam />
          <TeamPipeline />
          <div className="grid gap-6 md:grid-cols-2">
            <AgentForm />
            <RunConsole />
          </div>
          <AgentNetwork />
          <EvalPanel />
        </TabsContent>
        <TabsContent value="performance" className="mt-6 space-y-6">
          <PerformanceSummary uid={me.data?.id} />
          <ProfitChart uid={me.data?.id} />
          <StrategyCompare uid={me.data?.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}