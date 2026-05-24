"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type Software = {
  id: number;
  name: string;
  cost: number;
  billing_cycle: string;
  renewal_date: string;
  owner: string;
  invoice_url?: string | null;
  notes?: string | null;
};

export default function EmailWriterPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [software, setSoftware] = useState<Software | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [tone, setTone] = useState("professional");
  const [purpose, setPurpose] = useState("renewal_review");

  useEffect(() => {
    checkUser();
    fetchSoftware();
  }, []);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.push("/login");
    }
  }

  async function fetchSoftware() {
    setLoading(true);

    const { data, error } = await supabase
      .from("software")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.log(error);
      setSoftware(null);
    } else {
      setSoftware(data);
    }

    setLoading(false);
  }

  function getDaysLeft(dateString: string) {
    const today = new Date();
    const renewal = new Date(dateString);

    today.setHours(0, 0, 0, 0);
    renewal.setHours(0, 0, 0, 0);

    const diff = renewal.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  const emailData = useMemo(() => {
    if (!software) {
      return {
        subject: "",
        body: "",
      };
    }

    const daysLeft = getDaysLeft(software.renewal_date);

    let subject = "";
    let intro = "";
    let action = "";

    if (purpose === "renewal_review") {
      subject = `Renewal review needed for ${software.name}`;
      action =
        "Please review usage, invoices, and team need before the renewal date. We should decide whether to renew, cancel, downgrade, or renegotiate this subscription.";
    }

    if (purpose === "invoice_missing") {
      subject = `Invoice needed for ${software.name}`;
      action =
        "Please upload or share the missing invoice for this software subscription so our records stay complete.";
    }

    if (purpose === "cost_review") {
      subject = `Cost review needed for ${software.name}`;
      action =
        "Please review whether this software is still worth the current monthly cost and whether a cheaper plan is possible.";
    }

    if (purpose === "cancel_check") {
      subject = `Check if ${software.name} should be cancelled`;
      action =
        "Please check if this software is still being used. If it is no longer needed, we should cancel it before the renewal date.";
    }

    if (tone === "friendly") {
      intro = "Hi team,";
    } else if (tone === "urgent") {
      intro = "Hi team,\n\nThis needs attention soon.";
    } else {
      intro = "Hi team,";
    }

    const body = `${intro}

${software.name} needs a review.

Renewal date: ${software.renewal_date}
Days left: ${daysLeft}
Current cost: $${software.cost} / ${software.billing_cycle}
Owner/Department: ${software.owner}

${action}

Notes:
${software.notes || "No notes added."}

Thank you,`;

    return {
      subject,
      body,
    };
  }, [software, tone, purpose]);

  async function copyEmail() {
    const fullEmail = `Subject: ${emailData.subject}

${emailData.body}`;

    await navigator.clipboard.writeText(fullEmail);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  function openMailApp() {
    const mailtoLink = `mailto:?subject=${encodeURIComponent(
      emailData.subject
    )}&body=${encodeURIComponent(emailData.body)}`;

    window.location.href = mailtoLink;
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingCardStyle}>Loading email writer...</div>
      </main>
    );
  }

  if (!software) {
    return (
      <main style={pageStyle}>
        <Link href="/dashboard/software" style={backLinkStyle}>
          ← Back to Software
        </Link>

        <div style={errorCardStyle}>
          Software not found.
        </div>
      </main>
    );
  }

  const daysLeft = getDaysLeft(software.renewal_date);

  return (
    <main style={pageStyle}>
      <Link href="/dashboard/software" style={backLinkStyle}>
        ← Back to Software
      </Link>

      <section style={heroStyle}>
        <div>
          <p style={eyebrowStyle}>AI Email Writer</p>
          <h1 style={titleStyle}>Renewal Email Draft</h1>
          <p style={subtitleStyle}>
            Generate a clean email for renewal reviews, missing invoices, cost checks,
            or cancellation decisions.
          </p>
        </div>

        <div style={statusPillStyle}>
          {daysLeft <= 7
            ? "Urgent"
            : daysLeft <= 30
            ? "Coming soon"
            : `${daysLeft} days left`}
        </div>
      </section>

      <section style={gridStyle}>
        <div style={cardStyle}>
          <p style={sectionLabelStyle}>Software</p>
          <h2 style={softwareNameStyle}>{software.name}</h2>

          <div style={miniGridStyle}>
            <div style={miniCardStyle}>
              <span style={miniLabelStyle}>Cost</span>
              <strong>${software.cost}</strong>
            </div>

            <div style={miniCardStyle}>
              <span style={miniLabelStyle}>Billing</span>
              <strong>{software.billing_cycle}</strong>
            </div>

            <div style={miniCardStyle}>
              <span style={miniLabelStyle}>Owner</span>
              <strong>{software.owner}</strong>
            </div>

            <div style={miniCardStyle}>
              <span style={miniLabelStyle}>Renewal</span>
              <strong>{software.renewal_date}</strong>
            </div>
          </div>

          <div style={controlBoxStyle}>
            <label style={labelStyle}>Email Purpose</label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              style={selectStyle}
            >
              <option value="renewal_review">Renewal Review</option>
              <option value="invoice_missing">Missing Invoice</option>
              <option value="cost_review">Cost Review</option>
              <option value="cancel_check">Cancel Check</option>
            </select>

            <label style={labelStyle}>Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              style={selectStyle}
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={emailTopStyle}>
            <div>
              <p style={sectionLabelStyle}>Generated Email</p>
              <h2 style={emailTitleStyle}>Ready to copy</h2>
            </div>

            <span style={draftPillStyle}>AI Draft</span>
          </div>

          <div style={emailBoxStyle}>
            <p>
              <strong>Subject:</strong> {emailData.subject}
            </p>

            <pre style={emailPreStyle}>{emailData.body}</pre>
          </div>

          <div style={buttonRowStyle}>
            <button onClick={copyEmail} style={primaryButtonStyle}>
              {copied ? "Copied!" : "Copy Email"}
            </button>

            <button onClick={openMailApp} style={secondaryButtonStyle}>
              Open Mail App
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top right, rgba(37,99,235,0.25), transparent 34%), linear-gradient(135deg, #020617, #07112f)",
  color: "white",
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  padding: "34px 42px 80px",
};

