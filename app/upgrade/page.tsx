"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function UpgradePage() {
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Trial ended</p>

        <h1 style={titleStyle}>Upgrade to keep using Cobalt</h1>

        <p style={subtitleStyle}>
          Your 3-day free trial is over. Choose a plan to continue tracking
          renewals, invoices, reports, and email templates.
        </p>

        <div style={plansStyle}>
          <div style={planCardStyle}>
            <p style={planLabelStyle}>Starter</p>
            <h2 style={priceStyle}>$9/mo</h2>
            <p style={planTextStyle}>For freelancers and small teams.</p>
            <button style={buttonStyle}>Upgrade Starter</button>
          </div>

          <div style={featuredPlanStyle}>
            <p style={planLabelStyle}>Pro</p>
            <h2 style={priceStyle}>$19/mo</h2>
            <p style={planTextStyle}>For growing teams managing SaaS spend.</p>
            <button style={buttonStyle}>Upgrade Pro</button>
          </div>

          <div style={planCardStyle}>
            <p style={planLabelStyle}>Business</p>
            <h2 style={priceStyle}>$49/mo</h2>
            <p style={planTextStyle}>For finance and operations teams.</p>
            <button style={buttonStyle}>Upgrade Business</button>
          </div>
        </div>

        <div style={bottomRowStyle}>
          <Link href="/" style={homeLinkStyle}>
            Back to home
          </Link>

          <button onClick={logout} style={logoutButtonStyle}>
            Logout
          </button>
        </div>
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top right, rgba(37,99,235,0.25), transparent 34%), linear-gradient(135deg, #020617, #07112e)",
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
  maxWidth: 1100,
  background: "rgba(15,23,42,0.86)",
  border: "1px solid rgba(148,163,184,0.22)",
  borderRadius: 34,
  padding: 42,
  boxShadow: "0 30px 90px rgba(0,0,0,0.35)",
};

const eyebrowStyle: React.CSSProperties = {
  color: "#60a5fa",
  fontSize: 22,
  fontWeight: 1000,
  margin: "0 0 16px",
};

const titleStyle: React.CSSProperties = {
  fontSize: 58,
  lineHeight: 1,
  margin: 0,
  fontWeight: 1000,
  letterSpacing: "-2px",
};

const subtitleStyle: React.CSSProperties = {
  color: "#bfdbfe",
  fontSize: 22,
  lineHeight: 1.45,
  maxWidth: 820,
  margin: "22px 0 34px",
};

const plansStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 20,
};

const planCardStyle: React.CSSProperties = {
  background: "rgba(2,6,23,0.72)",
  border: "1px solid rgba(148,163,184,0.18)",
  borderRadius: 26,
  padding: 28,
};

const featuredPlanStyle: React.CSSProperties = {
  ...planCardStyle,
  border: "1px solid rgba(96,165,250,0.55)",
  boxShadow: "0 20px 70px rgba(37,99,235,0.22)",
};

const planLabelStyle: React.CSSProperties = {
  color: "#60a5fa",
  fontSize: 20,
  fontWeight: 1000,
  margin: 0,
};

const priceStyle: React.CSSProperties = {
  fontSize: 44,
  margin: "18px 0",
  fontWeight: 1000,
};

const planTextStyle: React.CSSProperties = {
  color: "#bfdbfe",
  fontSize: 17,
  lineHeight: 1.45,
  minHeight: 50,
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 18,
  background: "white",
  color: "black",
  border: "none",
  padding: "16px 20px",
  borderRadius: 18,
  fontSize: 17,
  fontWeight: 1000,
  cursor: "pointer",
};

const bottomRowStyle: React.CSSProperties = {
  marginTop: 32,
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "center",
};

const homeLinkStyle: React.CSSProperties = {
  color: "#60a5fa",
  textDecoration: "none",
  fontSize: 18,
  fontWeight: 950,
};

const logoutButtonStyle: React.CSSProperties = {
  background: "rgba(244,63,94,0.16)",
  color: "#fecaca",
  border: "1px solid rgba(244,63,94,0.38)",
  padding: "14px 20px",
  borderRadius: 16,
  fontSize: 16,
  fontWeight: 950,
  cursor: "pointer",
};