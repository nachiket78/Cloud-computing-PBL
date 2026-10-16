import assert from "node:assert/strict";
import test from "node:test";
import { safeFileName, validateEvidenceFile, validateIncidentFields, validateStatusChange } from "../src/validate.js";

test("accepts a complete incident", () => {
  const { errors, value } = validateIncidentFields({
    title: "Broken stair light",
    category: "Safety",
    severity: "high",
    description: "The landing light has been out since Monday night.",
  });
  assert.deepEqual(errors, {});
  assert.equal(value.severity, "high");
});

test("rejects a short description and unknown category", () => {
  const { errors } = validateIncidentFields({
    title: "Hi",
    category: "Food",
    severity: "low",
    description: "short",
  });
  assert.ok(errors.title);
  assert.ok(errors.category);
  assert.ok(errors.description);
});

test("rejects the same status and an empty note", () => {
  const { errors } = validateStatusChange({ status: "open", note: " " }, "open");
  assert.ok(errors.status);
  assert.ok(errors.note);
});

test("accepts jpeg alias and rejects an empty file", () => {
  assert.equal(validateEvidenceFile({ mimetype: "image/jpg", size: 1200 }), "");
  assert.match(validateEvidenceFile({ mimetype: "image/png", size: 0 }), /empty/i);
});

test("strips path characters from file names", () => {
  assert.equal(safeFileName("../../notes.pdf"), "notes.pdf");
});
