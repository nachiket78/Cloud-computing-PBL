import { useState } from "react";
import { Button } from "../components/Button.jsx";
import { Field, inputProps } from "../components/Field.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { ROLES } from "../lib/constants.js";
import { isSupabaseConfigured } from "../lib/supabase.js";
import { AuthLink, AuthScreen } from "./AuthScreen.jsx";

export function Signup() {
  const { signUp } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "reporter" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    const next = {};
    if (form.name.trim().length < 2) next.name = "Enter your name.";
    if (!form.email.includes("@")) next.email = "Enter a valid email.";
    if (form.password.length < 8) next.password = "Use at least 8 characters.";
    setErrors(next);
    if (Object.keys(next).length || !isSupabaseConfigured()) return;

    setSubmitting(true);
    try {
      const result = await signUp({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      if (result.needsConfirmation) {
        setSent(true);
        showToast("Check your email to confirm the account.");
      }
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title="Create account"
      description="Reporters file cases. Reviewers can change status and read the audit log."
      footer={<>Already have an account? <AuthLink to="/login">Sign in</AuthLink></>}
    >
      {sent ? (
        <p className="setup-note">Confirmation is required. Open the email, then sign in.</p>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <Field id="name" label="Name" error={errors.name}>
            <input {...inputProps("name", errors.name)} autoComplete="name" value={form.name} onChange={(event) => update("name", event.target.value)} />
          </Field>
          <Field id="email" label="Email" error={errors.email}>
            <input {...inputProps("email", errors.email)} type="email" autoComplete="email" value={form.email} onChange={(event) => update("email", event.target.value)} />
          </Field>
          <Field id="password" label="Password" error={errors.password}>
            <input {...inputProps("password", errors.password)} type="password" autoComplete="new-password" value={form.password} onChange={(event) => update("password", event.target.value)} />
          </Field>
          <Field id="role" label="Role" hint="Choose reviewer only if you will triage cases.">
            <select {...inputProps("role")} className="input select" value={form.role} onChange={(event) => update("role", event.target.value)}>
              {ROLES.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </Field>
          <div className="form-actions">
            <Button type="submit" disabled={submitting || !isSupabaseConfigured()} aria-busy={submitting}>
              {submitting ? "Creating account…" : "Create account"}
            </Button>
          </div>
        </form>
      )}
    </AuthScreen>
  );
}
