import { getServiceClient, isConfigured } from "./supabase.js";

export function requireConfig(_req, res, next) {
  if (!isConfigured()) {
    return res.status(503).json({
      error: "Cloud storage is not configured. Add Supabase keys to api/.env.",
    });
  }
  next();
}

export async function requireUser(req, res, next) {
  const header = req.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!token) {
    return res.status(401).json({ error: "Sign in required." });
  }

  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: "Session expired. Sign in again." });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError) {
      return res.status(500).json({ error: "Could not load your profile." });
    }

    if (!profile) {
      return res.status(403).json({
        error: "No profile found. Run supabase/schema.sql, then sign up again.",
      });
    }

    req.user = {
      id: profile.id,
      name: profile.name,
      role: profile.role,
      email: data.user.email,
    };
    next();
  } catch (error) {
    next(error);
  }
}

export function requireReviewer(req, res, next) {
  if (req.user?.role !== "reviewer") {
    return res.status(403).json({ error: "Only reviewers can do that." });
  }
  next();
}
