import { supabaseAdmin } from "../../lib/supabaseAdmin";

export default async function LeadsPage(props: any) {
  const searchParams = props?.searchParams || {};

  let q = supabaseAdmin
    .from("leads")
    .select("id,full_name,phone,email,intent_label,intent_score,stage,outcome,inserted_at")
    .order("inserted_at", { ascending: false })
    .limit(200);

  if (searchParams.intent) q = q.eq("intent_label", searchParams.intent);
  if (searchParams.stage) q = q.eq("stage", searchParams.stage);
  if (searchParams.outcome) q = q.eq("outcome", searchParams.outcome);

  const { data, error } = await q;

  if (error) return <pre>{JSON.stringify(error, null, 2)}</pre>;

  return (
    <div>
      <h1>Leads</h1>

      <div style={{ overflowX: "auto", border: "1px solid #eee", borderRadius: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Phone</Th>
              <Th>Intent</Th>
              <Th>Score</Th>
              <Th>Stage</Th>
              <Th>Outcome</Th>
              <Th>Open</Th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((l: any) => (
              <tr key={l.id} style={{ borderTop: "1px solid #f1f1f1" }}>
                <Td>{l.full_name ?? "-"}</Td>
                <Td>{l.phone ?? "-"}</Td>
                <Td>{l.intent_label}</Td>
                <Td>{l.intent_score}</Td>
                <Td>{l.stage}</Td>
                <Td>{l.outcome}</Td>
                <Td>
                  <a href={`/leads/${l.id}`}>View</a>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ textAlign: "left", padding: 10 }}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: 10 }}>{children}</td>;
}
