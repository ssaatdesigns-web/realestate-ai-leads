import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

const META_APP_SECRET = process.env.META_APP_SECRET!;
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN!;
const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN!;
const META_GRAPH_BASE = process.env.META_GRAPH_BASE || "https://graph.facebook.com";
const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v20.0";

function verifyMetaSignature(rawBody: Buffer, signatureHeader: string | null) {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    throw new Error("Missing/invalid X-Hub-Signature-256");
  }
  const theirSig = signatureHeader.replace("sha256=", "").trim();
  const ourSig = crypto
    .createHmac("sha256", META_APP_SECRET)
    .update(rawBody)
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(ourSig), Buffer.from(theirSig))) {
    throw new Error("Invalid signature");
  }
}

async function fetchLead(leadgenId: string) {
  const url = `${META_GRAPH_BASE}/${META_GRAPH_VERSION}/${leadgenId}?fields=created_time,ad_id,form_id,page_id,field_data&access_token=${encodeURIComponent(
    META_ACCESS_TOKEN
  )}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Meta fetch failed: ${r.status} ${await r.text()}`);
  return r.json();
}

function extractField(fieldData: any[], key: string): string | null {
  for (const item of fieldData || []) {
    if (item?.name === key) return (item?.values?.[0] ?? null) as string | null;
  }
  return null;
}

function classifyV1(text: string) {
  const t = (text || "").toLowerCase();
  const sure = ["buy", "purchase", "ready", "immediately", "site visit", "token", "advance"].some((k) => t.includes(k));
  const unsure = ["explore", "checking", "just looking", "maybe", "not sure", "planning"].some((k) => t.includes(k));

  let score = 10;
  if (t.includes("budget") || t.includes("lakh") || t.includes("crore")) score += 15;
  if (t.includes("bhk")) score += 10;
  if (t.includes("rent")) score += 8;
  if (t.includes("plot") || t.includes("land")) score += 8;
  if (sure) score += 35;
  if (unsure) score -= 10;
  score = Math.max(0, Math.min(100, score));

  if (sure && score >= 55) return { label: "for_sure", score, reasons: ["high_intent_terms"] };
  if (unsure && score <= 60) return { label: "unsure", score, reasons: ["low_commitment_terms"] };
  return { label: "unknown", score, reasons: [] };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // Meta sends hub.mode, hub.verify_token, hub.challenge
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Webhook verification failed" }, { status: 403 });
}

export async function POST(req: Request) {
  const raw = Buffer.from(await req.arrayBuffer());

  try {
    verifyMetaSignature(raw, req.headers.get("x-hub-signature-256"));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }

  const payload = JSON.parse(raw.toString("utf-8"));
  const entries = payload?.entry || [];

  let saved = 0;

  for (const entry of entries) {
    for (const ch of entry?.changes || []) {
      const leadgenId = ch?.value?.leadgen_id;
      if (!leadgenId) continue;

      const lead = await fetchLead(leadgenId);
      const fieldData = lead?.field_data || [];

      const full_name = extractField(fieldData, "full_name") || extractField(fieldData, "name");
      const email = extractField(fieldData, "email");
      const phone = extractField(fieldData, "phone_number") || extractField(fieldData, "phone");

      const blob = `${full_name || ""} ${email || ""} ${phone || ""} ${JSON.stringify(fieldData)}`;
      const cls = classifyV1(blob);

      await supabaseAdmin
        .from("leads")
        .upsert({
          source: "meta_lead_ads",
          leadgen_id: leadgenId,
          page_id: lead?.page_id ?? null,
          form_id: lead?.form_id ?? null,
          ad_id: lead?.ad_id ?? null,
          created_time: lead?.created_time ?? null,
          full_name,
          email,
          phone,
          raw_payload: lead,
          intent_label: cls.label,
          intent_score: cls.score,
          intent_reasons: cls.reasons,
          stage: "new",
          outcome: "open",
        });

      saved += 1;
    }
  }

  return NextResponse.json({ ok: true, saved });
}
