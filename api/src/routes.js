import crypto from "node:crypto";
import { Router } from "express";
import multer from "multer";
import { MAX_FILE_BYTES, SIGNED_URL_SECONDS, SEVERITIES, STATUSES } from "./constants.js";
import { requireReviewer, requireUser } from "./middleware.js";
import { getServiceClient } from "./supabase.js";
import {
  isUuid,
  normalizeMime,
  safeFileName,
  validateEvidenceFile,
  validateIncidentFields,
  validateStatusChange,
} from "./validate.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 1 },
});

const INCIDENT_COLUMNS = `
  id, owner_id, title, category, severity, description, status,
  file_path, file_name, file_type, byte_size, sha256,
  created_at, updated_at, resolved_at,
  owner:profiles!owner_id(name)
`;

function mapIncident(row) {
  if (!row) return null;
  const { owner, ...incident } = row;
  return {
    ...incident,
    owner_name: owner?.name || "Unknown",
  };
}

function searchClause(query) {
  return String(query || "")
    .trim()
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

async function loadIncident(supabase, id) {
  const { data, error } = await supabase
    .from("incidents")
    .select(INCIDENT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

function canRead(user, incident) {
  return user.role === "reviewer" || incident.owner_id === user.id;
}

export const api = Router();

api.get("/health", (_req, res) => {
  res.json({
    ok: true,
    configured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
  });
});

api.get("/me", requireUser, (req, res) => {
  res.json({ user: req.user });
});

api.get("/incidents", requireUser, async (req, res, next) => {
  try {
    const supabase = getServiceClient();
    let query = supabase.from("incidents").select(INCIDENT_COLUMNS).order("updated_at", { ascending: false });

    if (req.user.role !== "reviewer") {
      query = query.eq("owner_id", req.user.id);
    }

    const status = String(req.query.status || "");
    const severity = String(req.query.severity || "");
    if (STATUSES.includes(status)) query = query.eq("status", status);
    if (SEVERITIES.includes(severity)) query = query.eq("severity", severity);

    const q = searchClause(req.query.q);
    if (q) {
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ incidents: (data || []).map(mapIncident) });
  } catch (error) {
    next(error);
  }
});

api.get("/incidents/:id", requireUser, async (req, res, next) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(400).json({ error: "Unknown incident." });
    }

    const supabase = getServiceClient();
    const incident = await loadIncident(supabase, req.params.id);
    if (!incident || !canRead(req.user, incident)) {
      return res.status(404).json({ error: "Incident not found." });
    }

    const { data: audit, error } = await supabase
      .from("audit_log")
      .select("id, action, note, from_status, to_status, created_at, actor:profiles!actor_id(name)")
      .eq("incident_id", incident.id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    res.json({
      incident: mapIncident(incident),
      audit: (audit || []).map((entry) => ({
        id: entry.id,
        action: entry.action,
        note: entry.note,
        from_status: entry.from_status,
        to_status: entry.to_status,
        created_at: entry.created_at,
        actor_name: entry.actor?.name || "Unknown",
      })),
    });
  } catch (error) {
    next(error);
  }
});

api.post("/incidents", requireUser, (req, res, next) => {
  upload.single("file")(req, res, (uploadError) => {
    if (uploadError) {
      const tooLarge = uploadError.code === "LIMIT_FILE_SIZE";
      return res.status(400).json({
        error: tooLarge ? "Files must be 10 MB or smaller." : "Could not read the uploaded file.",
      });
    }
    createIncident(req, res).catch(next);
  });
});

