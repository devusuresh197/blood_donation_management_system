import { useState } from "react";
import RoleLogin from "./components/RoleLogin";
import PortalShell from "./components/PortalShell";

function App() {
  const [session, setSession] = useState(null);

  if (!session) {
    return <RoleLogin onLogin={setSession} />;
  }

  return <PortalShell session={session} onLogout={() => setSession(null)} />;
}

export default App;
