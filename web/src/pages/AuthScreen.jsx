import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { isSupabaseConfigured } from "../lib/supabase.js";
import { useTheme } from "../lib/motion.js";

export function AuthScreen({ title, description, children, footer }) {
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    document.title = `${title} · Lumen`;
  }, [title]);

  return (
    <main className="auth-screen">
      <div className="auth-glow" aria-hidden="true">
        <span className="glow glow-a" />
        <span className="glow glow-b" />
        <span className="glow glow-c" />
      </div>
      <button
        type="button"
        className="icon-button theme-float"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Use light theme" : "Use dark theme"}
      >
        {theme === "dark" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
      </button>
      <div className="auth-layout">
        <section className="auth-story" aria-labelledby="auth-story-title">
          <p className="auth-eyebrow">Campus incident desk</p>
          <h2 id="auth-story-title" className="auth-headline">
            Report it.<br />
            Keep the proof.<br />
            Close the case.
          </h2>
          <span className="auth-rule" aria-hidden="true" />
          <div className="auth-points">
            <span className="auth-rail" aria-hidden="true"><span className="auth-traveler" /></span>
            <ol>
              <li className="auth-point">
                <span className="auth-point-mark" aria-hidden="true" />
                <span>File a case with a photo or PDF.</span>
              </li>
              <li className="auth-point">
                <span className="auth-point-mark" aria-hidden="true" />
                <span>A reviewer moves it from Open to Resolved.</span>
              </li>
              <li className="auth-point">
                <span className="auth-point-mark" aria-hidden="true" />
                <span>The file stays in a private cloud store.</span>
              </li>
            </ol>
          </div>
        </section>
        <div className="auth-card">
          <div className="brand">
            <span className="mark mark-live" aria-hidden="true"><span className="mark-core" /></span>
            <strong>Lumen</strong>
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
      </div>
    </main>
  );
}

export function AuthLink({ to, children }) {
  return <Link to={to}>{children}</Link>;
}
