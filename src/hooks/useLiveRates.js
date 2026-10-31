import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BRANDS } from "@/lib/brands";

export function useLiveRates() {
  return useQuery({
    queryKey: ["bitrefill-rates"],
    queryFn: async () => {
      const { data } = await base44.functions.invoke("bitrefillRates", {});
      const live = Object.fromEntries((data.brands || []).map((b) => [b.name, b]));
      const rows = BRANDS.map((b) => {
        const l = live[b.name];
        return {
          name: b.name,
          rate: b.rate,
          cost: l ? l.cost : null,
          face: l ? l.face : null,
          inStock: l ? l.in_stock : false,
          spread: l ? ((b.rate - l.cost) / l.cost) * 100 : null,
        };
      });
      rows.sort((a, b) => (b.spread ?? -Infinity) - (a.spread ?? -Infinity));
      return { rows, fetchedAt: data.fetched_at };
    },
    refetchInterval: 60000,
  });
}