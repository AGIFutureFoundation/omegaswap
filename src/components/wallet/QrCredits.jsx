import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QrCode, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import VoucherRow from "@/components/wallet/VoucherRow";

const MAX_BYTES = 8 * 1024 * 1024;

export default function QrCredits({ uid }) {
  const qc = useQueryClient();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const vouchers = useQuery({
    queryKey: ["vouchers", uid],
    enabled: !!uid,
    queryFn: async () =>
      (await base44.entities.CreditVoucher.filter({ created_by_id: uid, status: "review" }, { sort: "-created_date", limit: 20 })).items,
  });

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > MAX_BYTES) {
      setError("Upload an image under 8 MB.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      await base44.functions.invoke("appraiseQr", { file_uri });
      await qc.invalidateQueries({ queryKey: ["vouchers"] });
    } catch (err) {
      setError(err?.response?.data?.error || "Could not read that voucher. Try a clearer photo.");
    }
    setBusy(false);
  };

  const list = vouchers.data || [];
  return (
    <div className="rounded-3xl border border-border bg-card p-6 space-y-3 md:col-span-2">
      <div className="flex items-center gap-2 font-heading text-lg font-semibold">
        <QrCode className="h-5 w-5 text-primary" /> Upload vendor QR credits
      </div>
      <p className="text-sm text-muted-foreground">
        Upload a photo or screenshot of a voucher QR (stored privately). The credit agent reads the brand and value,
        checks exchange listings for arbitrage, and recommends whether to spend, swap or hold it.
      </p>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={onFile} />
      <Button onClick={() => input.current?.click()} disabled={busy} className="w-full sm:w-auto">
        {busy ? <><Loader2 className="animate-spin" /> Agent is reading...</> : "Upload QR image"}
      </Button>
      {error && <div className="text-sm text-destructive">{error}</div>}
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((v) => <VoucherRow key={v.id} voucher={v} />)}
      </div>
      {!vouchers.isLoading && !list.length && !busy && (
        <div className="text-sm text-muted-foreground">No credits waiting for review.</div>
      )}
    </div>
  );
}