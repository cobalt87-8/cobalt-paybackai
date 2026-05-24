"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const next = searchParams.get("next") || "/dashboard";
  const plan = searchParams.get("plan");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setLoading(false);

      if (error) {
        setMessage(error.message);
        return;
      }

      if (plan) {
        router.push(`${next}?plan=${plan}`);
      } else {
        router.push(next);
      }

      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Account created. Check your email to confirm your account.");
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <Link href="/" style={backStyle}>
          ← Back to home
        </Link>

        <p style={eyebrowStyle}>
          {mode === "login" ? "Welcome back" : "Create account"}
        </p>

        <h1 style={titleStyle}>
          {mode === "login" ? "Login" : "Sign up"}
        </h1>

        <p style={subtitleStyle}>
          {mode === "login"
            ? "Enter your email and password to open your dashboard."
            : "Create your account and start your 3-day free trial."}
        </p>

        {plan && (
          <div style={planBoxStyle}>
            Selected plan: <b>{plan.toUpperCase()}</b>
          </div>
        )}

        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={labelStyle}>Email</label>
          <input
            style={inputStyle}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label style={labelStyle}>Password</label>
          <input
            style={inputStyle}
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {message && <div style={messageStyle}>{message}</div>}

          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Login"
              : "Create account"}
          </button>
        </form>

        <button
          style={switchButtonStyle}
          onClick={() => {
            setMessage("");
            setMode(mode === "login" ? "signup" : "login");
          }}
        >
          {mode === "login"
            ? "Need an account? Sign up"
            : "Already have an account? Login"}
        </button>

        <Link href="/forgot-password" style={forgotStyle}>
          Forgot password?
        </Link>
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top right, rgba(37,99,235,0.28), transparent 35%), linear-gradient(135deg, #020617, #071634)",
  color: "white",
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 30,
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 620,
  background: "rgba(15,23,42,0.86)",
  border: "1px solid rgba(148,163,184,0.2)",
  borderRadius: 32,
  padding: 42,
  boxShadow: "0 35px 100px rgba(0,0,0,0.35)",
};

const backStyle: React.CSSProperties = {
  color: "#60a5fa",
  fontWeight: 950,
  fontSize: 18,
  textDecoration: "none",
};

const eyebrowStyle: React.CSSProperties = {
  color: "#60a5fa",
  fontSize: 22,
  fontWeight: 950,
  marginTop: 34,
};

const titleStyle: React.CSSProperties = {
  fontSize: 64,
  fontWeight: 950,
  margin: "10px 0",
};

const subtitleStyle: React.CSSProperties = {
  color: "#bfdbfe",
  fontSize: 22,
  lineHeight: 1.5,
};

const planBoxStyle: React.CSSProperties = {
  background: "rgba(34,197,94,0.13)",
  color: "#86efac",
  border: "1px solid rgba(34,197,94,0.35)",
  padding: "16px 18px",
  borderRadius: 18,
  fontSize: 18,
  fontWeight: 800,
  margin: "22px 0",
};

const formStyle: React.CSSProperties = {
  display: "grid",
  gap: 16,
  marginTop: 26,
};

const labelStyle: React.CSSProperties = {
  color: "#93c5fd",
  fontSize: 18,
  fontWeight: 950,
};

const inputStyle: React.CSSProperties = {
  background: "#020617",
  color: "white",
  border: "1px solid rgba(148,163,184,0.22)",
  borderRadius: 20,
  padding: "20px 22px",
  fontSize: 20,
  outline: "none",
};

const messageStyle: React.CSSProperties = {
  background: "rgba(59,130,246,0.15)",
  color: "#bfdbfe",
  border: "1px solid rgba(96,165,250,0.35)",
  padding: "16px 18px",
  borderRadius: 16,
  fontSize: 17,
  fontWeight: 850,
};

const buttonStyle: React.CSSProperties = {
  background: "white",
  color: "black",
  border: "none",
  borderRadius: 22,
  padding: "20px 24px",
  fontSize: 22,
  fontWeight: 950,
  cursor: "pointer",
  marginTop: 10,
};

const switchButtonStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 22,
  background: "rgba(15,23,42,0.75)",
  color: "#93c5fd",
  border: "1px solid rgba(148,163,184,0.22)",
  borderRadius: 20,
  padding: "18px 20px",
  fontSize: 19,
  fontWeight: 950,
  cursor: "pointer",
};

const forgotStyle: React.CSSProperties = {
  display: "block",
  color: "#60a5fa",
  fontSize: 18,
  fontWeight: 900,
  textDecoration: "none",
  marginTop: 22,
};