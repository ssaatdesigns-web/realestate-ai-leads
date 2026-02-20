// app/api/leads/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

type InterestLevel = "extremely_sure" | "highly_interested" | "interested";
type Intent = "buy" | "rent";
type Bhk = "studio" | "1bhk" | "2bhk" | "3bhk" | "4bhk" | "4+bhk" | "other";

type LeadFormPayload = {
  name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  pincode: string;
  intent: Intent;
  bhk: Bhk;
  interest_level: InterestLevel;
};

const ALLOWED_ORIGIN = process.env.LEAD_FORM_ALLOWED_ORIGIN || "*";

function cors(origin: string | null) {
  const allow =
    ALLOWED_ORIGIN === "*"
      ? "*"
      : origin && origin === ALLOWED_ORIGIN
        ? origin
        : ALLOWED_ORIGIN;

  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function mustStr(v: unknown, field: string) {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) throw new Error(`${field} is required`);
  return s;
}

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function oneOf<T extends string>(v: string, allowed: readonly T[], field: string): T {
  if (!allowed.includes(v as T)) throw new Error(`Invalid ${field}`);
  return v as T;
}

const INTENTS = ["buy", "rent"] as const;
const BHKS = ["studio", "1bhk", "2bhk", "3bhk", "4bhk", "4+bhk", "other"] as const;
const INTEREST = ["extremely_sure", "highly_interested", "interested"] as const;

function scoreFromInterest(level: InterestLevel) {
  // You can tweak these later
  if (level === "extremely_sure") {
    return { label: "for_sure" as const, score: 95, reasons: ["Marked extremely sure"] };
  }
  if (level === "highly_interested") {
    return { label: "for_sure" as const, score: 85, reasons: ["Marked highly interested"] };
  }
  return { label: "unsure" as const, score: 60, reasons: ["Marked interested"] };
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  return new Response(null, { status: 204, headers: cors(origin) });
}

// Keep GET for your existing dashboard list (optional)
export async function GET(req: Request) {
  const origin = req.headers.get("origin");

  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("*")
    .order("inserted_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors(origin) });
  }
  return NextResponse.json({ ok: true, leads: data }, { status: 200, headers: cors(origin) });
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const headers = cors(origin);

  try {
    const b = (await req.json()) as Partial<LeadFormPayload>;

    const name = mustStr(b.name, "name");
    const phone = mustStr(b.phone, "phone");
    const email = mustStr(b.email, "email").toLowerCase();
    const city = mustStr(b.city, "city");
    const state = mustStr(b.state, "state");
    const pincode = mustStr(b.pincode, "pincode");

    if (!isEmail(email)) throw new Error("Invalid email");

    const intent = oneOf(mustStr(b.intent, "intent"), INTENTS, "intent");
    const bhk = oneOf(mustStr(b.bhk, "bhk"), BHKS, "bhk");
    const interest_level = oneOf(
      mustStr(b.interest_level, "interest_level"),
      INTEREST,
      "interest_level"
    );

    const scoring = scoreFromInterest(interest_level);

    // Insert into your existing `public.leads` schema
    const insertPayload = {
      source: "landing_form",
      created_time: new Date().toISOString(),

      full_name: name,
      email,
      phone,
      city,

      raw_payload: {
        name,
        phone,
        email,
        city,
        state,
        pincode,
        intent,
        bhk,
        interest_level,
      },

      intent_label: scoring.label,
      intent_score: scoring.score,
      intent_reasons: scoring.reasons,

      // pipeline defaults (you already have defaults in SQL, but explicit is fine)
      stage: "new",
      outcome: "open",
    };

    const { data: lead, error: leadErr } = await supabaseAdmin
      .from("leads")
      .insert(insertPayload)
      .select("*")
      .single();

    if (leadErr) {
      return NextResponse.json({ error: leadErr.message }, { status: 500, headers });
    }

    // Add an audit event
    const { error: evtErr } = await supabaseAdmin.from("lead_events").insert({
      lead_id: lead.id,
      event_type: "created",
      note: "Lead created from landing form",
    });

    // If event insert fails, still return lead (don’t block lead ingestion)
    if (evtErr) {
      return NextResponse.json(
        { ok: true, lead, warning: "lead_events insert failed", warning_detail: evtErr.message },
        { status: 200, headers }
      );
    }

    return NextResponse.json({ ok: true, lead }, { status: 200, headers });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Bad request" }, { status: 400, headers });
  }
}
