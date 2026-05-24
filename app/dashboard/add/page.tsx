"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type PlanName = "starter" | "pro" | "business";

const PLAN_LIMITS: Record<PlanName, number> = {
  starter: 3,
  pro: 25,
  business: 999999,
};

export default function AddSoftwarePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");
  const [plan, setPlan] = useState<PlanName>("starter");
  const [currentCount, setCurrentCount] = useState(0);

  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [billingCycle, setBillingCycle] = useState("Monthly");
  const [renewalDate, setRenewalDate] = useState("");
  const [owner, setOwner] = useState("");
  const [invoiceUrl, setInvoiceUrl] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function init() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const savedPlanRaw =
        typeof window !== "undefined"
          ? localStorage.getItem("cobalt_plan")
          : null;

      const savedPlan = savedPlanRaw?.toLowerCase();

      const cleanPlan: PlanName =
        savedPlan === "pro" || savedPlan === "business" || savedPlan === "starter"
          ? savedPlan
          : "starter";

      setPlan(cleanPlan);

      const { count, error } = await supabase
        .from("software")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (error) {
        setError(error.message);
      } else {
        setCurrentCount(count || 0);
      }

      setLoading(false);
    }

    init();
  }, [router]);

  const limit = PLAN_LIMITS[plan];
  const limitReached = currentCount >= limit;

  async function addSoftware(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!userId) {
      router.push("/login");
      return;
    }

    if (limitReached) {
      setError(`Your ${plan} plan allows only ${limit} tools. Upgrade to add more.`);
      return;
    }

    if (!name || !cost || !billingCycle || !renewalDate || !owner) {
      setError("Please fill all required fields.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("software").insert([
      {
        user_id: userId,
        name,
        cost: Number(cost),
        billing_cycle: billingCycle,
        renewal_date: renewalDate,
        owner,
        invoice_url: invoiceUrl || null,
        notes: notes || null,
      },
    ]);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/dashboard/software");
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingCardStyle}>Loading add page...</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <aside style={sidebarStyle}>
        <h1 style={logoStyle}>Cobalt</h1>

        <nav style={navStyle}>
          <Link href="/dashboard" style={navLink(false)}>
            Dashboard
          </Link>
          <Link href="/dashboard/software" style={navLink(false)}>
            Software
          </Link>
          <Link href="/dashboard/invoices" style={navLink(false)}>
            Invoices
          </Link>
          <Link href="/dashboard/renewals" style={navLink(false)}>
            Renewals
          </Link>
        </nav>
      </aside>

      <section style={contentStyle}>
        <div style={topBarStyle}>
          <Link href="/dashboard/software" style={backStyle}>
            ← Back to Software
          </Link>

          <button onClick={logout} style={logoutStyle}>
            Logout
          </button>
        </div>

        <div style={heroStyle}>
          <div>
            <p style={eyebrowStyle}>Add new SaaS</p>
            <h2 style={titleStyle}>Add SaaS Tool</h2>
            <p style={subtitleStyle}>
              Track renewal date, owner, cost, invoice link, and notes.
            </p>
          </div>

          <div style={planCardStyle}>
            <p style={planLabelStyle}>{plan.toUpperCase()} PLAN</p>
            <h3 style={planLimitStyle}>
              {plan === "business" ? "Unlimited" : `${currentCount}/${limit}`}
            </h3>
            <p style={planSmallStyle}>tools used</p>
          </div>
        </div>

        {limitReached && (
          <div style={warningStyle}>
            <h3 style={{ margin: 0, fontSize: 20 }}>Plan limit reached</h3>
            <p style={{ margin: "8px 0 0", color: "#bfdbfe", fontSize: 16 }}>
              Your {plan} plan allows {limit} tools. Upgrade to add more SaaS
              tools.
            </p>
            <Link href="/pricing" style={upgradeButtonStyle}>
              View Plans
            </Link>
          </div>
        )}

        {error && <div style={errorStyle}>{error}</div>}

        <form onSubmit={addSoftware} style={formStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Software Name *</label>
            <input
              style={inputStyle}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Slack"
              disabled={limitReached}
            />
          </div>

          <div style={gridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Monthly Cost *</label>
              <input
                style={inputStyle}
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="300"
                type="number"
                disabled={limitReached}
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Billing Cycle *</label>
              <select
                style={inputStyle}
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value)}
                disabled={limitReached}
              >
                <option>Monthly</option>
                <option>Yearly</option>
                <option>Quarterly</option>
              </select>
            </div>
          </div>

          <div style={gridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Renewal Date *</label>
              <input
                style={inputStyle}
                value={renewalDate}
                onChange={(e) => setRenewalDate(e.target.value)}
                type="date"
                disabled={limitReached}
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Owner / Department *</label>
              <input
                style={inputStyle}
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Finance"
                disabled={limitReached}
              />
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Invoice URL</label>
            <input
              style={inputStyle}
              value={invoiceUrl}
              onChange={(e) => setInvoiceUrl(e.target.value)}
              placeholder="https://..."
              disabled={limitReached}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Notes</label>
            <textarea
              style={textareaStyle}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add renewal notes, contract info, seat count, or cancellation details..."
              disabled={limitReached}
            />
          </div>

          <button
            type="submit"
            style={{
              ...submitStyle,
              opacity: saving || limitReached ? 0.55 : 1,
              cursor: saving || limitReached ? "not-allowed" : "pointer",
            }}
            disabled={saving || limitReached}
          >
            {saving ? "Adding..." : "Add Software"}
          </button>
        </form>
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top right, rgba(37,99,235,0.22), transparent 35%), linear-gradient(135deg, #020617, #07142f)",
  color: "white",
  display: "flex",
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const sidebarStyle: React.CSSProperties = {
  width: 250,
  minHeight: "100vh",
  background: "rgba(15,23,42,0.82)",
  borderRight: "1px solid rgba(148,163,184,0.16)",
  padding: "28px 22px",
  position: "sticky",
  top: 0,
};

const logoStyle: React.CSSProperties = {
  fontSize: 36,
  margin: 0,
  fontWeight: 950,
};

const navStyle: React.CSSProperties = {
  marginTop: 54,
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

function navLink(active: boolean): React.CSSProperties {
  return {
    padding: "14px 18px",
    borderRadius: 14,
    background: active ? "white" : "transparent",
    color: active ? "black" : "#93c5fd",
    fontWeight: 900,
    fontSize: 18,
    textDecoration: "none",
  };
}

const contentStyle: React.CSSProperties = {
  flex: 1,
  padding: "28px 46px 70px",
};

const topBarStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const backStyle: React.CSSProperties = {
  color: "#60a5fa",
  textDecoration: "none",
  fontSize: 17,
  fontWeight: 900,
};

const logoutStyle: React.CSSProperties = {
  background: "white",
  color: "black",
  border: "none",
  borderRadius: 14,
  padding: "13px 22px",
  fontSize: 16,
  fontWeight: 900,
  cursor: "pointer",
};

const heroStyle: React.CSSProperties = {
  marginTop: 34,
  display: "flex",
  justifyContent: "space-between",
  gap: 26,
  alignItems: "center",
};

const eyebrowStyle: React.CSSProperties = {
  color: "#60a5fa",
  fontWeight: 950,
  fontSize: 20,
  margin: 0,
};

const titleStyle: React.CSSProperties = {
  fontSize: 54,
  lineHeight: 1,
  margin: "14px 0",
  fontWeight: 950,
};

const subtitleStyle: React.CSSProperties = {
  color: "#bfdbfe",
  fontSize: 20,
  lineHeight: 1.45,
  maxWidth: 680,
  margin: 0,
};

const planCardStyle: React.CSSProperties = {
  minWidth: 160,
  padding: 20,
  borderRadius: 18,
  background: "rgba(16,185,129,0.13)",
  border: "1px solid rgba(16,185,129,0.45)",
  textAlign: "center",
};

const planLabelStyle: React.CSSProperties = {
  margin: 0,
  color: "#4ade80",
  fontWeight: 950,
  fontSize: 13,
};

const planLimitStyle: React.CSSProperties = {
  margin: "6px 0",
  fontSize: 28,
  fontWeight: 950,
};

const planSmallStyle: React.CSSProperties = {
  margin: 0,
  color: "#bbf7d0",
  fontWeight: 800,
  fontSize: 14,
};

const warningStyle: React.CSSProperties = {
  marginTop: 28,
  padding: 20,
  borderRadius: 18,
  background: "rgba(251,191,36,0.13)",
  border: "1px solid rgba(251,191,36,0.4)",
};

const upgradeButtonStyle: React.CSSProperties = {
  display: "inline-block",
  marginTop: 14,
  padding: "11px 18px",
  borderRadius: 14,
  background: "white",
  color: "black",
  textDecoration: "none",
  fontWeight: 950,
  fontSize: 15,
};

const errorStyle: React.CSSProperties = {
  marginTop: 22,
  padding: "14px 18px",
  borderRadius: 14,
  background: "rgba(239,68,68,0.16)",
  border: "1px solid rgba(239,68,68,0.4)",
  color: "#fecaca",
  fontWeight: 900,
  fontSize: 15,
};

const formStyle: React.CSSProperties = {
  marginTop: 28,
  maxWidth: 860,
  padding: 26,
  borderRadius: 24,
  background: "rgba(15,23,42,0.82)",
  border: "1px solid rgba(148,163,184,0.2)",
  boxShadow: "0 24px 70px rgba(0,0,0,0.32)",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 20,
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 9,
  marginBottom: 18,
};

const labelStyle: React.CSSProperties = {
  color: "#93c5fd",
  fontSize: 15,
  fontWeight: 950,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "15px 17px",
  borderRadius: 15,
  border: "1px solid rgba(148,163,184,0.22)",
  background: "#020617",
  color: "white",
  fontSize: 16,
  outline: "none",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 105,
  resize: "vertical",
};

const submitStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 8,
  padding: "17px 22px",
  borderRadius: 18,
  border: "none",
  background: "white",
  color: "black",
  fontSize: 18,
  fontWeight: 950,
};

const loadingCardStyle: React.CSSProperties = {
  margin: "120px auto",
  width: 320,
  padding: 24,
  borderRadius: 20,
  background: "rgba(15,23,42,0.8)",
  border: "1px solid rgba(148,163,184,0.2)",
  textAlign: "center",
  fontSize: 18,
  fontWeight: 900,
};