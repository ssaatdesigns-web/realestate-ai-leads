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
      <h1 className="pageTitle">Leads</h1>
      <p className="pageSub">Latest 200 leads (newest first).</p>

      <div className="panel">
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Intent</th>
                <th>Score</th>
                <th>Stage</th>
                <th>Outcome</th>
                <th>Open</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((l: any) => (
                <tr key={l.id}>
                  <td>{l.full_name ?? "-"}</td>
                  <td>{l.phone ?? "-"}</td>
                  <td>{l.email ?? "-"}</td>
                  <td>
                    <span className={`pill ${intentPill(l.intent_label)}`}>
                      {l.intent_label ?? "-"}
                    </span>
                  </td>
                  <td>
                    <span className="pill pillBlue">{l.intent_score ?? 0}</span>
                  </td>
                  <td>
                    <span className="pill">{l.stage ?? "-"}</span>
                  </td>
                  <td>
                    <span className={`pill ${outcomePill(l.outcome)}`}>
                      {l.outcome ?? "-"}
                    </span>
                  </td>
                  <td>
                    <a className="link" href={`/leads/${l.id}`}>
                      View
                    </a>
                  </td>
                </tr>
              ))}
              {(data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 16, color: "rgba(255,255,255,.7)" }}>
                    No leads found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function intentPill(intent: string) {
  if (intent === "for_sure") return "pillGold";
  if (intent === "unsure") return "pillRed";
  return "pill";
}

function outcomePill(outcome: string) {
  if (outcome === "won") return "pillGreen";
  if (outcome === "lost") return "pillRed";
  return "pill";
}
