import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth.jsx";
import { TEST_IDS } from "@/constants/testIds";
import { toast } from "sonner";
import { ArrowUpRight } from "lucide-react";

export function GoogleButton() {
  const handleGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };
  return (
    <button
      type="button"
      onClick={handleGoogle}
      data-testid={TEST_IDS.auth.googleBtn}
      className="w-full btn-secondary flex items-center justify-center gap-3"
    >
      <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 8 3l5.7-5.7C33.6 6.1 29 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 8 3l5.7-5.7C33.6 6.1 29 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
        <path fill="#4CAF50" d="M24 44c5 0 9.6-1.9 13-5l-6-5.1c-2 1.4-4.5 2.2-7 2.2-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6 5.1C40 35.6 44 30.3 44 24c0-1.2-.1-2.4-.4-3.5z"/>
      </svg>
      Continue with Google
    </button>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white px-6 grid-bg">
      <div className="w-full max-w-md panel p-10">
        <Link to="/" className="flex items-center gap-2 mb-10">
          <div className="w-7 h-7 bg-white text-black flex items-center justify-center font-display font-bold text-sm">L</div>
          <span className="font-display text-lg tracking-tight">launchpilot</span>
        </Link>
        <div className="overline mb-3">/ sign in</div>
        <h1 className="font-display text-3xl tracking-tighter">Welcome back.</h1>
        <p className="text-zinc-400 mt-2 text-sm">Operate your agency from one console.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">email</label>
            <input
              type="email" required value={email} onChange={e=>setEmail(e.target.value)}
              data-testid={TEST_IDS.auth.emailInput}
              className="mt-2 w-full bg-transparent border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/40 transition-colors"
              placeholder="you@agency.com" />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">password</label>
            <input
              type="password" required value={password} onChange={e=>setPassword(e.target.value)}
              data-testid={TEST_IDS.auth.passwordInput}
              className="mt-2 w-full bg-transparent border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/40 transition-colors"
              placeholder="••••••••" />
          </div>
          <button
            type="submit" disabled={loading}
            data-testid={TEST_IDS.auth.submit}
            className="w-full btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? "Signing in…" : (<>Sign in <ArrowUpRight size={16}/></>)}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <GoogleButton />

        <div className="mt-8 font-mono text-xs text-zinc-500">
          new here?{" "}
          <Link to="/signup" data-testid={TEST_IDS.auth.toggleMode} className="text-white underline">create an account</Link>
        </div>
      </div>
    </div>
  );
}
