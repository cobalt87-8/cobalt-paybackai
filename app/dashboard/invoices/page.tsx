"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function InvoicesPage() {
  const router = useRouter();

  const [software, setSoftware] = useState<Software[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    checkUserAndFetch();
  }, []);

  async function checkUserAndFetch() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("software")
      .select("*")
      .eq("user_id", user.id)
      .order("renewal_date", { ascending: true });

    if (error) {
      console.log(error.message);
    } else {
      setSoftware(data || []);
    }

    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const filteredSoftware = software.filter((item) => {
    const text = `${item.name} ${item.owner} ${item.billing_cycle}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const totalInvoices = software.filter((item) => item.invoice_url).length;
  const missingInvoices = software.filter((item) => !item.invoice_url).length;

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingCardStyle}>Loading invoices...</div>
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
          <Link href="/dashboard/invoices" style={navLink(true)}>
            Invoices
          </Link>
          <Link href="/dashboard/renewals" style={navLink(false)}>
            Renewals
          </Link>
        </nav>
      </aside>

      <section style={contentStyle}>
        <div style={topBarStyle}>
          <div>
            <p style={eyebrowStyle}>Invoice Center</p>
            <h2 style={titleStyle}>Invoices</h2>
            <p style={subtitleStyle}>
              Track uploaded invoice links, missing invoices, and subscription
              records.
            </p>
          </div>

          <div style={topActionsStyle}>
            <Link href="/dashboard/add" style={addButtonStyle}>
              + Add Software
            </Link>

            <button onClick={logout} style={logoutButtonStyle}>
              Logout
            </button>
          </div>
        </div>

        <div style={statsGridStyle}>
          <div style={statCardStyle}>
            <p style={statLabelStyle}>Total Tools</p>
            <h3 style={statNumberStyle}>{software.length}</h3>
            <p style={statGreenStyle}>Tracked in Supabase</p>
          </div>

          <div style={statCardStyle}>
            <p style={statLabelStyle}>Invoices Added</p>
            <h3 style={statNumberStyle}>{totalInvoices}</h3>
            <p style={statGreenStyle}>Ready to view</p>
          </div>

          <div style={statCardStyle}>
            <p style={statLabelStyle}>Missing Invoices</p>
            <h3 style={statNumberStyle}>{missingInvoices}</h3>
            <p style={missingTextStyle}>Needs fixing</p>
          </div>
        </div>

        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <h3 style={panelTitleStyle}>Invoice List</h3>
              <p style={panelTextStyle}>
                Search and open invoice links for your SaaS tools.
              </p>
            </div>

            <div style={badgeStyle}>{missingInvoices} missing</div>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoices by software, owner, or billing..."
            style={searchStyle}
          />

          {filteredSoftware.length === 0 ? (
            <div style={emptyStyle}>
              No invoices found. Add software or try another search.
            </div>
          ) : (
            <div style={tableWrapStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Software</th>
                    <th style={thStyle}>Owner</th>
                    <th style={thStyle}>Cost</th>
                    <th style={thStyle}>Billing</th>
                    <th style={thStyle}>Renewal</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSoftware.map((item) => (
                    <tr key={item.id} style={rowStyle}>
                      <td style={tdNameStyle}>{item.name}</td>
                      <td style={tdStyle}>{item.owner}</td>
                      <td style={tdStyle}>${item.cost}</td>
                      <td style={tdStyle}>{item.billing_cycle}</td>
                      <td style={tdStyle}>{item.renewal_date}</td>

                      <td style={tdStyle}>
                        {item.invoice_url ? (
                          <span style={successBadgeStyle}>Invoice added</span>
                        ) : (
                          <span style={dangerBadgeStyle}>Missing invoice</span>
                        )}
                      </td>

                      <td style={tdStyle}>
                        {item.invoice_url ? (
                          <a
                            href={item.invoice_url}
                            target="_blank"
                            rel="noreferrer"
                            style={viewButtonStyle}
                          >
                            View Invoice
                          </a>
                        ) : (
                          <Link
                            href={`/dashboard/edit/${item.id}`}
                            style={fixButtonStyle}
                          >
                            Add Invoice
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top right, rgba(37,99,235,0.26), transparent 35%), linear-gradient(135deg, #020617, #071733)",
  color: "white",
  display: "flex",
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const sidebarStyle: React.CSSProperties = {
  width: 320,
  minHeight: "100vh",
  background: "rgba(15,23,42,0.86)",
  borderRight: "1px solid rgba(148,163,184,0.18)",
  padding: "34px 28px",
  position: "sticky",
  top: 0,
};

const logoStyle: React.CSSProperties = {
  fontSize: 42,
  fontWeight: 950,
  margin: "0 0 56px",
};

const navStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 24,
};

function navLink(active: boolean): React.CSSProperties {
  return {
    padding: "18px 22px",
    borderRadius: 18,
    background: active ? "white" : "transparent",
    color: active ? "black" : "#93c5fd",
    fontWeight: 950,
    fontSize: 24,
    textDecoration: "none",
  };
}

const contentStyle: React.CSSProperties = {
  flex: 1,
  padding: "44px 52px 80px",
};

const topBarStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 30,
  marginBottom: 42,
};

const eyebrowStyle: React.CSSProperties = {
  color: "#60a5fa",
  fontSize: 28,
  fontWeight: 950,
  margin: "0 0 16px",
};

const titleStyle: React.CSSProperties = {
  fontSize: 74,
  lineHeight: 1,
  fontWeight: 950,
  margin: 0,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 26,
  lineHeight: 1.45,
  color: "#bfdbfe",
  maxWidth: 720,
  marginTop: 22,
};

const topActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 18,
  alignItems: "center",
};

const addButtonStyle: React.CSSProperties = {
  background: "white",
  color: "black",
  padding: "22px 34px",
  borderRadius: 24,
  fontSize: 24,
  fontWeight: 950,
  textDecoration: "none",
  boxShadow: "0 18px 60px rgba(37,99,235,0.20)",
};

const logoutButtonStyle: React.CSSProperties = {
  background: "rgba(127,29,29,0.35)",
  color: "#fecaca",
  border: "1px solid rgba(248,113,113,0.45)",
  padding: "22px 34px",
  borderRadius: 24,
  fontSize: 24,
  fontWeight: 950,
  cursor: "pointer",
};

const statsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 24,
  marginBottom: 42,
};

const statCardStyle: React.CSSProperties = {
  background: "rgba(15,23,42,0.82)",
  border: "1px solid rgba(148,163,184,0.20)",
  borderRadius: 28,
  padding: 34,
  minHeight: 190,
};

const statLabelStyle: React.CSSProperties = {
  color: "#bfdbfe",
  fontSize: 24,
  margin: 0,
};

const statNumberStyle: React.CSSProperties = {
  fontSize: 58,
  fontWeight: 800,
  margin: "34px 0 18px",
};

const statGreenStyle: React.CSSProperties = {
  color: "#4ade80",
  fontSize: 24,
  fontWeight: 950,
  margin: 0,
};

const missingTextStyle: React.CSSProperties = {
  color: "#fca5a5",
  fontSize: 24,
  fontWeight: 950,
  margin: 0,
};

const panelStyle: React.CSSProperties = {
  background: "rgba(15,23,42,0.88)",
  border: "1px solid rgba(148,163,184,0.20)",
  borderRadius: 30,
  overflow: "hidden",
};

const panelHeaderStyle: React.CSSProperties = {
  padding: "34px 38px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1px solid rgba(148,163,184,0.18)",
};

const panelTitleStyle: React.CSSProperties = {
  fontSize: 38,
  margin: "0 0 10px",
};

const panelTextStyle: React.CSSProperties = {
  color: "#bfdbfe",
  fontSize: 22,
  margin: 0,
};

const badgeStyle: React.CSSProperties = {
  background: "rgba(127,29,29,0.45)",
  color: "#fecaca",
  padding: "16px 24px",
  borderRadius: 999,
  fontSize: 20,
  fontWeight: 950,
  border: "1px solid rgba(248,113,113,0.40)",
};

const searchStyle: React.CSSProperties = {
  width: "calc(100% - 76px)",
  margin: "30px 38px",
  padding: "20px 22px",
  borderRadius: 18,
  border: "1px solid rgba(148,163,184,0.24)",
  background: "#020617",
  color: "white",
  fontSize: 20,
  outline: "none",
};

const tableWrapStyle: React.CSSProperties = {
  overflowX: "auto",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  color: "#93c5fd",
  fontSize: 21,
  fontWeight: 950,
  padding: "24px 38px",
  borderTop: "1px solid rgba(148,163,184,0.14)",
  borderBottom: "1px solid rgba(148,163,184,0.14)",
};

const rowStyle: React.CSSProperties = {
  borderBottom: "1px solid rgba(148,163,184,0.12)",
};

const tdStyle: React.CSSProperties = {
  padding: "28px 38px",
  fontSize: 20,
  color: "white",
  verticalAlign: "middle",
};

const tdNameStyle: React.CSSProperties = {
  padding: "28px 38px",
  fontSize: 22,
  fontWeight: 950,
  color: "white",
};

const successBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  background: "rgba(34,197,94,0.16)",
  color: "#4ade80",
  border: "1px solid rgba(34,197,94,0.35)",
  padding: "10px 14px",
  borderRadius: 999,
  fontWeight: 950,
};

const dangerBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  background: "rgba(239,68,68,0.14)",
  color: "#fca5a5",
  border: "1px solid rgba(239,68,68,0.35)",
  padding: "10px 14px",
  borderRadius: 999,
  fontWeight: 950,
};

const viewButtonStyle: React.CSSProperties = {
  display: "inline-block",
  background: "rgba(59,130,246,0.18)",
  color: "#60a5fa",
  border: "1px solid rgba(96,165,250,0.38)",
  padding: "13px 18px",
  borderRadius: 16,
  fontWeight: 950,
  textDecoration: "none",
};

const fixButtonStyle: React.CSSProperties = {
  display: "inline-block",
  background: "rgba(34,197,94,0.15)",
  color: "#4ade80",
  border: "1px solid rgba(34,197,94,0.35)",
  padding: "13px 18px",
  borderRadius: 16,
  fontWeight: 950,
  textDecoration: "none",
};

const emptyStyle: React.CSSProperties = {
  margin: "0 38px 38px",
  background: "rgba(2,6,23,0.75)",
  border: "1px solid rgba(148,163,184,0.18)",
  borderRadius: 22,
  padding: 34,
  color: "#bfdbfe",
  fontSize: 22,
  fontWeight: 800,
};

const loadingCardStyle: React.CSSProperties = {
  margin: "120px auto",
  width: 360,
  padding: 30,
  borderRadius: 24,
  background: "rgba(15,23,42,0.9)",
  border: "1px solid rgba(148,163,184,0.20)",
  textAlign: "center",
  fontSize: 24,
  fontWeight: 900,
};