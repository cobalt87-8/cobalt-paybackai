"use client";

import { useEffect, useState } from "react";
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

export default function EditSoftwarePage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [billingCycle, setBillingCycle] = useState("Monthly");
  const [renewalDate, setRenewalDate] = useState("");
  const [owner, setOwner] = useState("");
  const [invoiceUrl, setInvoiceUrl] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function loadSoftware() {
      const { data, error } = await supabase
        .from("software")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        alert("Could not load software");
        setLoading(false);
        return;
      }

      const item = data as Software;

      setName(item.name || "");
      setCost(String(item.cost || ""));
      setBillingCycle(item.billing_cycle || "Monthly");
      setRenewalDate(item.renewal_date || "");
      setOwner(item.owner || "");
      setInvoiceUrl(item.invoice_url || "");
      setNotes(item.notes || "");
      setLoading(false);
    }

    loadSoftware();
  }, [id]);

  async function updateSoftware(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("software")
      .update({
        name,
        cost: Number(cost),
        billing_cycle: billingCycle,
        renewal_date: renewalDate,
        owner,
        invoice_url: invoiceUrl,
        notes,
      })
      .eq("id", id);

    setSaving(false);

    if (error) {
      alert("Update failed. Check Supabase columns.");
      return;
    }

    router.push("/dashboard/software");
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingCardStyle}>
          <h1 style={{ fontSize: 42, margin: 0 }}>Loading...</h1>
          <p style={{ color: "#93c5fd", fontSize: 20 }}>
            Getting your software data from Supabase.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={glowOneStyle}></div>
      <div style={glowTwoStyle}></div>

      <section style={shellStyle}>
        <aside style={sidePanelStyle}>
          <Link href="/dashboard/software" style={backLinkStyle}>
            ← Back to Software
          </Link>

          <div style={{ marginTop: 70 }}>
            <p style={smallBlueStyle}>Edit Software</p>
            <h1 style={titleStyle}>Update SaaS Tool</h1>
            <p style={subtitleStyle}>
              Change renewal date, cost, owner, invoice link, and notes.
            </p>
          </div>

          <div style={previewCardStyle}>
            <p style={{ color: "#93c5fd", fontWeight: 900, margin: 0 }}>
              Live Preview
            </p>

            <h2 style={{ fontSize: 36, margin: "18px 0 8px" }}>
              {name || "Software Name"}
            </h2>

            <p style={{ color: "#cbd5e1", fontSize: 18, margin: 0 }}>
              ${cost || "0"} / {billingCycle}
            </p>

            <div style={miniGridStyle}>
              <MiniStat label="Owner" value={owner || "Not set"} />
              <MiniStat label="Renewal" value={renewalDate || "No date"} />
              <MiniStat
                label="Invoice"
                value={invoiceUrl ? "Attached" : "Missing"}
              />
            </div>
          </div>
        </aside>

        <section style={formPanelStyle}>
          <div style={topBadgeStyle}>Cobalt Renewals</div>

          <form onSubmit={updateSoftware} style={formStyle}>
            <InputBox
              label="Software Name"
              placeholder="Slack"
              value={name}
              onChange={setName}
            />

            <InputBox
              label="Monthly Cost"
              placeholder="300"
              type="number"
              value={cost}
              onChange={setCost}
            />

            <div>
              <label style={labelStyle}>Billing Cycle</label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value)}
                style={inputStyle}
              >
                <option>Monthly</option>
                <option>Yearly</option>
                <option>Quarterly</option>
              </select>
            </div>

            <InputBox
              label="Renewal Date"
              type="date"
              placeholder=""
              value={renewalDate}
              onChange={setRenewalDate}
            />

            <InputBox
              label="Owner / Department"
              placeholder="Finance"
              value={owner}
              onChange={setOwner}
            />

            <InputBox
              label="Invoice / Contract Link"
              placeholder="https://example.com/invoice.pdf"
              value={invoiceUrl}
              onChange={setInvoiceUrl}
            />

            <div>
              <label style={labelStyle}>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Cancel before renewal or check unused seats"
                style={{
                  ...inputStyle,
                  height: 130,
                  resize: "none",
                  fontFamily: "Arial, sans-serif",
                }}
              />
            </div>

            <div style={buttonRowStyle}>
              <Link href="/dashboard/software" style={cancelButtonStyle}>
                Cancel
              </Link>

              <button type="submit" disabled={saving} style={saveButtonStyle}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}

