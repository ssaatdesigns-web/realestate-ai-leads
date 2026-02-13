import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const intent = searchParams.get("intent");
  const stage = searchParams.get("stage");
  const outcome = searchParams.get("outcome");

  let query = supabaseAdmin
    .from("leads")
    .select("*")
    .order("inserted_at", { ascending: false })
    .limit(200);

  if (intent) query = query.eq("intent_label", intent);
  if (stage) query = query.eq("stage", stage);
  if (outcome) query = query.eq("outcome", outcome);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({ data });
}


export async function POST(req: Request) {
  const body = await req.json();

  const {
    full_name,
    email,
    phone,
    intent_label = "unknown",
    intent_score = 0
  } = body;

  const { data, error } = await supabaseAdmin
    .from("leads")
    .insert({
      full_name,
      email,
      phone,
      intent_label,
      intent_score,
      stage: "new",
      outcome: "open"
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  // Create creation event
  await supabaseAdmin.from("lead_events").insert({
    lead_id: data.id,
    event_type: "created"
  });

  return NextResponse.json({ data });
}
