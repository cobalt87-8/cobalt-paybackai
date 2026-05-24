"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function UpdatePasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!password || !confirmPassword) {
      setError("Please enter both passwords.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Password updated successfully. Redirecting to login...");

    setTimeout(() => {
      router.push("/login");
    }, 1500);
  }

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <p style={tagStyle}>Reset Password</p>

        <h1 style={titleStyle}>Create new password</h1>

        <p style={subtitleStyle}>
          Enter your new password below. After updating it, you can login again.
        </p>

        <form onSubmit={updatePassword}>
          <label style={labelStyle}>New Password</label>
          <input
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          <label style={labelStyle}>Confirm Password</label>
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={inputStyle}
          />

          {error && <div style={errorStyle}>{error}</div>}
          {message && <div style={successStyle}>{message}</div>}

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        <Link href="/login" style={backStyle}>
          ← Back to login
        </Link>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top right, rgba(37,99,235,0.25), transparent 35%), #020617",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  color: "white",
  fontFamily: "Arial, sans-serif",
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 620,
  background: "rgba(15, 23, 42, 0.92)",
  border: "1px solid rgba(148, 163, 184, 0.22)",
  borderRadius: 28,
  padding: 44,
  boxShadow: "0 30px 90px rgba(0,0,0,0.45)",
};

const tagStyle: React.CSSProperties = {
  color: "#60a5fa",
  fontSize: 22,
  fontWeight: 900,
  marginBottom: 18,
};

const titleStyle: React.CSSProperties = {
  fontSize: 54,
  lineHeight: 1.05,
  marginBottom: 18,
  fontWeight: 950,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 22,
  lineHeight: 1.5,
  color: "#bfdbfe",
  marginBottom: 34,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "#93c5fd",
  fontSize: 18,
  fontWeight: 900,
  marginBottom: 10,
  marginTop: 20,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "20px 22px",
  borderRadius: 18,
  border: "1px solid rgba(148, 163, 184, 0.22)",
  background: "#020617",
  color: "white",
  fontSize: 20,
  outline: "none",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 30,
  padding: "20px 24px",
  borderRadius: 18,
  border: "none",
  background: "white",
  color: "black",
  fontSize: 22,
  fontWeight: 950,
  cursor: "pointer",
};

const errorStyle: React.CSSProperties = {
  marginTop: 20,
  padding: "16px 18px",
  borderRadius: 16,
  background: "rgba(239, 68, 68, 0.12)",
  border: "1px solid rgba(239, 68, 68, 0.35)",
  color: "#fca5a5",
  fontWeight: 900,
};

const successStyle: React.CSSProperties = {
  marginTop: 20,
  padding: "16px 18px",
  borderRadius: 16,
  background: "rgba(34, 197, 94, 0.12)",
  border: "1px solid rgba(34, 197, 94, 0.35)",
  color: "#4ade80",
  fontWeight: 900,
};

const backStyle: React.CSSProperties = {
  display: "inline-block",
  marginTop: 24,
  color: "#60a5fa",
  fontSize: 18,
  fontWeight: 900,
  textDecoration: "none",
};