function InputBox({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={label !== "Invoice / Contract Link" && label !== "Notes"}
        style={inputStyle}
      />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={miniStatStyle}>
      <p style={{ color: "#64748b", margin: 0, fontSize: 14 }}>{label}</p>
      <p
        style={{
          color: "white",
          margin: "8px 0 0",
          fontSize: 17,
          fontWeight: 900,
        }}
      >
        {value}
      </p>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(37,99,235,0.28), transparent 28%), radial-gradient(circle at bottom right, rgba(16,185,129,0.13), transparent 30%), #020617",
  color: "white",
  fontFamily: "Arial, sans-serif",
  position: "relative" as const,
  overflow: "hidden",
};

const glowOneStyle = {
  position: "absolute" as const,
  top: 80,
  right: 180,
  width: 320,
  height: 320,
  background: "rgba(59,130,246,0.18)",
  filter: "blur(90px)",
  borderRadius: "999px",
};

const glowTwoStyle = {
  position: "absolute" as const,
  bottom: 100,
  left: 120,
  width: 280,
  height: 280,
  background: "rgba(34,197,94,0.12)",
  filter: "blur(90px)",
  borderRadius: "999px",
};

const shellStyle = {
  position: "relative" as const,
  zIndex: 2,
  display: "grid",
  gridTemplateColumns: "420px 1fr",
  minHeight: "100vh",
};

const sidePanelStyle = {
  padding: "42px",
  borderRight: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(15,23,42,0.7)",
  backdropFilter: "blur(18px)",
};

const formPanelStyle = {
  padding: "52px 70px",
};

const backLinkStyle = {
  color: "#60a5fa",
  textDecoration: "none",
  fontSize: 22,
  fontWeight: 900,
};

const smallBlueStyle = {
  color: "#60a5fa",
  fontWeight: 900,
  fontSize: 22,
  margin: 0,
};

const titleStyle = {
  fontSize: 68,
  lineHeight: 1,
  margin: "22px 0",
  letterSpacing: "-3px",
};

const subtitleStyle = {
  color: "#bfdbfe",
  fontSize: 22,
  lineHeight: 1.5,
};

const previewCardStyle = {
  marginTop: 70,
  padding: 28,
  borderRadius: 28,
  border: "1px solid rgba(255,255,255,0.12)",
  background:
    "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.7))",
  boxShadow: "0 30px 90px rgba(0,0,0,0.35)",
};

const miniGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 14,
  marginTop: 26,
};

const miniStatStyle = {
  padding: 18,
  borderRadius: 18,
  background: "rgba(2,6,23,0.75)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const topBadgeStyle = {
  display: "inline-block",
  padding: "12px 18px",
  borderRadius: 999,
  background: "rgba(96,165,250,0.12)",
  border: "1px solid rgba(96,165,250,0.25)",
  color: "#60a5fa",
  fontWeight: 900,
  marginBottom: 34,
};

const formStyle = {
  maxWidth: 900,
  padding: 42,
  borderRadius: 34,
  background:
    "linear-gradient(135deg, rgba(15,23,42,0.92), rgba(2,6,23,0.92))",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 40px 120px rgba(0,0,0,0.45)",
  display: "grid",
  gap: 26,
};

const labelStyle = {
  display: "block",
  color: "#93c5fd",
  fontSize: 17,
  fontWeight: 900,
  marginBottom: 10,
};

const inputStyle = {
  width: "100%",
  background: "rgba(2,6,23,0.92)",
  color: "white",
  border: "1px solid rgba(148,163,184,0.25)",
  borderRadius: 18,
  padding: "20px 24px",
  outline: "none",
  fontSize: 20,
  boxSizing: "border-box" as const,
};

const buttonRowStyle = {
  display: "flex",
  gap: 18,
  marginTop: 16,
};

const cancelButtonStyle = {
  flex: 1,
  padding: "22px 28px",
  borderRadius: 20,
  textAlign: "center" as const,
  textDecoration: "none",
  color: "#93c5fd",
  border: "1px solid rgba(96,165,250,0.25)",
  background: "rgba(15,23,42,0.7)",
  fontSize: 20,
  fontWeight: 900,
};

const saveButtonStyle = {
  flex: 1,
  padding: "22px 28px",
  borderRadius: 20,
  border: "none",
  background: "white",
  color: "black",
  fontSize: 20,
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 20px 60px rgba(96,165,250,0.25)",
};

const loadingCardStyle = {
  margin: 50,
  padding: 40,
  borderRadius: 28,
  background: "rgba(15,23,42,0.9)",
  border: "1px solid rgba(255,255,255,0.12)",
};