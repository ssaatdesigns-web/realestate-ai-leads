import { supabaseAdmin } from "../../lib/supabaseAdmin";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { intent?: string; outcome?: string; stage?: string };
}) {
  let q = supabaseAdmin
    .from("leads")
    .select("id,full_name,phone,email,intent_label,intent_score,stage,outcome,created_time,inserted_at")
    .order("inserted_at", { ascending: false })
    .limit(200);

  if (searchParams.intent) q = q.eq("intent_label", searchParams.intent);
  if (searchParams.outcome) q = q.eq("outcome", searchParams.outcome);
  if (searchParams.stage) q = q.eq("stage", searchParams.stage);

  const { data, error } = await q;

  if (error) return <pre>{JSON.stringify(error, null, 2)}</pre>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Leads</h1>

      <Filters />

      <div style={{ overflowX: "auto", border: "1px solid #eee", borderRadius: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>Name</Th><Th>Phone</Th><Th>Intent</Th><Th>Score</Th><Th>Stage</Th><Th>Outcome</Th><Th>Open</Th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((l) => (
              <tr key={l.id} style={{ borderTop: "1px solid #f1f1f1" }}>
                <Td>{l.full_name ?? "-"}</Td>
                <Td>{l.phone ?? "-"}</Td>
                <Td>{l.intent_label}</Td>
                <Td>{l.intent_score}</Td>
                <Td>{l.stage}</Td>
                <Td>{l.outcome}</Td>
                <Td><a href={`/leads/${l.id}`}>View</a></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ color: "#666" }}>Showing latest 200 leads.</p>
    </div>
  );
}

function Filters() {
  return (
    <form style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
      <select name="intent" defaultValue="" style={selStyle}>
        <option value="">All intent</option>
        <option value="for_sure">for_sure</option>
        <option value="unsure">unsure</option>
        <option value="unknown">unknown</option>
      </select>
      <select name="outcome" defaultValue="" style={selStyle}>
        <option value="">All outcomes</option>
        <option value="open">open</option>
        <option value="won">won</option>
        <option value="lost">lost</option>
      </select>
      <select name="stage" defaultValue="" style={selStyle}>
        <option value="">All stages</option>
        <option value="new">new</option>
        <option value="contacted">contacted</option>
        <option value="site_visit">site_visit</option>
        <option value="negotiation">negotiation</option>
      </select>
      <button type="submit" style={btnStyle}>Apply</button>
    </form>
  );
}

const selStyle: React.CSSProperties = { padding: 8, borderRadius: 8, border: "1px solid #ddd" };
const btnStyle: React.CSSProperties = { padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer" };
function Th({ children }: { children: React.ReactNode }) { return <th style={{ textAlign: "left", padding: 10, fontSize: 12, color: "#555" }}>{children}</th>; }
function Td({ children }: { children: React.ReactNode }) { return <td style={{ padding: 10 }}>{children}</td>; }
