import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const invoke = (payload) => base44.functions.invoke("chargebeeInvoice", payload).then((r) => r.data);

export default function Invoices() {
  const qc = useQueryClient();
  const [amount, setAmount] = useState("25");
  const list = useQuery({ queryKey: ["invoices"], queryFn: () => invoke({ action: "list" }) });
  const create = useMutation({
    mutationFn: () => invoke({ action: "create", amount: Number(amount) }),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      if (d.pay_url) window.open(d.pay_url, "_blank");
      else toast.success("Invoice created");
    },
    onError: (e) => toast.error(e?.response?.data?.error || "Could not create invoice"),
  });
  const invoices = list.data?.invoices || [];

  return (
    <div className="space-y-3 rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 font-heading text-lg font-semibold">
        <FileText className="h-5 w-5 text-primary" /> Invoices
      </div>
      <p className="text-sm text-muted-foreground">Create a Chargebee invoice with a hosted pay link. Paying an invoice does not add to your wallet balance yet.</p>
      <div className="flex gap-2">
        <Input type="number" min="5" max="1000" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-28" />
        <Button onClick={() => create.mutate()} disabled={create.isPending}>
          {create.isPending && <Loader2 className="animate-spin" />} Create invoice
        </Button>
      </div>
      {list.isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
      {list.isError && <div className="text-sm text-muted-foreground">Could not load invoices.</div>}
      <ul className="divide-y divide-border text-sm">
        {invoices.map((i) => (
          <li key={i.id} className="flex justify-between py-2">
            <span>{i.id}</span>
            <span className="text-muted-foreground">${i.total.toFixed(2)} · {i.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}