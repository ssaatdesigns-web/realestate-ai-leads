import { supabaseAdmin } from "../lib/supabaseAdmin";

export default async function Home() {
  const { data: leads, error } = await supabaseAdmin
    .from("leads")
    .select("id,intent_label,outcome")
    .limit(100000);

  if (error) return <pre>{JSON.stringify(error, null, 2)}</pre>;

  const total = leads?.length ?? 0;
  const forSure = (leads ?? []).filter(l => l.intent_label === "for_sure").length;
  const won = (leads ?? []).filter(l => l.outcome === "won").length;
  const open = (leads ?? []).filter(l => l.outcome === "open").length;

  const conversionRate = total ? (won / total) * 100 : 0;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Lead Intelligence Dashboard</h1>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <Card title="Total Leads" value={String(total)} />
        <Card title="For-Sure Leads" value={String(forSure)} />
        <Card title="Won (Converted)" value={String(won)} />
        <Card title="Open" value={String(open)} />
        <Card title="Conversion Rate" value={`${conversionRate.toFixed(1)}%`} />
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 14 }}>
      <div style={{ fontSize: 12, color: "#555" }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
