import os, json, hmac, hashlib
from typing import Optional, Any, Dict

import httpx
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import PlainTextResponse
from supabase import create_client

app = FastAPI(title="Meta Lead Ads Webhook (Vercel)")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

WEBHOOK_VERIFY_TOKEN = os.environ["WEBHOOK_VERIFY_TOKEN"]
META_APP_SECRET = os.environ["META_APP_SECRET"]
META_ACCESS_TOKEN = os.environ["META_ACCESS_TOKEN"]
META_GRAPH_BASE = os.environ.get("META_GRAPH_BASE", "https://graph.facebook.com")
META_GRAPH_VERSION = os.environ.get("META_GRAPH_VERSION", "v20.0")

def verify_meta_signature(raw_body: bytes, signature_header: Optional[str]) -> None:
    # Meta signs webhook payloads with X-Hub-Signature-256; compare HMAC-SHA256. :contentReference[oaicite:3]{index=3}
    if not signature_header or not signature_header.startswith("sha256="):
        raise HTTPException(status_code=401, detail="Missing/invalid X-Hub-Signature-256")
    their_sig = signature_header.split("sha256=", 1)[1].strip()
    our_sig = hmac.new(META_APP_SECRET.encode(), msg=raw_body, digestmod=hashlib.sha256).hexdigest()
    if not hmac.compare_digest(our_sig, their_sig):
        raise HTTPException(status_code=401, detail="Invalid signature")

async def fetch_lead(leadgen_id: str) -> dict:
    url = f"{META_GRAPH_BASE}/{META_GRAPH_VERSION}/{leadgen_id}"
    params = {"access_token": META_ACCESS_TOKEN, "fields": "created_time,ad_id,form_id,page_id,field_data"}
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        return r.json()

def extract_field(field_data: list, key: str) -> Optional[str]:
    for item in field_data or []:
        if item.get("name") == key:
            vals = item.get("values") or []
            return vals[0] if vals else None
    return None

def classify_v1(text: str):
    t = (text or "").lower()
    sure = any(k in t for k in ["buy", "purchase", "ready", "immediately", "site visit", "token", "advance"])
    unsure = any(k in t for k in ["explore", "checking", "just looking", "maybe", "not sure", "planning"])

    score = 10
    if "budget" in t or "lakh" in t or "crore" in t: score += 15
    if "bhk" in t: score += 10
    if "rent" in t: score += 8
    if "plot" in t or "land" in t: score += 8
    if sure: score += 35
    if unsure: score -= 10
    score = max(0, min(100, score))

    if sure and score >= 55: return "for_sure", score, ["high_intent_terms"]
    if unsure and score <= 60: return "unsure", score, ["low_commitment_terms"]
    return "unknown", score, []

@app.get("/webhook", response_class=PlainTextResponse)
async def webhook_verify(hub_mode: str = "", hub_verify_token: str = "", hub_challenge: str = ""):
    if hub_mode == "subscribe" and hub_verify_token == WEBHOOK_VERIFY_TOKEN:
        return hub_challenge
    raise HTTPException(status_code=403, detail="Webhook verification failed")

@app.post("/webhook")
async def webhook_receive(request: Request):
    raw = await request.body()
    verify_meta_signature(raw, request.headers.get("X-Hub-Signature-256"))

    payload = json.loads(raw.decode("utf-8"))
    entries = payload.get("entry") or []

    saved = 0
    for entry in entries:
        for ch in (entry.get("changes") or []):
            value = ch.get("value") or {}
            leadgen_id = value.get("leadgen_id")
            if not leadgen_id:
                continue

            lead = await fetch_lead(leadgen_id)
            field_data = lead.get("field_data") or []

            full_name = extract_field(field_data, "full_name") or extract_field(field_data, "name")
            email = extract_field(field_data, "email")
            phone = extract_field(field_data, "phone_number") or extract_field(field_data, "phone")

            blob = " ".join([str(full_name or ""), str(email or ""), str(phone or ""), json.dumps(field_data)])
            label, score, reasons = classify_v1(blob)

            row: Dict[str, Any] = {
                "source": "meta_lead_ads",
                "leadgen_id": leadgen_id,
                "page_id": lead.get("page_id"),
                "form_id": lead.get("form_id"),
                "ad_id": lead.get("ad_id"),
                "created_time": lead.get("created_time"),
                "full_name": full_name,
                "email": email,
                "phone": phone,
                "raw_payload": lead,
                "intent_label": label,
                "intent_score": score,
                "intent_reasons": reasons,
                "stage": "new",
                "outcome": "open"
            }

            # Upsert lead
            supabase.table("leads").upsert(row).execute()
            saved += 1

    return {"ok": True, "saved": saved}

@app.get("/health")
async def health():
    return {"status": "ok"}
