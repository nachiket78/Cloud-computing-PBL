import { supabase } from "./supabase.js";

const base = import.meta.env.VITE_API_URL || "";

export class ApiError extends Error {
  constructor(message, fields) {
    super(message);
    this.fields = fields || null;
  }
}

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});

  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      headers.set("Authorization", `Bearer ${data.session.access_token}`);
    }
  }

  let body = options.body;
  if (body && !(body instanceof FormData) && typeof body !== "string") {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${base}${path}`, { ...options, headers, body });
  } catch {
    throw new ApiError("The API is not running. Start it from the api folder.");
  }

  const text = await response.text();
  let payload = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { error: text.slice(0, 180) };
    }
  }
  if (!response.ok) {
    throw new ApiError(payload.error || `Request failed (${response.status}).`, payload.fields);
  }
  return payload;
}