async function createIncident(req, res) {
  const { errors, value } = validateIncidentFields(req.body || {});
  const fileError = validateEvidenceFile(req.file);
  if (fileError) errors.file = fileError;

  if (Object.keys(errors).length) {
    return res.status(400).json({ error: "Check the form and try again.", fields: errors });
  }

  const supabase = getServiceClient();
  const id = crypto.randomUUID();
  const fileName = safeFileName(req.file.originalname);
  const filePath = `${req.user.id}/${id}/${fileName}`;
  const fileType = normalizeMime(req.file.mimetype);
  const sha256 = crypto.createHash("sha256").update(req.file.buffer).digest("hex");

  const { error: uploadError } = await supabase.storage.from("evidence").upload(filePath, req.file.buffer, {
    contentType: fileType,
    upsert: false,
  });

  if (uploadError) {
    console.error(uploadError);
    return res.status(502).json({ error: "Could not store the file in cloud storage." });
  }

  const row = {
    id,
    owner_id: req.user.id,
    ...value,
    status: "open",
    file_path: filePath,
    file_name: fileName,
    file_type: fileType,
    byte_size: req.file.size,
    sha256,
  };

  const { error: insertError } = await supabase.from("incidents").insert(row);
  if (insertError) {
    await supabase.storage.from("evidence").remove([filePath]);
    return res.status(500).json({ error: "Could not save the incident." });
  }

  const { error: auditError } = await supabase.from("audit_log").insert({
    incident_id: id,
    actor_id: req.user.id,
    action: "created",
    to_status: "open",
  });

  if (auditError) {
    return res.status(500).json({ error: "The incident was saved, but the audit log was not." });
  }

  const incident = await loadIncident(supabase, id);
  res.status(201).json({ incident: mapIncident(incident) });
}

api.post("/incidents/:id/status", requireUser, requireReviewer, async (req, res, next) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(400).json({ error: "Unknown incident." });
    }

    const supabase = getServiceClient();
    const existing = await loadIncident(supabase, req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Incident not found." });
    }

    const { errors, value } = validateStatusChange(req.body || {}, existing.status);
    if (Object.keys(errors).length) {
      return res.status(400).json({ error: "Check the form and try again.", fields: errors });
    }

    const { error: updateError } = await supabase
      .from("incidents")
      .update({
        status: value.status,
        resolved_at: value.status === "resolved" ? new Date().toISOString() : null,
      })
      .eq("id", existing.id);

    if (updateError) throw updateError;

    const { error: auditError } = await supabase.from("audit_log").insert({
      incident_id: existing.id,
      actor_id: req.user.id,
      action: "status_changed",
      note: value.note,
      from_status: existing.status,
      to_status: value.status,
    });

    if (auditError) throw auditError;

    const incident = await loadIncident(supabase, existing.id);
    res.json({ incident: mapIncident(incident) });
  } catch (error) {
    next(error);
  }
});

api.get("/incidents/:id/evidence", requireUser, async (req, res, next) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(400).json({ error: "Unknown incident." });
    }

    const supabase = getServiceClient();
    const incident = await loadIncident(supabase, req.params.id);
    if (!incident || !canRead(req.user, incident) || !incident.file_path) {
      return res.status(404).json({ error: "Evidence not found." });
    }

    const { data, error } = await supabase.storage
      .from("evidence")
      .createSignedUrl(incident.file_path, SIGNED_URL_SECONDS);

    if (error || !data?.signedUrl) {
      return res.status(502).json({ error: "Could not create a download link." });
    }

    res.json({
      url: data.signedUrl,
      expiresIn: SIGNED_URL_SECONDS,
      fileName: incident.file_name,
      fileType: incident.file_type,
    });
  } catch (error) {
    next(error);
  }
});

api.get("/audit", requireUser, requireReviewer, async (_req, res, next) => {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("audit_log")
      .select(`
        id, action, note, from_status, to_status, created_at, incident_id,
        actor:profiles!actor_id(name),
        incident:incidents!incident_id(title)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      audit: (data || []).map((entry) => ({
        id: entry.id,
        action: entry.action,
        note: entry.note,
        from_status: entry.from_status,
        to_status: entry.to_status,
        created_at: entry.created_at,
        incident_id: entry.incident_id,
        incident_title: entry.incident?.title || "Deleted incident",
        actor_name: entry.actor?.name || "Unknown",
      })),
    });
  } catch (error) {
    next(error);
  }
});

api.use((_req, res) => {
  res.status(404).json({ error: "Not found." });
});
