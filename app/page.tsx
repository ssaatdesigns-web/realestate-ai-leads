import { supabaseAdmin } from "../lib/supabaseAdmin";

export default async function Home() {
  const { data: leads, error } = await supabaseAdmin
    .from("leads")
    .select("id,intent_label,outcome")
    .limit(100000);

  if (error) return <pre>{JSON.stringify(error, null, 2)}</pre>;

  const total = leads?.length ?? 0;
  const forSure = (leads ?? []).filter((l: any) => l.intent_label === "for_sure").length;
  const won = (leads ?? []).filter((l: any) => l.outcome === "won").length;
  const open = (leads ?? []).filter((l: any) => l.outcome === "open").length;

  const conversionRate = total ? (won / total) * 100 : 0;

  return (
    <div>
      <h1 className="pageTitle">Lead Intelligence Dashboard</h1>
      <p className="pageSub">
        Track buyer intent, pipeline stage, and conversions for SAAT Designs.
      </p>

      <div className="grid">
        <Card title="Total Leads" value={String(total)} badge="All sources" />
        <Card title="For-Sure Leads" value={String(forSure)} badge="High intent" badgeVariant="gold" />
        <Card title="Won (Converted)" value={String(won)} badge="Closed" />
        <Card title="Open" value={String(open)} badge="In progress" />
        <Card title="Conversion Rate" value={`${conversionRate.toFixed(1)}%`} badge="Won / total" />
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  badge,
  badgeVariant,
}: {
  title: string;
  value: string;
  badge?: string;
  badgeVariant?: "gold";
}) {
  return (
    <div className="card">
      <div className="cardTop">
        <div className="cardTitle">{title}</div>
        {badge ? (
          <span className={`badge ${badgeVariant === "gold" ? "badgeGold" : ""}`}>
            {badge}
          </span>
        ) : null}
      </div>
      <div className="cardValue">{value}</div>
    </div>
  );
}
