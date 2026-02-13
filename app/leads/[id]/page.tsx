import { supabaseAdmin } from "../../../lib/supabaseAdmin";

const STAGES = ["new", "contacted", "site_visit", "negotiation"] as const;

export default async function LeadDetail({ params }: { params: { id: string } }) {
  const { data: lead, error } = await supabaseAdmin
    .from("leads")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) return <pre>{JSON.stringify(error, null, 2)}</pre>;

  const { data: events } = await supabaseAdmin
    .from("lead_events")
    .select("*")
    .eq("lead_id", params.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Lead</h1>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <Box title="Name" value={lead.full_name ?? "-"} />
        <Box title="Phone" value={lead.phone ?? "-"} />
        <Box title="Intent" value={`${lead.intent_label} (${lead.intent_score})`} />
        <Box title="Stage" value={lead.stage} />
        <Box title="Outcome" value={lead.outcome} />
      </div>

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #eee", borderRadius: 10 }}>
        <h3 style={{ marginTop: 0 }}>Update Stage / Conversion</h3>

        <form action={`/api/leads/${params.id}/stage`} method="post" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select name="to_stage" defaultValue={lead.stage} style={selStyle}>
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select name="outcome" defaultValue={lead.outcome} style={selStyle}>
            <option value="open">open</option>
            <option value="won">won</option>
            <option value="lost">lost</option>
          </select>

          <input name="deal_value" placeholder="deal value (optional)" style={inpStyle} />
          <input name="note" placeholder="note (optional)" style={inpStyle} />

          <button type="submit" style={btnStyle}>Save</button>
        </form>
      </div>

      <div style={{ marginTop: 16 }}>
        <h3>Events (conversion tracking)</h3>
        <div style={{ border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr><Th>Time</Th><Th>Type</Th><Th>From</Th><Th>To</Th><Th>Value</Th><Th>Note</Th></tr>
            </thead>
            <tbody>
              {(events ?? []).map((e) => (
                <tr key={e.id} style={{ borderTop: "1px solid #f1f1f1" }}>
                  <Td>{new Date(e.created_at).toLocaleString()}</Td>
                  <Td>{e.event_type}</Td>
                  <Td>{e.from_stage ?? "-"}</Td>
                  <Td>{e.to_stage ?? "-"}</Td>
                  <Td>{e.value ?? "-"}</Td>
                  <Td>{e.note ?? "-"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Box({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 14 }}>
      <div style={{ fontSize: 12, color: "#555" }}>{title}</div>
      <div style={{ fontSize: 18, fontWeight: 650 }}>{value}</div>
    </div>
  );
}

const selStyle: React.CSSProperties = { padding: 8, borderRadius: 8, border: "1px solid #ddd" };
const btnStyle: React.CSSProperties = { padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer" };
const inpStyle: React.CSSProperties = { padding: 8, borderRadius: 8, border: "1px solid #ddd", minWidth: 220 };
function Th({ children }: { children: React.ReactNode }) { return <th style={{ textAlign: "left", padding: 10, fontSize: 12, color: "#555" }}>{children}</th>; }
function Td({ children }: { children: React.ReactNode }) { return <td style={{ padding: 10 }}>{children}</td>; }
