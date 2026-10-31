import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function useBalance(uid) {
  return useQuery({
    queryKey: ["balance", uid],
    enabled: !!uid,
    queryFn: async () => {
      const res = await base44.entities.LedgerEntry.aggregate({ query: { user_id: uid }, sum: ["amount"] });
      return Number(res?.rows?.[0]?.sum_amount ?? 0);
    },
  });
}

export function useListings() {
  return useQuery({
    queryKey: ["listings"],
    queryFn: async () =>
      (await base44.entities.Listing.filter({ status: "open" }, { sort: "price", limit: 100 })).items,
  });
}