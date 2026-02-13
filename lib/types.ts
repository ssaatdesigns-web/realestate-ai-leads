export type Lead = {
  id: string;
  leadgen_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  intent_label: "for_sure" | "unsure" | "unknown";
  intent_score: number;
  stage: string;
  outcome: "open" | "won" | "lost";
  converted_at: string | null;
  deal_value: number | null;
  created_time: string | null;
  inserted_at: string;
};

export type LeadEvent = {
  id: string;
  lead_id: string;
  event_type: string;
  from_stage: string | null;
  to_stage: string | null;
  note: string | null;
  value: number | null;
  created_at: string;
};
