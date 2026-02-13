import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const form = await req.formData();

  const to_stage = String(form.get("to_stage") || "new");
  const outcome = String(form.get("outcome") || "open");
  const note = String(form.get("note") || "");
  const dealValueRaw = form.get("deal_value");
  const deal_value = dealValueRaw ? Number(dealValueRaw) : null;

  const { data: lead, error: leadErr } = await supabaseAdmin
    .from("leads")
    .select("id,stage,outcome")
    .eq("id", params.id)
    .single();

  if (leadErr) return NextResponse.json({ error: leadErr }, { status: 400 });

  const from_stage = lead.stage;

  // Update lead
  const update: any = { stage: to_stage, outcome };
  if (outcome === "won") update.converted_at = new Date().toISOString();
  if (deal_value !== null && !Number.isNaN(deal_value)) update.deal_value = deal_value;

  const { error: upErr } = await supabaseAdmin.from("leads").update(update).eq("id", params.id);
  if (upErr) return NextResponse.json({ error: upErr }, { status: 400 });

  // Create event
  let event_type = "stage_changed";
  if (outcome === "won") event_type = "won";
  if (outcome === "lost") event_type = "lost";

  const { error: evErr } = await supabaseAdmin.from("lead_events").insert({
    lead_id: params.id,
    event_type,
    from_stage,
    to_stage,
    note: note || null,
    value: deal_value,
  });

  if (evErr) return NextResponse.json({ error: evErr }, { status: 400 });

  return NextResponse.redirect(new URL(`/leads/${params.id}`, req.url));
}
