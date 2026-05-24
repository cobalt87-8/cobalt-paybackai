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

export default function RenewalsPage() {
  const router = useRouter();

  const [software, setSoftware] = useState<Software[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("all");

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
        .order("renewal_date", { ascending: true });

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

  function getDaysLeft(dateValue: string) {
    const today = new Date();
    const renewalDate = new Date(dateValue);

    today.setHours(0, 0, 0, 0);
    renewalDate.setHours(0, 0, 0, 0);

    const diff = renewalDate.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function getStatus(dateValue: string) {
    const days = getDaysLeft(dateValue);

    if (days < 0) {
      return {
        text: "Expired",
        style: dangerBadgeStyle,
      };
    }

    if (days === 0) {
      return {
        text: "Due today",
        style: warningBadgeStyle,
      };
    }

    if (days <= 7) {
      return {
        text: `${days} days left`,
        style: dangerBadgeStyle,
      };
    }

    if (days <= 30) {
      return {
        text: `${days} days left`,
        style: warningBadgeStyle,
      };
    }

    return {
      text: `${days} days left`,
      style: safeBadgeStyle,
    };
  }

  function getMonthName(dateValue: string) {
    const date = new Date(dateValue);

    return date.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
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

  const months = useMemo(() => {
    const uniqueMonths = Array.from(
      new Set(software.map((item) => getMonthName(item.renewal_date)))
    );

    return uniqueMonths;
  }, [software]);

  const filteredSoftware = useMemo(() => {
    if (selectedMonth === "all") return software;

    return software.filter((item) => {
      return getMonthName(item.renewal_date) === selectedMonth;
    });
  }, [software, selectedMonth]);

  const groupedRenewals = useMemo(() => {
    const groups: Record<string, Software[]> = {};

    filteredSoftware.forEach((item) => {
      const month = getMonthName(item.renewal_date);

      if (!groups[month]) {
        groups[month] = [];
      }

      groups[month].push(item);
    });

    return groups;
  }, [filteredSoftware]);

  const nextRenewal = software.find((item) => getDaysLeft(item.renewal_date) >= 0);

  const dueThisMonth = software.filter((item) => {
    const date = new Date(item.renewal_date);
    const now = new Date();

    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }).length;

  const expiredCount = software.filter((item) => {
    return getDaysLeft(item.renewal_date) < 0;
  }).length;

  const monthlyRenewalValue = filteredSoftware.reduce((sum, item) => {
    return sum + getMonthlyCost(item);
  }, 0);

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingCardStyle}>Loading renewals...</div>
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

          <Link href="/dashboard/renewals" style={activeNavStyle}>
            Renewals
          </Link>
        </nav>
      </aside>

      <section style={contentStyle}>
        <header style={topBarStyle}>
          <div>
            <p style={eyebrowStyle}>Renewal Calendar</p>
            <h1 style={titleStyle}>Renewals</h1>
            <p style={subtitleStyle}>
              See upcoming renewals by month, urgency, owner, and cost.
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
        </header>

        <section style={statsGridStyle}>
          <div style={statCardStyle}>
            <p style={statLabelStyle}>Next Renewal</p>
            <h2 style={statValueSmallStyle}>
              {nextRenewal ? nextRenewal.name : "None"}
            </h2>
            <p style={statGreenStyle}>
              {nextRenewal
                ? `${getDaysLeft(nextRenewal.renewal_date)} days left`
                : "No renewals"}
            </p>
          </div>

          <div style={statCardStyle}>
            <p style={statLabelStyle}>This Month</p>
            <h2 style={statValueStyle}>{dueThisMonth}</h2>
            <p style={statYellowStyle}>Renewals due</p>
          </div>

          <div style={statCardStyle}>
            <p style={statLabelStyle}>Expired</p>
            <h2 style={statValueStyle}>{expiredCount}</h2>
            <p style={expiredCount > 0 ? statRedStyle : statGreenStyle}>
              {expiredCount > 0 ? "Needs attention" : "All good"}
            </p>
          </div>

          <div style={statCardStyle}>
            <p style={statLabelStyle}>Visible Monthly Value</p>
            <h2 style={statValueStyle}>${Math.round(monthlyRenewalValue)}</h2>
            <p style={statGreenStyle}>Filtered estimate</p>
          </div>
        </section>

        <section style={calendarCardStyle}>
          <div style={calendarHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Calendar View</h2>
              <p style={sectionSubtitleStyle}>
                Grouped by renewal month for quick finance review.
              </p>
            </div>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={selectStyle}
            >
              <option value="all">All months</option>

              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          {software.length === 0 ? (
            <div style={emptyStyle}>
              <h3 style={emptyTitleStyle}>No renewals yet</h3>
              <p style={emptyTextStyle}>
                Add software tools to start seeing renewal dates here.
              </p>

              <Link href="/dashboard/add" style={emptyButtonStyle}>
                + Add Software
              </Link>
            </div>
          ) : filteredSoftware.length === 0 ? (
            <div style={emptyStyle}>
              <h3 style={emptyTitleStyle}>No renewals found</h3>
              <p style={emptyTextStyle}>Try another month filter.</p>
            </div>
          ) : (
            <div style={monthListStyle}>
              {Object.entries(groupedRenewals).map(([month, items]) => (
                <div key={month} style={monthGroupStyle}>
                  <div style={monthHeaderStyle}>
                    <h3 style={monthTitleStyle}>{month}</h3>
                    <span style={monthCountStyle}>{items.length} renewals</span>
                  </div>

                  <div style={renewalGridStyle}>
                    {items.map((item) => {
                      const status = getStatus(item.renewal_date);

                      return (
                        <div key={item.id} style={renewalCardStyle}>
                          <div style={renewalTopStyle}>
                            <div>
                              <h4 style={toolNameStyle}>{item.name}</h4>
                              <p style={ownerStyle}>{item.owner}</p>
                            </div>

                            <span style={status.style}>{status.text}</span>
                          </div>

                          <div style={renewalInfoGridStyle}>
                            <div style={miniInfoStyle}>
                              <span style={miniLabelStyle}>Renewal</span>
                              <strong>{item.renewal_date}</strong>
                            </div>

                            <div style={miniInfoStyle}>
                              <span style={miniLabelStyle}>Cost</span>
                              <strong>${item.cost}</strong>
                            </div>

                            <div style={miniInfoStyle}>
                              <span style={miniLabelStyle}>Billing</span>
                              <strong>{item.billing_cycle}</strong>
                            </div>

                            <div style={miniInfoStyle}>
                              <span style={miniLabelStyle}>Invoice</span>
                              <strong>
                                {item.invoice_url ? "Available" : "Missing"}
                              </strong>
                            </div>
                          </div>

                          <div style={cardActionsStyle}>
                            <Link
                              href={`/dashboard/edit/${item.id}`}
                              style={editButtonStyle}
                            >
                              Edit
                            </Link>

                            <Link
                              href={`/dashboard/email/${item.id}`}
                              style={emailButtonStyle}
                            >
                              Email
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top right, rgba(37,99,235,0.25), transparent 34%), linear-gradient(135deg, #020617 0%, #07112e 100%)",
  color: "white",
  display: "flex",
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const sidebarStyle: React.CSSProperties = {
  width: 260,
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
  fontSize: 22,
  fontWeight: 900,
  padding: "16px 18px",
  borderRadius: 18,
};

const activeNavStyle: React.CSSProperties = {
  color: "black",
  background: "white",
  textDecoration: "none",
  fontSize: 22,
  fontWeight: 950,
  padding: "16px 18px",
  borderRadius: 18,
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  padding: "42px 46px 80px",
};

const topBarStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 28,
  marginBottom: 42,
};

const eyebrowStyle: React.CSSProperties = {
  color: "#60a5fa",
  fontSize: 28,
  fontWeight: 1000,
  margin: "0 0 18px",
};

const titleStyle: React.CSSProperties = {
  fontSize: 72,
  lineHeight: 1,
  margin: 0,
  fontWeight: 1000,
};

const subtitleStyle: React.CSSProperties = {
  color: "#bfdbfe",
  fontSize: 26,
  lineHeight: 1.45,
  maxWidth: 720,
  marginTop: 20,
};

const topActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 18,
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const addButtonStyle: React.CSSProperties = {
  background: "white",
  color: "black",
  textDecoration: "none",
  padding: "20px 28px",
  borderRadius: 24,
  fontSize: 24,
  fontWeight: 1000,
  boxShadow: "0 18px 55px rgba(37,99,235,0.25)",
};

const logoutButtonStyle: React.CSSProperties = {
  background: "rgba(244,63,94,0.16)",
  color: "#fecaca",
  border: "1px solid rgba(244,63,94,0.38)",
  padding: "20px 28px",
  borderRadius: 24,
  fontSize: 22,
  fontWeight: 1000,
  cursor: "pointer",
};

const statsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(190px, 1fr))",
  gap: 22,
  marginBottom: 42,
};

const statCardStyle: React.CSSProperties = {
  background: "rgba(15,23,42,0.78)",
  border: "1px solid rgba(148,163,184,0.2)",
  borderRadius: 26,
  padding: 30,
  minHeight: 180,
};

const statLabelStyle: React.CSSProperties = {
  color: "#bfdbfe",
  fontSize: 21,
  margin: 0,
};

const statValueStyle: React.CSSProperties = {
  fontSize: 56,
  margin: "28px 0 18px",
  fontWeight: 800,
};

const statValueSmallStyle: React.CSSProperties = {
  fontSize: 32,
  margin: "30px 0 18px",
  fontWeight: 900,
};

const statGreenStyle: React.CSSProperties = {
  color: "#4ade80",
  fontSize: 21,
  fontWeight: 1000,
  margin: 0,
};

const statRedStyle: React.CSSProperties = {
  color: "#fca5a5",
  fontSize: 21,
  fontWeight: 1000,
  margin: 0,
};

const statYellowStyle: React.CSSProperties = {
  color: "#fcd34d",
  fontSize: 21,
  fontWeight: 1000,
  margin: 0,
};

const calendarCardStyle: React.CSSProperties = {
  background: "rgba(15,23,42,0.76)",
  border: "1px solid rgba(148,163,184,0.22)",
  borderRadius: 28,
  overflow: "hidden",
};

const calendarHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 20,
  padding: "34px 38px",
  borderBottom: "1px solid rgba(148,163,184,0.16)",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 42,
  margin: 0,
  fontWeight: 900,
};

const sectionSubtitleStyle: React.CSSProperties = {
  color: "#bfdbfe",
  fontSize: 22,
  margin: "12px 0 0",
};

const selectStyle: React.CSSProperties = {
  background: "#020617",
  color: "white",
  border: "1px solid rgba(148,163,184,0.25)",
  borderRadius: 18,
  padding: "16px 20px",
  fontSize: 18,
  fontWeight: 900,
  outline: "none",
};

const monthListStyle: React.CSSProperties = {
  padding: 34,
  display: "grid",
  gap: 34,
};

const monthGroupStyle: React.CSSProperties = {
  background: "rgba(2,6,23,0.55)",
  border: "1px solid rgba(148,163,184,0.15)",
  borderRadius: 24,
  overflow: "hidden",
};

const monthHeaderStyle: React.CSSProperties = {
  padding: "24px 28px",
  borderBottom: "1px solid rgba(148,163,184,0.14)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const monthTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 30,
  fontWeight: 950,
};

const monthCountStyle: React.CSSProperties = {
  background: "rgba(59,130,246,0.18)",
  color: "#93c5fd",
  border: "1px solid rgba(96,165,250,0.35)",
  padding: "10px 16px",
  borderRadius: 999,
  fontSize: 15,
  fontWeight: 950,
};

const renewalGridStyle: React.CSSProperties = {
  padding: 24,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 20,
};

const renewalCardStyle: React.CSSProperties = {
  background: "rgba(15,23,42,0.82)",
  border: "1px solid rgba(148,163,184,0.18)",
  borderRadius: 22,
  padding: 22,
};

const renewalTopStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  alignItems: "flex-start",
  marginBottom: 22,
};

const toolNameStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 26,
  fontWeight: 950,
};

const ownerStyle: React.CSSProperties = {
  color: "#bfdbfe",
  margin: "8px 0 0",
  fontSize: 16,
  fontWeight: 800,
};

const safeBadgeStyle: React.CSSProperties = {
  width: "fit-content",
  background: "rgba(34,197,94,0.18)",
  color: "#4ade80",
  border: "1px solid rgba(34,197,94,0.45)",
  padding: "8px 12px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 950,
  whiteSpace: "nowrap",
};

const warningBadgeStyle: React.CSSProperties = {
  width: "fit-content",
  background: "rgba(245,158,11,0.18)",
  color: "#fcd34d",
  border: "1px solid rgba(245,158,11,0.45)",
  padding: "8px 12px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 950,
  whiteSpace: "nowrap",
};

const dangerBadgeStyle: React.CSSProperties = {
  width: "fit-content",
  background: "rgba(239,68,68,0.18)",
  color: "#fca5a5",
  border: "1px solid rgba(239,68,68,0.45)",
  padding: "8px 12px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 950,
  whiteSpace: "nowrap",
};

const renewalInfoGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
};

const miniInfoStyle: React.CSSProperties = {
  background: "#020617",
  border: "1px solid rgba(148,163,184,0.14)",
  borderRadius: 16,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 9,
};

const miniLabelStyle: React.CSSProperties = {
  color: "#93c5fd",
  fontSize: 13,
  fontWeight: 950,
};

const cardActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  marginTop: 20,
};

const editButtonStyle: React.CSSProperties = {
  flex: 1,
  background: "rgba(59,130,246,0.18)",
  color: "#60a5fa",
  border: "1px solid rgba(96,165,250,0.36)",
  padding: "12px 16px",
  borderRadius: 14,
  fontWeight: 1000,
  textDecoration: "none",
  textAlign: "center",
};

const emailButtonStyle: React.CSSProperties = {
  flex: 1,
  background: "rgba(34,197,94,0.16)",
  color: "#4ade80",
  border: "1px solid rgba(34,197,94,0.36)",
  padding: "12px 16px",
  borderRadius: 14,
  fontWeight: 1000,
  textDecoration: "none",
  textAlign: "center",
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