"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function FinanceReportPage() {
  const router = useRouter();

  const [software, setSoftware] = useState<Software[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function start() {
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
        .order("cost", { ascending: false });

      if (error) {
        console.log(error.message);
        setSoftware([]);
      } else {
        setSoftware(data || []);
      }

      setLoading(false);
    }

    start();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function getMonthlyCost(item: Software) {
    const cost = Number(item.cost || 0);
    const cycle = item.billing_cycle?.toLowerCase();

    if (cycle === "yearly" || cycle === "annual" || cycle === "annually") {
      return cost / 12;
    }

    if (cycle === "quarterly") {
      return cost / 3;
    }

    return cost;
  }

  function getDaysLeft(dateValue: string) {
    const today = new Date();
    const renewalDate = new Date(dateValue);

    today.setHours(0, 0, 0, 0);
    renewalDate.setHours(0, 0, 0, 0);

    const diff = renewalDate.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  const report = useMemo(() => {
    const monthlySpend = software.reduce((sum, item) => {
      return sum + getMonthlyCost(item);
    }, 0);

    const yearlySpend = monthlySpend * 12;

    const missingInvoiceTools = software.filter((item) => !item.invoice_url);

    const missingInvoiceSpend = missingInvoiceTools.reduce((sum, item) => {
      return sum + getMonthlyCost(item);
    }, 0);

    const upcomingRenewals = software.filter((item) => {
      const days = getDaysLeft(item.renewal_date);
      return days >= 0 && days <= 30;
    });

    const upcomingRenewalSpend = upcomingRenewals.reduce((sum, item) => {
      return sum + getMonthlyCost(item);
    }, 0);

    const mostExpensive = [...software].sort((a, b) => {
      return getMonthlyCost(b) - getMonthlyCost(a);
    })[0];

    const expiredTools = software.filter((item) => {
      return getDaysLeft(item.renewal_date) < 0;
    });

    return {
      monthlySpend,
      yearlySpend,
      missingInvoiceTools,
      missingInvoiceSpend,
      upcomingRenewals,
      upcomingRenewalSpend,
      mostExpensive,
      expiredTools,
    };
  }, [software]);

  function exportFinanceReport() {
    if (software.length === 0) {
      alert("No data to export.");
      return;
    }

    const summaryRows = [
      ["Metric", "Value"],
      ["Total Tools", software.length],
      ["Monthly Spend", `$${Math.round(report.monthlySpend)}`],
      ["Yearly Spend", `$${Math.round(report.yearlySpend)}`],
      ["Missing Invoices", report.missingInvoiceTools.length],
      ["Missing Invoice Monthly Spend", `$${Math.round(report.missingInvoiceSpend)}`],
      ["Upcoming Renewals", report.upcomingRenewals.length],
      ["Expired Tools", report.expiredTools.length],
      ["Most Expensive Tool", report.mostExpensive?.name || "None"],
    ];

    const csvContent = summaryRows
      .map((row) =>
        row
          .map((value) => {
            const safeValue = String(value).replaceAll('"', '""');
            return `"${safeValue}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "cobalt-finance-report.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingCardStyle}>Loading finance report...</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <aside style={sidebarStyle}>
        <Link href="/" style={brandStyle}>
          Cobalt
        </Link>

        <nav style={navStyle}>
          <Link href="/dashboard" style={navLinkStyle}>
            Dashboard
          </Link>

          <Link href="/dashboard/software" style={navLinkStyle}>
            Software
          </Link>

          <Link href="/dashboard/invoices" style={navLinkStyle}>
            Invoices
          </Link>

          <Link href="/dashboard/renewals" style={navLinkStyle}>
            Renewals
          </Link>

          <Link href="/dashboard/report" style={activeNavStyle}>
            Finance Report
          </Link>
        </nav>
      </aside>

      <section style={contentStyle}>
        <header style={topBarStyle}>
          <div>
            <p style={eyebrowStyle}>Finance Intelligence</p>

            <h1 style={titleStyle}>Finance Report</h1>

            <p style={subtitleStyle}>
              A clean spend summary for finance teams to review SaaS cost,
              invoices, renewals, and waste.
            </p>
          </div>

          <div style={topActionsStyle}>
            <button onClick={exportFinanceReport} style={exportButtonStyle}>
              Export Report
            </button>

            <button onClick={logout} style={logoutButtonStyle}>
              Logout
            </button>
          </div>
        </header>

        <section style={statsGridStyle}>
          <div style={statCardStyle}>
            <p style={statLabelStyle}>Monthly Spend</p>
            <h2 style={statValueStyle}>${Math.round(report.monthlySpend)}</h2>
            <p style={greenTextStyle}>Estimated SaaS spend</p>
          </div>

          <div style={statCardStyle}>
            <p style={statLabelStyle}>Yearly Spend</p>
            <h2 style={statValueStyle}>${Math.round(report.yearlySpend)}</h2>
            <p style={greenTextStyle}>Projected annually</p>
          </div>

          <div style={statCardStyle}>
            <p style={statLabelStyle}>Missing Invoices</p>
            <h2 style={statValueStyle}>{report.missingInvoiceTools.length}</h2>
            <p style={warningTextStyle}>Needs finance review</p>
          </div>

          <div style={statCardStyle}>
            <p style={statLabelStyle}>Upcoming Renewals</p>
            <h2 style={statValueStyle}>{report.upcomingRenewals.length}</h2>
            <p style={warningTextStyle}>Next 30 days</p>
          </div>
        </section>

        <section style={insightGridStyle}>
          <div style={insightCardStyle}>
            <p style={sectionLabelStyle}>Most Expensive Tool</p>

            {report.mostExpensive ? (
              <>
                <h2 style={insightTitleStyle}>{report.mostExpensive.name}</h2>
                <p style={insightTextStyle}>
                  Monthly estimate: ${Math.round(getMonthlyCost(report.mostExpensive))}
                </p>
                <p style={insightTextStyle}>
                  Owner: {report.mostExpensive.owner}
                </p>
              </>
            ) : (
              <p style={insightTextStyle}>No software added yet.</p>
            )}
          </div>

          <div style={insightCardStyle}>
            <p style={sectionLabelStyle}>Invoice Risk</p>

            <h2 style={insightTitleStyle}>
              ${Math.round(report.missingInvoiceSpend)}
            </h2>

            <p style={insightTextStyle}>
              Monthly spend connected to software without invoice links.
            </p>
          </div>

          <div style={insightCardStyle}>
            <p style={sectionLabelStyle}>Renewal Risk</p>

            <h2 style={insightTitleStyle}>
              ${Math.round(report.upcomingRenewalSpend)}
            </h2>

            <p style={insightTextStyle}>
              Monthly value of tools renewing in the next 30 days.
            </p>
          </div>
        </section>

        <section style={tableCardStyle}>
          <div style={tableHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Finance Review List</h2>
              <p style={sectionSubtitleStyle}>
                Highest monthly cost tools appear first.
              </p>
            </div>

            <span style={activePillStyle}>{software.length} tools</span>
          </div>

          {software.length === 0 ? (
            <div style={emptyStyle}>
              <h3 style={emptyTitleStyle}>No report data yet</h3>
              <p style={emptyTextStyle}>
                Add software tools to generate a finance report.
              </p>

              <Link href="/dashboard/add" style={emptyButtonStyle}>
                + Add Software
              </Link>
            </div>
          ) : (
            <div style={tableScrollStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Software</th>
                    <th style={thStyle}>Monthly Cost</th>
                    <th style={thStyle}>Yearly Cost</th>
                    <th style={thStyle}>Owner</th>
                    <th style={thStyle}>Renewal</th>
                    <th style={thStyle}>Invoice</th>
                    <th style={thStyle}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {[...software]
                    .sort((a, b) => getMonthlyCost(b) - getMonthlyCost(a))
                    .map((item) => {
                      const monthly = getMonthlyCost(item);

                      return (
                        <tr key={item.id} style={trStyle}>
                          <td style={tdBoldStyle}>{item.name}</td>
                          <td style={tdStyle}>${Math.round(monthly)}</td>
                          <td style={tdStyle}>${Math.round(monthly * 12)}</td>
                          <td style={tdStyle}>{item.owner}</td>
                          <td style={tdStyle}>{item.renewal_date}</td>

                          <td style={tdStyle}>
                            {item.invoice_url ? (
                              <span style={goodBadgeStyle}>Available</span>
                            ) : (
                              <span style={badBadgeStyle}>Missing</span>
                            )}
                          </td>

                          <td style={tdStyle}>
                            <Link
                              href={`/dashboard/edit/${item.id}`}
                              style={editButtonStyle}
                            >
                              Review
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  background:
    "radial-gradient(circle at top right, rgba(37,99,235,0.25), transparent 34%), linear-gradient(135deg, #020617, #07112e)",
  color: "white",
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const sidebarStyle: React.CSSProperties = {
  width: 270,
  minHeight: "100vh",
  background: "rgba(15,23,42,0.86)",
  borderRight: "1px solid rgba(148,163,184,0.18)",
  padding: "34px 24px",
  position: "sticky",
  top: 0,
};

const brandStyle: React.CSSProperties = {
  display: "block",
  color: "white",
  fontSize: 34,
  fontWeight: 1000,
  textDecoration: "none",
  marginBottom: 54,
};

const navStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const navLinkStyle: React.CSSProperties = {
  color: "#93c5fd",
  textDecoration: "none",
  fontSize: 20,
  fontWeight: 900,
  padding: "15px 17px",
  borderRadius: 18,
};

const activeNavStyle: React.CSSProperties = {
  color: "black",
  background: "white",
  textDecoration: "none",
  fontSize: 20,
  fontWeight: 950,
  padding: "15px 17px",
  borderRadius: 18,
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  padding: "42px 46px 80px",
};

const topBarStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 28,
  alignItems: "flex-start",
  marginBottom: 42,
};

const eyebrowStyle: React.CSSProperties = {
  color: "#60a5fa",
  fontSize: 26,
  fontWeight: 1000,
  margin: "0 0 18px",
};

const titleStyle: React.CSSProperties = {
  fontSize: 68,
  lineHeight: 1,
  margin: 0,
  fontWeight: 1000,
};

const subtitleStyle: React.CSSProperties = {
  color: "#bfdbfe",
  fontSize: 24,
  lineHeight: 1.45,
  maxWidth: 760,
  marginTop: 20,
};

const topActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 16,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const exportButtonStyle: React.CSSProperties = {
  background: "white",
  color: "black",
  border: "none",
  padding: "18px 24px",
  borderRadius: 22,
  fontSize: 20,
  fontWeight: 1000,
  cursor: "pointer",
};

const logoutButtonStyle: React.CSSProperties = {
  background: "rgba(244,63,94,0.16)",
  color: "#fecaca",
  border: "1px solid rgba(244,63,94,0.38)",
  padding: "18px 24px",
  borderRadius: 22,
  fontSize: 20,
  fontWeight: 1000,
  cursor: "pointer",
};

const statsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
  gap: 20,
  marginBottom: 34,
};

const statCardStyle: React.CSSProperties = {
  background: "rgba(15,23,42,0.78)",
  border: "1px solid rgba(148,163,184,0.2)",
  borderRadius: 26,
  padding: 28,
  minHeight: 165,
};

const statLabelStyle: React.CSSProperties = {
  color: "#bfdbfe",
  fontSize: 19,
  margin: 0,
};

const statValueStyle: React.CSSProperties = {
  fontSize: 48,
  margin: "24px 0 16px",
  fontWeight: 850,
};

const greenTextStyle: React.CSSProperties = {
  color: "#4ade80",
  fontSize: 18,
  fontWeight: 1000,
  margin: 0,
};

const warningTextStyle: React.CSSProperties = {
  color: "#fcd34d",
  fontSize: 18,
  fontWeight: 1000,
  margin: 0,
};

const insightGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 22,
  marginBottom: 34,
};

const insightCardStyle: React.CSSProperties = {
  background: "rgba(15,23,42,0.78)",
  border: "1px solid rgba(148,163,184,0.2)",
  borderRadius: 26,
  padding: 28,
};

const sectionLabelStyle: React.CSSProperties = {
  color: "#60a5fa",
  fontSize: 18,
  fontWeight: 1000,
  margin: 0,
};

const insightTitleStyle: React.CSSProperties = {
  fontSize: 34,
  margin: "20px 0 14px",
  fontWeight: 950,
};

const insightTextStyle: React.CSSProperties = {
  color: "#bfdbfe",
  fontSize: 18,
  lineHeight: 1.45,
  margin: "8px 0",
};

const tableCardStyle: React.CSSProperties = {
  background: "rgba(15,23,42,0.76)",
  border: "1px solid rgba(148,163,184,0.22)",
  borderRadius: 28,
  overflow: "hidden",
};

const tableHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 20,
  padding: "34px 38px",
  borderBottom: "1px solid rgba(148,163,184,0.16)",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 38,
  margin: 0,
  fontWeight: 900,
};

const sectionSubtitleStyle: React.CSSProperties = {
  color: "#bfdbfe",
  fontSize: 20,
  margin: "12px 0 0",
};

const activePillStyle: React.CSSProperties = {
  background: "rgba(34,197,94,0.18)",
  color: "#4ade80",
  padding: "13px 22px",
  borderRadius: 999,
  fontSize: 17,
  fontWeight: 1000,
};

const tableScrollStyle: React.CSSProperties = {
  overflowX: "auto",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 1000,
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  color: "#93c5fd",
  padding: "22px 26px",
  fontSize: 18,
  fontWeight: 1000,
  borderBottom: "1px solid rgba(148,163,184,0.16)",
};

const trStyle: React.CSSProperties = {
  borderBottom: "1px solid rgba(148,163,184,0.12)",
};

const tdStyle: React.CSSProperties = {
  padding: "24px 26px",
  color: "white",
  fontSize: 17,
  verticalAlign: "middle",
};

const tdBoldStyle: React.CSSProperties = {
  ...tdStyle,
  fontWeight: 1000,
};

const goodBadgeStyle: React.CSSProperties = {
  background: "rgba(34,197,94,0.16)",
  color: "#4ade80",
  border: "1px solid rgba(34,197,94,0.35)",
  padding: "8px 12px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 950,
};

const badBadgeStyle: React.CSSProperties = {
  background: "rgba(239,68,68,0.14)",
  color: "#fca5a5",
  border: "1px solid rgba(239,68,68,0.35)",
  padding: "8px 12px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 950,
};

const editButtonStyle: React.CSSProperties = {
  background: "rgba(59,130,246,0.18)",
  color: "#60a5fa",
  border: "1px solid rgba(96,165,250,0.36)",
  padding: "11px 16px",
  borderRadius: 14,
  fontWeight: 1000,
  textDecoration: "none",
};

const emptyStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "70px 24px",
};

const emptyTitleStyle: React.CSSProperties = {
  fontSize: 34,
  margin: 0,
};

const emptyTextStyle: React.CSSProperties = {
  color: "#bfdbfe",
  fontSize: 20,
  margin: "14px 0 28px",
};

const emptyButtonStyle: React.CSSProperties = {
  display: "inline-block",
  background: "white",
  color: "black",
  textDecoration: "none",
  padding: "16px 24px",
  borderRadius: 18,
  fontWeight: 1000,
  fontSize: 18,
};

const loadingCardStyle: React.CSSProperties = {
  margin: "140px auto",
  width: 360,
  padding: 32,
  borderRadius: 24,
  background: "rgba(15,23,42,0.78)",
  border: "1px solid rgba(148,163,184,0.22)",
  textAlign: "center",
  fontSize: 22,
  fontWeight: 900,
};