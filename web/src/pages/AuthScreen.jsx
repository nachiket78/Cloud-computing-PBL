import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Moon, Shield, Sun } from "lucide-react";
import { isSupabaseConfigured } from "../lib/supabase.js";
import { useTheme } from "../lib/motion.js";

export function AuthScreen({ title, description, children, footer }) {
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    document.title = `${title} · Aegis`;
  }, [title]);

  return (
    <main className="auth-screen">
      <button
        type="button"
        className="icon-button theme-float"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Use light theme" : "Use dark theme"}
      >
        {theme === "dark" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
      </button>
      <div className="auth-card rise">
        <div className="brand">
          <span className="mark" aria-hidden="true"><Shield size={16} /></span>
          <strong>Aegis</strong>
        </div>
        <h1>{title}</h1>
        <p className="lede">{description}</p>
        {!isSupabaseConfigured() ? (
          <p className="setup-note">
            Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to <code>web/.env.local</code>, then restart the web app.
          </p>
        ) : null}
        {children}
        <p className="auth-footer">{footer}</p>
      </div>
    </main>
  );
}

export function AuthLink({ to, children }) {
  return <Link to={to}>{children}</Link>;
}
