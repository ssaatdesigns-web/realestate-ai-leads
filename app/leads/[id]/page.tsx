import { supabaseAdmin } from "../../../lib/supabaseAdmin";

const STAGES = ["new", "contacted", "site_visit", "negotiation"] as const;

export default async function LeadDetail(props: any) {
  const id = props?.params?.id as string;

  const { data: lead, error } = await supabaseAdmin
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return <pre>{JSON.stringify(error, null, 2)}</pre>;

  return (
    <div>
      <h1>Lead Detail</h1>

      <div>Name: {lead.full_name}</div>
      <div>Phone: {lead.phone}</div>
      <div>Intent: {lead.intent_label}</div>
      <div>Score: {lead.intent_score}</div>

      <form action={`/api/leads/${id}/stage`} method="post" style={{ marginTop: 16 }}>
        <select name="to_stage" defaultValue={lead.stage}>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select name="outcome" defaultValue={lead.outcome}>
          <option value="open">open</option>
          <option value="won">won</option>
          <option value="lost">lost</option>
        </select>

        <input name="deal_value" placeholder="Deal value" />
        <button type="submit">Save</button>
      </form>
    </div>
  );
}
