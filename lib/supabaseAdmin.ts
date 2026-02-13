import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-only Supabase client (service role). Do NOT expose these env vars to the browser.
export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false },
});
