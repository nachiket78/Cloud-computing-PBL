import { useState } from "react";
import { Button } from "../components/Button.jsx";
import { Field, inputProps } from "../components/Field.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { isSupabaseConfigured } from "../lib/supabase.js";
import { AuthLink, AuthScreen } from "./AuthScreen.jsx";

export function Login() {
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    const next = {};
    if (!email.includes("@")) next.email = "Enter a valid email.";
    if (password.length < 8) next.password = "Password must be at least 8 characters.";
    setErrors(next);
    if (Object.keys(next).length || !isSupabaseConfigured()) return;

    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title="Sign in"
      description="Review campus incidents and the evidence stored with them."
      footer={<>New here? <AuthLink to="/signup">Create an account</AuthLink></>}
    >
      <form onSubmit={onSubmit} noValidate>
        <Field id="email" label="Email" error={errors.email}>
          <input
            {...inputProps("email", errors.email)}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field id="password" label="Password" error={errors.password}>
          <input
            {...inputProps("password", errors.password)}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <div className="form-actions">
          <Button type="submit" disabled={submitting || !isSupabaseConfigured()} aria-busy={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </div>
      </form>
    </AuthScreen>
  );
}
