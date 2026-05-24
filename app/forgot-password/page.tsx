"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Password reset link sent. Check your email.");
    }

    setLoading(false);
  }

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <Link href="/login" style={backStyle}>
          ← Back to login
        </Link>

        <p style={eyebrowStyle}>Reset Access</p>

        <h1 style={titleStyle}>Forgot Password</h1>

        <p style={subtitleStyle}>
          Enter your email and we will send you a password reset link.
        </p>

        <form onSubmit={resetPassword} style={formStyle}>
          <label style={labelStyle}>Email</label>

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@example.com"
            required
            style={inputStyle}
          />

          {message && <div style={messageStyle}>{message}</div>}

          <button disabled={loading} type="submit" style={buttonStyle}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top right, rgba(37,99,235,0.28), transparent 35%), linear-gradient(135deg, #020617, #071733)",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 640,
  background: "rgba(15,23,42,0.88)",
  border: "1px solid rgba(148,163,184,0.22)",
  borderRadius: 32,
  padding: 44,
  boxShadow: "0 30px 90px rgba(0,0,0,0.35)",
};

const backStyle: React.CSSProperties = {
  color: "#60a5fa",
  textDecoration: "none",
  fontSize: 20,
  fontWeight: 900,
};

const eyebrowStyle: React.CSSProperties = {
  color: "#60a5fa",
  fontSize: 24,
  fontWeight: 950,
  margin: "34px 0 12px",
};

const titleStyle: React.CSSProperties = {
  fontSize: 58,
  lineHeight: 1,
  margin: 0,
  fontWeight: 950,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 24,
  lineHeight: 1.45,
  color: "#bfdbfe",
  margin: "24px 0 36px",
};

const formStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const labelStyle: React.CSSProperties = {
  color: "#93c5fd",
  fontSize: 20,
  fontWeight: 950,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "22px 24px",
  borderRadius: 20,
  border: "1px solid rgba(148,163,184,0.26)",
  background: "#020617",
  color: "white",
  fontSize: 22,
  outline: "none",
};

const messageStyle: React.CSSProperties = {
  background: "rgba(59,130,246,0.16)",
  border: "1px solid rgba(96,165,250,0.35)",
  color: "#bfdbfe",
  padding: "16px 18px",
  borderRadius: 18,
  fontSize: 18,
  fontWeight: 850,
};

const buttonStyle: React.CSSProperties = {
  marginTop: 10,
  background: "white",
  color: "black",
  border: "none",
  padding: "22px 28px",
  borderRadius: 22,
  fontSize: 22,
  fontWeight: 950,
  cursor: "pointer",
};