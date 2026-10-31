import AgentForm from "@/components/console/AgentForm";
import RunConsole from "@/components/console/RunConsole";
import StarterTeam from "@/components/console/StarterTeam";
import PerformanceSummary from "@/components/console/PerformanceSummary";
import StrategyCompare from "@/components/console/StrategyCompare";
import ProfitChart from "@/components/agents/ProfitChart";
import { useWalletData } from "@/hooks/useWalletData";

export default function Console() {
  const { me } = useWalletData();
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <h1 className="font-heading text-3xl font-bold">Team console</h1>
      <PerformanceSummary uid={me.data?.id} />
      <StrategyCompare uid={me.data?.id} />
      <ProfitChart uid={me.data?.id} />
      <StarterTeam />
      <div className="grid gap-6 md:grid-cols-2">
        <AgentForm />
        <RunConsole />
      </div>
    </div>
  );
}