import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Files, LayoutDashboard, LogOut, Menu, Moon, Plus, ScrollText, Shield, Sun, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { initials } from "../lib/format.js";
import { label } from "../lib/constants.js";
import { useTheme } from "../lib/motion.js";
import { Button } from "./Button.jsx";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/incidents", label: "Incidents", icon: Files, end: true },
  { to: "/incidents/new", label: "New report", icon: Plus },
];

export function AppShell() {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const items = profile?.role === "reviewer"
    ? [...links, { to: "/audit", label: "Audit", icon: ScrollText }]
    : links;

  return (
    <div className="shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <button type="button" className="icon-button menu-button" aria-label="Open menu" onClick={() => setOpen(true)}>
        <Menu size={16} aria-hidden="true" />
      </button>
      {open ? <button type="button" className="scrim" aria-label="Close menu" onClick={() => setOpen(false)} /> : null}
      <aside className={`sidebar${open ? " open" : ""}`}>
        <div className="brand">
          <span className="mark" aria-hidden="true"><Shield size={16} /></span>
          <strong>Aegis</strong>
          <button type="button" className="icon-button sidebar-close" aria-label="Close menu" onClick={() => setOpen(false)}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <nav className="nav" aria-label="Primary">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
              >
                <Icon size={16} aria-hidden="true" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-user">
          <div className="identity">
            <span className="avatar" aria-hidden="true">{initials(profile?.name)}</span>
            <div>
              <strong>{profile?.name}</strong>
              <span>{label(profile?.role)}</span>
            </div>
          </div>
          <div className="sidebar-actions">
            <button type="button" className="icon-button" onClick={toggleTheme} aria-label={theme === "dark" ? "Use light theme" : "Use dark theme"}>
              {theme === "dark" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
            </button>
            <Button variant="secondary" onClick={signOut}>
              <LogOut size={16} aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>
      <div className="main" id="main">
        <Outlet />
      </div>
    </div>
  );
}
