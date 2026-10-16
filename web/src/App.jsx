import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell.jsx";
import { BootScreen } from "./components/Skeleton.jsx";
import { Button } from "./components/Button.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { Audit } from "./pages/Audit.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { IncidentDetail } from "./pages/IncidentDetail.jsx";
import { Incidents } from "./pages/Incidents.jsx";
import { Login } from "./pages/Login.jsx";
import { NewIncident } from "./pages/NewIncident.jsx";
import { Signup } from "./pages/Signup.jsx";

function RequireAuth() {
  const { session, ready, profileError, signOut } = useAuth();
  if (!ready && session !== null) return <BootScreen />;
  if (!session) return <Navigate to="/login" replace />;
  if (profileError) {
    return (
      <main className="auth-screen">
        <div className="auth-card">
          <h1>Account not ready</h1>
          <p className="lede">{profileError}</p>
          <Button onClick={signOut}>Sign out</Button>
        </div>
      </main>
    );
  }
  return <AppShell />;
}

function GuestOnly({ children }) {
  const { session, ready } = useAuth();
  if (!ready && session !== null) return <BootScreen />;
  if (session) return <Navigate to="/dashboard" replace />;
  return children;
}

function ReviewerOnly() {
  const { profile } = useAuth();
  if (profile?.role !== "reviewer") return <Navigate to="/dashboard" replace />;
  return <Audit />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/signup" element={<GuestOnly><Signup /></GuestOnly>} />
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/incidents/new" element={<NewIncident />} />
        <Route path="/incidents/:id" element={<IncidentDetail />} />
        <Route path="/audit" element={<ReviewerOnly />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
