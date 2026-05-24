"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./lib/supabase";

export default function HomePage() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getSession();
      setLoggedIn(!!data.session);
      setChecking(false);
    }

    checkUser();
  }, []);

  function goToDashboard() {
    if (loggedIn) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }

  return (
    <main style={pageStyle}>
      <nav style={navStyle}>
        <button onClick={() => router.push("/")} style={logoStyle}>
          Cobalt
        </button>

        <div style={navRightStyle}>
          {loggedIn ? (
            <button onClick={() => router.push("/dashboard")} style={navButtonStyle}>
              Dashboard
            </button>
          ) : (
            <button onClick={() => router.push("/login")} style={navButtonStyle}>
              Login
            </button>
          )}
        </div>
      </nav>

      <section style={heroStyle}>
        <p style={eyebrowStyle}>SaaS Renewal + Invoice Tracker</p>

        <h1 style={titleStyle}>
          Stop wasting money on unused software subscriptions
        </h1>

        <p style={subtitleStyle}>
          Track software renewals, invoices, owners, monthly spend, and missing
          contract links from one clean dashboard.
        </p>

        <div style={buttonRowStyle}>
          {!checking && !loggedIn && (
            <button onClick={() => router.push("/login")} style={primaryButtonStyle}>
              Start 3-Day Free Trial
            </button>
          )}

          {!checking && loggedIn && (
            <button onClick={goToDashboard} style={primaryButtonStyle}>
              View Dashboard
            </button>
          )}

          {!checking && (
            <button onClick={() => router.push("/pricing")} style={secondaryButtonStyle}>
              View Plans
            </button>
          )}
        </div>

        <p style={trialTextStyle}>
          3-day free trial. Then upgrade to a paid plan when billing is added.
        </p>
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top right, rgba(35,85,180,0.35), transparent 35%), #020716",
  color: "white",
  fontFamily: "Inter, Arial, Helvetica, sans-serif",
};

const navStyle: React.CSSProperties = {
  height: 88,
  padding: "0 56px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const logoStyle: React.CSSProperties = {
  background: "transparent",
  color: "white",
  border: "none",
  fontSize: 38,
  fontWeight: 950,
  cursor: "pointer",
};

const navRightStyle: React.CSSProperties = {
  display: "flex",
  gap: 18,
  alignItems: "center",
};

const navButtonStyle: React.CSSProperties = {
  background: "white",
  color: "black",
  border: "none",
  borderRadius: 18,
  padding: "16px 30px",
  fontSize: 20,
  fontWeight: 900,
  cursor: "pointer",
};

const heroStyle: React.CSSProperties = {
  minHeight: "calc(100vh - 88px)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "70px 24px",
};

const eyebrowStyle: React.CSSProperties = {
  color: "#60a5fa",
  fontSize: 30,
  fontWeight: 950,
  marginBottom: 45,
};

const titleStyle: React.CSSProperties = {
  maxWidth: 1200,
  fontSize: "clamp(54px, 7vw, 118px)",
  lineHeight: 1.05,
  letterSpacing: "-4px",
  fontWeight: 950,
  margin: 0,
};

const subtitleStyle: React.CSSProperties = {
  maxWidth: 1150,
  color: "#bfdbfe",
  fontSize: "clamp(24px, 2.3vw, 40px)",
  lineHeight: 1.55,
  marginTop: 48,
  marginBottom: 65,
};

const buttonRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 28,
  flexWrap: "wrap",
  justifyContent: "center",
};

const primaryButtonStyle: React.CSSProperties = {
  background: "white",
  color: "black",
  border: "none",
  borderRadius: 22,
  padding: "26px 70px",
  fontSize: 28,
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 25px 70px rgba(96,165,250,0.25)",
};

const secondaryButtonStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: 22,
  padding: "26px 70px",
  fontSize: 28,
  fontWeight: 950,
  cursor: "pointer",
};

const trialTextStyle: React.CSSProperties = {
  marginTop: 34,
  color: "#93c5fd",
  fontSize: 20,
  fontWeight: 850,
};