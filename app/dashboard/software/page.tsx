"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

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

export default function SoftwarePage() {
  const [software, setSoftware] = useState<Software[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSoftware();
  }, []);

  async function loadSoftware() {
    setLoading(true);

    const { data, error } = await supabase
      .from("software")
      .select("*")
      .order("renewal_date", { ascending: true });

    if (error) {
      console.error(error);
      alert("Error loading software");
    } else {
      setSoftware(data || []);
    }

    setLoading(false);
  }

  async function deleteSoftware(id: number) {
    const confirmDelete = confirm("Are you sure you want to delete this software?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("software").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert("Delete failed");
      return;
    }

    setSoftware((prev) => prev.filter((item) => item.id !== id));
  }

  function getRenewalStatus(date: string) {
    const today = new Date();
    const renewalDate = new Date(date);

    today.setHours(0, 0, 0, 0);
    renewalDate.setHours(0, 0, 0, 0);

    const diffTime = renewalDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: "Expired",
        description: `${Math.abs(diffDays)} days late`,
        type: "expired",
      };
    }

    if (diffDays <= 30) {
      return {
        label: "Due Soon",
        description: `${diffDays} days left`,
        type: "soon",
      };
    }

    return {
      label: "Safe",
      description: `${diffDays} days left`,
      type: "safe",
    };
  }

  const monthlySpend = software.reduce((total, item) => {
    return total + Number(item.cost || 0);
  }, 0);

  const missingInvoices = software.filter((item) => !item.invoice_url).length;

  const dueSoonCount = software.filter((item) => {
    const status = getRenewalStatus(item.renewal_date);
    return status.type === "soon";
  }).length;

  return (
    <main style={pageStyle}>
      <aside style={sidebarStyle}>
        <h1 style={logoStyle}>Cobalt</h1>

        <p style={brandSubStyle}>Renewals</p>

        <nav style={navStyle}>
          <Link href="/dashboard" style={navLink(false)}>
            Dashboard
          </Link>

          <Link href="/dashboard/software" style={navLink(true)}>
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
        <header style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>SaaS Renewal + Invoice Tracker</p>

            <h1 style={titleStyle}>Tracked Software</h1>

            <p style={subtitleStyle}>
              Manage SaaS tools, renewal risk, invoices, owners, spend, and reminder emails.
            </p>
          </div>

          <Link href="/dashboard/add" style={addButtonStyle}>
            + Add Software
          </Link>
        </header>

        <section style={statsGridStyle}>
          <MiniCard title="Monthly Spend" value={`$${monthlySpend}`} />
          <MiniCard title="Tracked Tools" value={String(software.length)} />
          <MiniCard title="Due Soon" value={String(dueSoonCount)} />
          <MiniCard title="Missing Invoices" value={String(missingInvoices)} />
        </section>

        <section style={tableCardStyle}>
          <div style={tableHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Software List</h2>
              <p style={sectionTextStyle}>
                Live data from your Supabase software table.
              </p>
            </div>

            <span style={activeBadgeStyle}>{software.length} active</span>
          </div>

          <div style={tableHeadStyle}>
            <p>Name</p>
            <p>Cost</p>
            <p>Billing</p>
            <p>Renewal</p>
            <p>Status</p>
            <p>Owner</p>
            <p>Invoice</p>
            <p>Actions</p>
          </div>

          {loading && <div style={emptyStyle}>Loading software...</div>}

          {!loading && software.length === 0 && (
            <div style={emptyStyle}>
              No software added yet. Click “Add Software” to create your first SaaS record.
            </div>
          )}

          {!loading &&
            software.map((item) => {
              const status = getRenewalStatus(item.renewal_date);

              return (
                <div key={item.id} style={tableRowStyle}>
                  <div>
                    <p style={nameStyle}>{item.name}</p>
                    <p style={notesSmallStyle}>{item.notes || "No notes"}</p>
                  </div>

                  <p>${item.cost}</p>

                  <p style={{ textTransform: "capitalize" }}>
                    {item.billing_cycle}
                  </p>

                  <p>{item.renewal_date}</p>

                  <div>
                    <span style={statusBadgeStyle(status.type)}>
                      {status.label}
                    </span>
                    <p style={statusDescriptionStyle}>{status.description}</p>
                  </div>

                  <p style={{ textTransform: "capitalize" }}>{item.owner}</p>

                  <p>
                    {item.invoice_url ? (
                      <a
                        href={item.invoice_url}
                        target="_blank"
                        rel="noreferrer"
                        style={invoiceLinkStyle}
                      >
                        View Invoice
                      </a>
                    ) : (
                      <span style={missingInvoiceStyle}>Missing</span>
                    )}
                  </p>

                  <div style={actionStyle}>
                    <Link href={`/dashboard/edit/${item.id}`} style={editButtonStyle}>
                      Edit
                    </Link>

                    <Link href={`/dashboard/email/${item.id}`} style={emailButtonStyle}>
                      Email
                    </Link>

                    <button
                      onClick={() => deleteSoftware(item.id)}
                      style={deleteButtonStyle}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
        </section>
      </section>
    </main>
  );
}

function MiniCard({ title, value }: { title: string; value: string }) {
  return (
    <div style={miniCardStyle}>
      <p style={miniTitleStyle}>{title}</p>
      <h3 style={miniValueStyle}>{value}</h3>
    </div>
  );
}

function navLink(active: boolean) {
  return {
    padding: "18px 24px",
    borderRadius: 18,
    background: active ? "white" : "transparent",
    color: active ? "black" : "#93c5fd",
    fontWeight: 950,
    fontSize: 22,
    textDecoration: "none",
  };
}

function statusBadgeStyle(type: string) {
  let background = "rgba(34,197,94,0.15)";
  let color = "#4ade80";
  let border = "1px solid rgba(34,197,94,0.35)";

  if (type === "soon") {
    background = "rgba(250,204,21,0.14)";
    color = "#facc15";
    border = "1px solid rgba(250,204,21,0.35)";
  }

  if (type === "expired") {
    background = "rgba(239,68,68,0.15)";
    color = "#f87171";
    border = "1px solid rgba(248,113,113,0.35)";
  }

  return {
    display: "inline-block",
    background,
    color,
    border,
    padding: "10px 16px",
    borderRadius: 999,
    fontWeight: 950,
    fontSize: 16,
  };
}

const pageStyle = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top right, rgba(37,99,235,0.25), transparent 30%), radial-gradient(circle at bottom left, rgba(16,185,129,0.12), transparent 30%), #020617",
  color: "white",
  fontFamily: "Arial, sans-serif",
  display: "flex",
};

const sidebarStyle = {
  width: 305,
  minHeight: "100vh",
  background: "rgba(15,23,42,0.92)",
  borderRight: "1px solid rgba(255,255,255,0.1)",
  padding: 32,
  position: "fixed" as const,
  left: 0,
  top: 0,
};

const logoStyle = {
  fontSize: 38,
  margin: 0,
  fontWeight: 950,
};

const brandSubStyle = {
  color: "#60a5fa",
  fontWeight: 900,
  marginTop: 30,
  marginBottom: 70,
  fontSize: 22,
};

const navStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 24,
};

const contentStyle = {
  marginLeft: 305,
  width: "100%",
  padding: "48px 56px",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 24,
};

const eyebrowStyle = {
  color: "#60a5fa",
  fontSize: 24,
  fontWeight: 950,
  margin: 0,
};

const titleStyle = {
  fontSize: 74,
  lineHeight: 1,
  margin: "14px 0 20px",
  fontWeight: 950,
  letterSpacing: "-3px",
};

const subtitleStyle = {
  color: "#bfdbfe",
  fontSize: 25,
  margin: 0,
};

const addButtonStyle = {
  background: "white",
  color: "black",
  padding: "24px 34px",
  borderRadius: 22,
  fontSize: 22,
  fontWeight: 950,
  textDecoration: "none",
  boxShadow: "0 20px 70px rgba(96,165,250,0.25)",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 24,
  marginTop: 58,
};

const miniCardStyle = {
  background: "rgba(15,23,42,0.78)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 28,
  padding: 32,
};

const miniTitleStyle = {
  color: "#bfdbfe",
  fontSize: 20,
  margin: 0,
};

const miniValueStyle = {
  fontSize: 48,
  margin: "28px 0 0",
  fontWeight: 950,
};

const tableCardStyle = {
  marginTop: 52,
  background: "rgba(15,23,42,0.78)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 32,
  overflow: "hidden",
  boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
};

const tableHeaderStyle = {
  padding: "34px 38px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
};

const sectionTitleStyle = {
  fontSize: 34,
  margin: 0,
};

const sectionTextStyle = {
  color: "#bfdbfe",
  fontSize: 21,
  margin: "12px 0 0",
};

const activeBadgeStyle = {
  background: "rgba(16,185,129,0.15)",
  color: "#4ade80",
  padding: "14px 24px",
  borderRadius: 999,
  fontWeight: 950,
  fontSize: 20,
};

const tableHeadStyle = {
  display: "grid",
  gridTemplateColumns: "1.2fr 0.65fr 0.8fr 1fr 1fr 0.9fr 1fr 1.55fr",
  gap: 18,
  padding: "22px 38px",
  color: "#93c5fd",
  fontWeight: 950,
  fontSize: 18,
  borderBottom: "1px solid rgba(255,255,255,0.1)",
};

const tableRowStyle = {
  display: "grid",
  gridTemplateColumns: "1.2fr 0.65fr 0.8fr 1fr 1fr 0.9fr 1fr 1.55fr",
  gap: 18,
  padding: "26px 38px",
  alignItems: "center",
  fontSize: 18,
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const nameStyle = {
  fontWeight: 950,
  fontSize: 20,
  margin: 0,
  textTransform: "capitalize" as const,
};

const notesSmallStyle = {
  color: "#94a3b8",
  margin: "8px 0 0",
  fontSize: 15,
  lineHeight: 1.35,
};

const statusDescriptionStyle = {
  color: "#94a3b8",
  margin: "8px 0 0",
  fontSize: 14,
};

const invoiceLinkStyle = {
  color: "#60a5fa",
  fontWeight: 950,
  textDecoration: "none",
};

const missingInvoiceStyle = {
  color: "#f87171",
  fontWeight: 950,
};

const actionStyle = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap" as const,
};

const editButtonStyle = {
  background: "rgba(96,165,250,0.14)",
  color: "#60a5fa",
  border: "1px solid rgba(96,165,250,0.35)",
  padding: "13px 16px",
  borderRadius: 16,
  fontWeight: 950,
  textDecoration: "none",
  textAlign: "center" as const,
};

const emailButtonStyle = {
  background: "rgba(34,197,94,0.14)",
  color: "#4ade80",
  border: "1px solid rgba(34,197,94,0.35)",
  padding: "13px 16px",
  borderRadius: 16,
  fontWeight: 950,
  textDecoration: "none",
  textAlign: "center" as const,
};

const deleteButtonStyle = {
  background: "rgba(239,68,68,0.15)",
  color: "#f87171",
  border: "1px solid rgba(248,113,113,0.35)",
  padding: "13px 16px",
  borderRadius: 16,
  fontWeight: 950,
  cursor: "pointer",
  fontSize: 16,
};

const emptyStyle = {
  padding: 38,
  color: "#93c5fd",
  fontSize: 22,
};