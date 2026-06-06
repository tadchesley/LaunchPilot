import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api, setAuthToken } from "@/lib/api";
import { useAuth } from "@/lib/auth.jsx";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser, refresh } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // CRITICAL: Use useRef to guard against StrictMode double-invocation
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const run = async () => {
      const hash = window.location.hash || "";
      const match = hash.match(/session_id=([^&]+)/);
      const sessionId = match ? match[1] : null;
      if (!sessionId) {
        navigate("/login", { replace: true });
        return;
      }
      try {
        const { data } = await api.post("/auth/session", { session_id: sessionId });
        setAuthToken(data.token);
        setUser(data.user);
        // remove hash from URL
        window.history.replaceState(null, "", window.location.pathname);
        await refresh();
        navigate("/dashboard", { replace: true });
      } catch (e) {
        navigate("/login?error=oauth", { replace: true });
      }
    };
    run();
  }, [navigate, setUser, refresh]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white font-mono text-sm">
      finalizing session…
    </div>
  );
}
