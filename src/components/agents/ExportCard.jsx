import { useState } from "react";
import { Download } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

function toCsv(rows, cols) {
  const head = cols.map((c) => c.label).join(",");
  const body = rows.map((r) => cols.map((c) => esc(c.get(r))).join(","));
  return [head, ...body].join("\n");
}

function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

const tradeCols = [
  { label: "Date", get: (r) => r.created_date },
  { label: "Kind", get: (r) => r.kind },
  { label: "From", get: (r) => r.from_brand },
  { label: "To", get: (r) => r.to_brand },
  { label: "Amount USD", get: (r) => r.amount },
  { label: "Fee USD", get: (r) => r.fee },
  { label: "Received USD", get: (r) => r.received },
  { label: "Note", get: (r) => r.note },
];

const payCols = [
  { label: "Date", get: (r) => r.created_date },
  { label: "Agent", get: (r) => r.agent },
  { label: "Source agent", get: (r) => r.source_agent },
  { label: "Protocol", get: (r) => r.protocol },
  { label: "Amount USD", get: (r) => r.amount },
  { label: "Profit USD", get: (r) => r.profit },
  { label: "Spread %", get: (r) => r.spread_pct },
  { label: "Status", get: (r) => r.status },
  { label: "Tx signature", get: (r) => r.tx_signature },
  { label: "Memo", get: (r) => r.memo },
];

export default function ExportCard({ uid }) {
  const [busy, setBusy] = useState(false);

  const run = async (kind) => {
    setBusy(kind);
    const entity = kind === "trades" ? base44.entities.Trade : base44.entities.AgentPayment;
    const page = await entity.filter({ created_by_id: uid }, { sort: "-created_date", limit: 1000 });
    download(`${kind}.csv`, toCsv(page.items, kind === "trades" ? tradeCols : payCols));
    setBusy(false);
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="mb-1 font-heading text-lg font-semibold">Export for accounting</div>
      <p className="mb-4 text-sm text-muted-foreground">
        Download your full history as CSV (up to 1,000 rows each). Open it in Google Sheets, Excel or your accounting tool.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button disabled={!uid || !!busy} onClick={() => run("trades")}>
          <Download /> {busy === "trades" ? "Preparing..." : "Trades CSV"}
        </Button>
        <Button variant="secondary" disabled={!uid || !!busy} onClick={() => run("agent-payments")}>
          <Download /> {busy === "agent-payments" ? "Preparing..." : "Agent payments CSV"}
        </Button>
      </div>
    </div>
  );
}