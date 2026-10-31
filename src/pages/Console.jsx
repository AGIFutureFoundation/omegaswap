import AgentForm from "@/components/console/AgentForm";
import RunConsole from "@/components/console/RunConsole";

export default function Console() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <h1 className="font-heading text-3xl font-bold">Team console</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <AgentForm />
        <RunConsole />
      </div>
    </div>
  );
}