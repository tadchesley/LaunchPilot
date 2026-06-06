import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth.jsx";
import { TEST_IDS } from "@/constants/testIds";
import { toast } from "sonner";
import { ArrowUpRight } from "lucide-react";
import { GoogleButton } from "./Login";

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password, name);
      toast.success("Workspace ready");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not create account");
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
        <div className="overline mb-3">/ create account</div>
        <h1 className="font-display text-3xl tracking-tighter">Start running your OS.</h1>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">name</label>
            <input required value={name} onChange={e=>setName(e.target.value)}
              data-testid={TEST_IDS.auth.nameInput}
              className="mt-2 w-full bg-transparent border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/40"
              placeholder="Alex Operator" />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">email</label>
            <input type="email" required value={email} onChange={e=>setEmail(e.target.value)}
              data-testid={TEST_IDS.auth.emailInput}
              className="mt-2 w-full bg-transparent border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/40"
              placeholder="you@agency.com" />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">password</label>
            <input type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)}
              data-testid={TEST_IDS.auth.passwordInput}
              className="mt-2 w-full bg-transparent border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/40"
              placeholder="min 6 characters" />
          </div>
          <button type="submit" disabled={loading}
            data-testid={TEST_IDS.auth.submit}
            className="w-full btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? "Creating…" : (<>Create workspace <ArrowUpRight size={16}/></>)}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <GoogleButton />

        <div className="mt-8 font-mono text-xs text-zinc-500">
          already have an account?{" "}
          <Link to="/login" data-testid={TEST_IDS.auth.toggleMode} className="text-white underline">sign in</Link>
        </div>
      </div>
    </div>
  );
}
