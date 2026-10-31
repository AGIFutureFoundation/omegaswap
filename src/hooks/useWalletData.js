import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function useWalletData() {
  const me = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });
  const uid = me.data?.id;
  const cards = useQuery({
    queryKey: ["cards", uid],
    enabled: !!uid,
    queryFn: async () =>
      (await base44.entities.GiftCard.filter({ created_by_id: uid }, { sort: "-created_date", limit: 200 })).items,
  });
  const trades = useQuery({
    queryKey: ["trades", uid],
    enabled: !!uid,
    queryFn: async () =>
      (await base44.entities.Trade.filter({ created_by_id: uid }, { sort: "-created_date", limit: 20 })).items,
  });
  const payments = useQuery({
    queryKey: ["agentPayments", uid],
    enabled: !!uid,
    queryFn: async () =>
      (await base44.entities.AgentPayment.filter({ created_by_id: uid }, { sort: "-created_date", limit: 20 })).items,
  });
  return { me, cards, trades, payments };
}