const backLinkStyle: React.CSSProperties = {
  display: "inline-block",
  color: "#60a5fa",
  textDecoration: "none",
  fontWeight: 900,
  fontSize: 18,
  marginBottom: 36,
};

const heroStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 24,
  alignItems: "flex-start",
  marginBottom: 34,
};

const eyebrowStyle: React.CSSProperties = {
  color: "#60a5fa",
  fontWeight: 950,
  fontSize: 24,
  margin: 0,
};

const titleStyle: React.CSSProperties = {
  fontSize: 58,
  lineHeight: 1,
  margin: "18px 0",
  letterSpacing: "-2px",
};

const subtitleStyle: React.CSSProperties = {
  color: "#bfdbfe",
  fontSize: 23,
  lineHeight: 1.45,
  maxWidth: 900,
  margin: 0,
};

const statusPillStyle: React.CSSProperties = {
  background: "rgba(34,197,94,0.14)",
  border: "1px solid rgba(34,197,94,0.35)",
  color: "#4ade80",
  padding: "16px 24px",
  borderRadius: 999,
  fontWeight: 950,
  fontSize: 18,
  whiteSpace: "nowrap",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "0.9fr 1.25fr",
  gap: 28,
  alignItems: "start",
};

const cardStyle: React.CSSProperties = {
  background: "rgba(15,23,42,0.88)",
  border: "1px solid rgba(147,197,253,0.18)",
  borderRadius: 28,
  padding: 36,
  boxShadow: "0 24px 80px rgba(0,0,0,0.32)",
};

const sectionLabelStyle: React.CSSProperties = {
  color: "#60a5fa",
  fontWeight: 950,
  fontSize: 21,
  margin: 0,
};

const softwareNameStyle: React.CSSProperties = {
  fontSize: 48,
  margin: "22px 0 28px",
  fontWeight: 800,
};

const miniGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 18,
};

const miniCardStyle: React.CSSProperties = {
  background: "#020617",
  border: "1px solid rgba(147,197,253,0.12)",
  borderRadius: 22,
  padding: 22,
  display: "flex",
  flexDirection: "column",
  gap: 14,
  fontSize: 22,
};

const miniLabelStyle: React.CSSProperties = {
  color: "#93c5fd",
  fontSize: 16,
};

const controlBoxStyle: React.CSSProperties = {
  marginTop: 28,
  display: "grid",
  gap: 14,
};

const labelStyle: React.CSSProperties = {
  color: "#93c5fd",
  fontWeight: 900,
  fontSize: 18,
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "17px 18px",
  borderRadius: 18,
  border: "1px solid rgba(147,197,253,0.2)",
  background: "#020617",
  color: "white",
  fontSize: 18,
  outline: "none",
};

const emailTopStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 18,
  alignItems: "flex-start",
  marginBottom: 26,
};

const emailTitleStyle: React.CSSProperties = {
  fontSize: 42,
  margin: "14px 0 0",
  fontWeight: 800,
};

const draftPillStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 999,
  background: "rgba(59,130,246,0.18)",
  border: "1px solid rgba(96,165,250,0.35)",
  color: "#93c5fd",
  fontWeight: 950,
};

const emailBoxStyle: React.CSSProperties = {
  background: "#020617",
  border: "1px solid rgba(147,197,253,0.14)",
  borderRadius: 24,
  padding: 28,
  color: "#dbeafe",
  fontSize: 18,
  lineHeight: 1.6,
};

const emailPreStyle: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  fontFamily: "inherit",
  marginTop: 24,
  marginBottom: 0,
  color: "#dbeafe",
};

const buttonRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 18,
  marginTop: 26,
  flexWrap: "wrap",
};

const primaryButtonStyle: React.CSSProperties = {
  background: "white",
  color: "black",
  border: "none",
  borderRadius: 18,
  padding: "16px 24px",
  fontWeight: 950,
  fontSize: 18,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  background: "rgba(59,130,246,0.18)",
  color: "#bfdbfe",
  border: "1px solid rgba(96,165,250,0.35)",
  borderRadius: 18,
  padding: "16px 24px",
  fontWeight: 950,
  fontSize: 18,
  cursor: "pointer",
};

const loadingCardStyle: React.CSSProperties = {
  margin: "120px auto",
  width: 360,
  padding: 30,
  borderRadius: 24,
  background: "rgba(15,23,42,0.9)",
  border: "1px solid rgba(147,197,253,0.16)",
  textAlign: "center",
  fontSize: 22,
  fontWeight: 900,
};

const errorCardStyle: React.CSSProperties = {
  padding: 26,
  borderRadius: 22,
  background: "rgba(239,68,68,0.12)",
  border: "1px solid rgba(239,68,68,0.35)",
  color: "#fecaca",
  fontWeight: 900,
  fontSize: 22,
};