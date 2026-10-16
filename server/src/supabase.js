import { createClient } from "@supabase/supabase-js";

export function isConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

let client;

export function getServiceClient() {
  if (!isConfigured()) {
    const error = new Error("Cloud storage is not configured.");
    error.status = 503;
    throw error;
  }

  if (!client) {
    client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return client;
}
