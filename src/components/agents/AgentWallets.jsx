import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CHAINS = ["solana", "base", "polygon", "arbitrum", "ethereum"];
const AGENTS = ["Arbiter", "Scout", "Broker", "Vendor", "Hermes Scout", "Hermes Courier", "Hermes Sweeper", "Omega Strategist", "Omega Risk", "Omega Executor"];
const selectCls = "h-9 rounded-md border border-input bg-card px-2 text-sm";

export default function AgentWallets() {
  const qc = useQueryClient();
  const [agent, setAgent] = useState("Scout");
  const [chain, setChain] = useState("solana");
  const [address, setAddress] = useState("");
  const wallets = useQuery({
    queryKey: ["agentWallets"],
    queryFn: async () => (await base44.entities.AgentWallet.list("-created_date", 100)).items,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["agentWallets"] });
  const add = useMutation({
    mutationFn: () => base44.entities.AgentWallet.create({ agent, chain, address: address.trim() }),
    onSuccess: () => { setAddress(""); refresh(); },
  });
  const remove = useMutation({ mutationFn: (id) => base44.entities.AgentWallet.delete(id), onSuccess: refresh });

  return (
    <div className="space-y-3 rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 font-heading text-lg font-semibold">
        <Link2 className="h-5 w-5 text-primary" /> Agent wallets by chain
      </div>
      <p className="text-sm text-muted-foreground">
        Give each agent its own payout wallet on Solana, Base, Polygon, Arbitrum or Ethereum. x402 payments are routed to that wallet and labeled with the chain. Only Solana settles on-chain right now; the other chains are recorded as ledger entries.
      </p>
      <div className="flex flex-wrap gap-2">
        <select className={selectCls} value={agent} onChange={(e) => setAgent(e.target.value)}>
          {AGENTS.map((a) => <option key={a}>{a}</option>)}
        </select>
        <select className={selectCls} value={chain} onChange={(e) => setChain(e.target.value)}>
          {CHAINS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <Input className="min-w-[200px] flex-1" placeholder="Payout address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <Button disabled={address.trim().length < 20 || add.isPending} onClick={() => add.mutate()}>Save wallet</Button>
      </div>
      {(wallets.data || []).map((w) => (
        <div key={w.id} className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm last:border-0">
          <span className="font-medium">{w.agent}</span>
          <span className="rounded-full border border-border px-2 text-xs">{w.chain}</span>
          <span className="min-w-0 flex-1 truncate text-muted-foreground">{w.address}</span>
          <button onClick={() => remove.mutate(w.id)} aria-label="Remove wallet"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      {!(wallets.data || []).length && <div className="text-sm text-muted-foreground">No wallets yet. Agents without one use the default Solana treasury.</div>}
    </div>
  );
}