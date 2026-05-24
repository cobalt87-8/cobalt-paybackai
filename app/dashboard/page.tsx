"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Software = {
  id: number;
  name: string;
  cost: number;
  billing_cycle: string;
  renewal_date: string;
  owner: string;
  invoice_url?: string | null;
  notes?: string | null;
  user_id?: string | null;
};

type Profile = {
  id: string;
  email: string | null;
  plan: "trial" | "starter" | "pro" | "business" | null;
  trial_started_at: string | null;
  subscription_status: string | null;
};

type SortType = "soonest" | "highestCost" | "missingInvoices" | "az";

const planData = {
  trial: {
    name: "Free Trial",
    limit: "Full access",
    toolLimit: 999999,
    canExport: true,
    canUseAI: true,
    canUseReport: true,
    canUseRenewals: true,
    price: "3 days",
  },
  starter: {
    name: "Starter",
    limit: "10 tools",
    toolLimit: 10,
    canExport: false,
    canUseAI: false,
    canUseReport: false,
    canUseRenewals: false,
    price: "$9.99/week",
  },
  pro: {
    name: "Pro",
    limit: "50 tools",
    toolLimit: 50,
    canExport: true,
    canUseAI: true,
    canUseReport: true,
    canUseRenewals: true,
    price: "$19.99/month",
  },
  business: {
    name: "Business",
    limit: "Unlimited",
    toolLimit: 999999,
    canExport: true,
    canUseAI: true,
    canUseReport: true,
    canUseRenewals: true,
    price: "$49.99/month",
  },
};

export default function DashboardPage() {
  const router = useRouter();

  const [software, setSoftware] = useState<Software[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortType>("soonest");
  const [trialDaysLeft, setTrialDaysLeft] = useState<number>(3);

  useEffect(() => {
    startDashboard();
  }, []);

  async function startDashboard() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    let { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profileData) {
      const { data: newProfile } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          plan: "trial",
          subscription_status: "trial",
          trial_started_at: new Date().toISOString(),
        })
        .select()
        .single();

      profileData = newProfile;
    }

    setProfile(profileData as Profile);

    if (profileData?.trial_started_at) {
      const startDate = new Date(profileData.trial_started_at);
      const today = new Date();
      const diffTime = today.getTime() - startDate.getTime();
      const usedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const left = Math.max(3 - usedDays, 0);
      setTrialDaysLeft(left);
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

  const currentPlanKey = profile?.plan || "trial";
  const currentPlan = planData[currentPlanKey];

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

  function exportCSV() {
    if (!currentPlan.canExport) {
      router.push("/upgrade?locked=export");
      return;
    }

    if (software.length === 0) {
      alert("No software to export.");
      return;
    }

    const headers = [
      "Name",
      "Cost",
      "Billing Cycle",
      "Renewal Date",
      "Owner",
      "Invoice URL",
      "Notes",
    ];

    const rows = software.map((item) => [
      item.name || "",
      item.cost || "",
      item.billing_cycle || "",
      item.renewal_date || "",
      item.owner || "",
      item.invoice_url || "",
      item.notes || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((value) => {
            const safeValue = String(value).replaceAll('"', '""');
            return `"${safeValue}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "cobalt-software-report.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function deleteSoftware(id: number) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this software?"
    );

    if (!confirmDelete) return;

    setDeletingId(id);

    const { error } = await supabase.from("software").delete().eq("id", id);

    if (error) {
      alert(error.message);
    } else {
      setSoftware((prev) => prev.filter((item) => item.id !== id));
    }

    setDeletingId(null);
  }

  function getRenewalInfo(dateValue: string) {
    if (!dateValue) {
      return {
        daysLeft: null,
        label: "No date",
        tone: "neutral",
      };
    }

    const today = new Date();
    const renewalDate = new Date(dateValue);

    today.setHours(0, 0, 0, 0);
    renewalDate.setHours(0, 0, 0, 0);

    const diffTime = renewalDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return {
        daysLeft,
        label: "Expired",
        tone: "danger",
      };
    }

    if (daysLeft === 0) {
      return {
        daysLeft,
        label: "Due today",
        tone: "warning",
      };
    }

    if (daysLeft <= 7) {
      return {
        daysLeft,
        label: `${daysLeft} days left`,
        tone: "danger",
      };
    }

    if (daysLeft <= 30) {
      return {
        daysLeft,
        label: `${daysLeft} days left`,
        tone: "warning",
      };
    }

    return {
      daysLeft,
      label: `${daysLeft} days left`,
      tone: "safe",
    };
  }

  function getBadgeStyle(tone: string): React.CSSProperties {
    if (tone === "danger") {
      return {
        ...badgeStyle,
        background: "rgba(239,68,68,0.18)",
        color: "#fca5a5",
        border: "1px solid rgba(239,68,68,0.45)",
      };
    }

    if (tone === "warning") {
      return {
        ...badgeStyle,
        background: "rgba(245,158,11,0.18)",
        color: "#fcd34d",
        border: "1px solid rgba(245,158,11,0.45)",
      };
    }

    if (tone === "safe") {
      return {
        ...badgeStyle,
        background: "rgba(34,197,94,0.18)",
        color: "#4ade80",
        border: "1px solid rgba(34,197,94,0.45)",
      };
    }

    return {
      ...badgeStyle,
      background: "rgba(148,163,184,0.16)",
      color: "#cbd5e1",
      border: "1px solid rgba(148,163,184,0.35)",
    };
  }

  const filteredSoftware = useMemo(() => {
    const value = search.toLowerCase().trim();

    let result = software.filter((item) => {
      if (!value) return true;

      return (
        item.name?.toLowerCase().includes(value) ||
        item.owner?.toLowerCase().includes(value) ||
        item.billing_cycle?.toLowerCase().includes(value) ||
        item.renewal_date?.toLowerCase().includes(value) ||
        item.notes?.toLowerCase().includes(value)
      );
    });

    result = [...result].sort((a, b) => {
      if (sortBy === "soonest") {
        return (
          new Date(a.renewal_date).getTime() -
          new Date(b.renewal_date).getTime()
        );
      }

      if (sortBy === "highestCost") {
        return getMonthlyCost(b) - getMonthlyCost(a);
      }

      if (sortBy === "missingInvoices") {
        const aMissing = a.invoice_url ? 0 : 1;
        const bMissing = b.invoice_url ? 0 : 1;

        if (bMissing !== aMissing) {
          return bMissing - aMissing;
        }

        return (
          new Date(a.renewal_date).getTime() -
          new Date(b.renewal_date).getTime()
        );
      }

      return a.name.localeCompare(b.name);
    });

    return result;
  }, [software, search, sortBy]);

  const monthlySpend = software.reduce((total, item) => {
    return total + getMonthlyCost(item);
  }, 0);

  const missingInvoices = software.filter((item) => !item.invoice_url).length;

  const dueSoonCount = software.filter((item) => {
    const info = getRenewalInfo(item.renewal_date);
    return info.daysLeft !== null && info.daysLeft >= 0 && info.daysLeft <= 30;
  }).length;

  const toolsLeft =
    currentPlan.toolLimit >= 999999
      ? "Unlimited"
      : Math.max(currentPlan.toolLimit - software.length, 0);

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingCardStyle}>Loading dashboard...</div>
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
          <Link href="/dashboard" style={activeNavStyle}>
            Dashboard
          </Link>

          <Link href="/dashboard/software" style={navLinkStyle}>
            Software
          </Link>

          <Link href="/dashboard/invoices" style={navLinkStyle}>
            Invoices
          </Link>

          <Link
            href={currentPlan.canUseRenewals ? "/dashboard/renewals" : "/upgrade?locked=renewals"}
            style={navLinkStyle}
          >
            Renewals {!currentPlan.canUseRenewals && "🔒"}
          </Link>

          <Link
            href={currentPlan.canUseReport ? "/dashboard/report" : "/upgrade?locked=report"}
            style={navLinkStyle}
          >
            Finance Report {!currentPlan.canUseReport && "🔒"}
          </Link>
        </nav>

        <div style={planCardStyle}>
          <p style={planSmallStyle}>Current Plan</p>
          <h3 style={planBigStyle}>{currentPlan.name}</h3>
          <p style={planTextStyle}>{currentPlan.price}</p>
          <p style={planTextStyle}>Limit: {currentPlan.limit}</p>

          {currentPlanKey === "trial" && (
            <p style={trialTextStyle}>{trialDaysLeft} trial days left</p>
          )}

          <Link href="/pricing" style={upgradeSmallButtonStyle}>
            Upgrade Plan
          </Link>
        </div>
      </aside>

      <section style={contentStyle}>
        <header style={topBarStyle}>
          <div>
            <p style={eyebrowStyle}>SaaS Renewal + Invoice Tracker</p>
            <h1 style={titleStyle}>Dashboard</h1>
            <p style={subtitleStyle}>
              Track subscriptions, invoices, owners, and upcoming renewals.
            </p>
          </div>

          <div style={topActionsStyle}>
            <Link href="/dashboard/add" style={addButtonStyle}>
              + Add Software
            </Link>

            <button onClick={exportCSV} style={exportButtonStyle}>
              {currentPlan.canExport ? "Export CSV" : "Export CSV 🔒"}
            </button>

            <button onClick={logout} style={logoutButtonStyle}>
              Logout
            </button>
          </div>
        </header>

        <section style={planBannerStyle}>
          <div>
            <p style={planBannerLabelStyle}>Your plan</p>
            <h2 style={planBannerTitleStyle}>{currentPlan.name}</h2>
            <p style={planBannerTextStyle}>
              Tool limit: {currentPlan.limit} · Tools used: {software.length} · Tools left: {toolsLeft}
            </p>
          </div>

          <div style={featurePillsStyle}>
            <span style={featurePillStyle(currentPlan.canUseAI)}>
              AI Email {currentPlan.canUseAI ? "✓" : "🔒"}
            </span>
            <span style={featurePillStyle(currentPlan.canUseRenewals)}>
              Renewal Calendar {currentPlan.canUseRenewals ? "✓" : "🔒"}
            </span>
            <span style={featurePillStyle(currentPlan.canUseReport)}>
              Finance Report {currentPlan.canUseReport ? "✓" : "🔒"}
            </span>
            <span style={featurePillStyle(currentPlan.canExport)}>
              CSV Export {currentPlan.canExport ? "✓" : "🔒"}
            </span>
          </div>
        </section>

        <section style={statsGridStyle}>
          <div style={statCardStyle}>
            <p style={statLabelStyle}>Monthly Spend</p>
            <h2 style={statValueStyle}>${Math.round(monthlySpend)}</h2>
            <p style={statGreenStyle}>Live from Supabase</p>
          </div>

          <div style={statCardStyle}>
            <p style={statLabelStyle}>Tracked Tools</p>
            <h2 style={statValueStyle}>{software.length}</h2>
            <p style={statGreenStyle}>Active subscriptions</p>
          </div>

          <div style={statCardStyle}>
            <p style={statLabelStyle}>Missing Invoices</p>
            <h2 style={statValueStyle}>{missingInvoices}</h2>
            <p style={missingInvoices > 0 ? statRedStyle : statGreenStyle}>
              {missingInvoices > 0 ? "Needs fixing" : "All good"}
            </p>
          </div>

          <div style={statCardStyle}>
            <p style={statLabelStyle}>Due Soon</p>
            <h2 style={statValueStyle}>{dueSoonCount}</h2>
            <p style={dueSoonCount > 0 ? statYellowStyle : statGreenStyle}>
              Next 30 days
            </p>
          </div>
        </section>

        <section style={tableCardStyle}>
          <div style={tableHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Tracked Software</h2>
              <p style={sectionSubtitleStyle}>
                Your live SaaS tools, renewal dates, invoices, and notes.
              </p>
            </div>

            <div style={activePillStyle}>{software.length} active</div>
          </div>

          <div style={controlPanelStyle}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, owner, billing, notes..."
              style={searchInputStyle}
            />

            <div style={sortRowStyle}>
              <button
                onClick={() => setSortBy("soonest")}
                style={sortButtonStyle(sortBy === "soonest")}
              >
                Soonest renewal
              </button>

              <button
                onClick={() => setSortBy("highestCost")}
                style={sortButtonStyle(sortBy === "highestCost")}
              >
                Highest cost
              </button>

              <button
                onClick={() => setSortBy("missingInvoices")}
                style={sortButtonStyle(sortBy === "missingInvoices")}
              >
                Missing invoices
              </button>

              <button
                onClick={() => setSortBy("az")}
                style={sortButtonStyle(sortBy === "az")}
              >
                A–Z
              </button>
            </div>
          </div>

          {filteredSoftware.length === 0 ? (
            <div style={emptyStyle}>
              <h3 style={emptyTitleStyle}>No software found</h3>
              <p style={emptyTextStyle}>
                Add your first SaaS tool or try another search.
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
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Cost</th>
                    <th style={thStyle}>Billing</th>
                    <th style={thStyle}>Renewal</th>
                    <th style={thStyle}>Owner</th>
                    <th style={thStyle}>Invoice</th>
                    <th style={thStyle}>Notes</th>
                    <th style={thStyle}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSoftware.map((item) => {
                    const renewalInfo = getRenewalInfo(item.renewal_date);

                    return (
                      <tr key={item.id} style={trStyle}>
                        <td style={tdStyle}>
                          <strong>{item.name}</strong>
                        </td>

                        <td style={tdStyle}>${Number(item.cost || 0)}</td>

                        <td style={tdStyle}>{item.billing_cycle}</td>

                        <td style={tdStyle}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <span>{item.renewal_date}</span>
                            <span style={getBadgeStyle(renewalInfo.tone)}>
                              {renewalInfo.label}
                            </span>
                          </div>
                        </td>

                        <td style={tdStyle}>{item.owner}</td>

                        <td style={tdStyle}>
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
                            <span style={missingTextStyle}>Missing</span>
                          )}
                        </td>

                        <td style={tdStyle}>{item.notes || "No notes"}</td>

                        <td style={tdStyle}>
                          <div style={actionWrapStyle}>
                            <Link href={`/dashboard/edit/${item.id}`} style={editButtonStyle}>
                              Edit
                            </Link>

                            <Link
                              href={
                                currentPlan.canUseAI
                                  ? `/dashboard/email/${item.id}`
                                  : "/upgrade?locked=email"
                              }
                              style={emailButtonStyle}
                            >
                              Email {currentPlan.canUseAI ? "" : "🔒"}
                            </Link>

                            <button
                              onClick={() => deleteSoftware(item.id)}
                              disabled={deletingId === item.id}
                              style={{
                                ...deleteButtonStyle,
                                opacity: deletingId === item.id ? 0.6 : 1,
                              }}
                            >
                              {deletingId === item.id ? "Deleting" : "Delete"}
                            </button>
                          </div>
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
  background:
    "radial-gradient(circle at top right, rgba(37,99,235,0.25), transparent 34%), linear-gradient(135deg, #020617 0%, #07112e 100%)",
  color: "white",
  display: "flex",
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const sidebarStyle: React.CSSProperties = {
  width: 280,
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
  marginBottom: 44,
};

const navStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const navLinkStyle: React.CSSProperties = {
  color: "#93c5fd",
  textDecoration: "none",
  fontSize: 18,
  fontWeight: 900,
  padding: "14px 16px",
  borderRadius: 16,
};

const activeNavStyle: React.CSSProperties = {
  color: "black",
  background: "white",
  textDecoration: "none",
  fontSize: 18,
  fontWeight: 950,
  padding: "14px 16px",
  borderRadius: 16,
};

const planCardStyle: React.CSSProperties = {
  marginTop: 30,
  padding: 18,
  borderRadius: 22,
  background: "rgba(59,130,246,0.12)",
  border: "1px solid rgba(96,165,250,0.3)",
};

const planSmallStyle: React.CSSProperties = {
  color: "#93c5fd",
  fontSize: 14,
  fontWeight: 950,
  margin: 0,
};

const planBigStyle: React.CSSProperties = {
  fontSize: 27,
  margin: "10px 0 8px",
  fontWeight: 1000,
};

const planTextStyle: React.CSSProperties = {
  color: "#bfdbfe",
  margin: "7px 0",
  fontSize: 14,
  fontWeight: 800,
};

const trialTextStyle: React.CSSProperties = {
  color: "#4ade80",
  margin: "10px 0",
  fontSize: 14,
  fontWeight: 1000,
};

const upgradeSmallButtonStyle: React.CSSProperties = {
  display: "block",
  marginTop: 14,
  background: "white",
  color: "black",
  textAlign: "center",
  textDecoration: "none",
  padding: "12px 14px",
  borderRadius: 14,
  fontSize: 14,
  fontWeight: 1000,
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
  marginBottom: 28,
};

const eyebrowStyle: React.CSSProperties = {
  color: "#60a5fa",
  fontSize: 24,
  fontWeight: 1000,
  margin: "0 0 16px",
};

const titleStyle: React.CSSProperties = {
  fontSize: 64,
  lineHeight: 1,
  margin: 0,
  fontWeight: 1000,
};

const subtitleStyle: React.CSSProperties = {
  color: "#bfdbfe",
  fontSize: 22,
  lineHeight: 1.45,
  maxWidth: 720,
  marginTop: 18,
};

const topActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 14,
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const addButtonStyle: React.CSSProperties = {
  background: "white",
  color: "black",
  textDecoration: "none",
  padding: "18px 24px",
  borderRadius: 22,
  fontSize: 20,
  fontWeight: 1000,
};

const exportButtonStyle: React.CSSProperties = {
  background: "rgba(34,197,94,0.16)",
  color: "#4ade80",
  border: "1px solid rgba(34,197,94,0.36)",
  padding: "18px 22px",
  borderRadius: 22,
  fontSize: 18,
  fontWeight: 1000,
  cursor: "pointer",
};

const logoutButtonStyle: React.CSSProperties = {
  background: "rgba(244,63,94,0.16)",
  color: "#fecaca",
  border: "1px solid rgba(244,63,94,0.38)",
  padding: "18px 22px",
  borderRadius: 22,
  fontSize: 18,
  fontWeight: 1000,
  cursor: "pointer",
};

const planBannerStyle: React.CSSProperties = {
  background: "rgba(15,23,42,0.78)",
  border: "1px solid rgba(96,165,250,0.28)",
  borderRadius: 26,
  padding: 26,
  marginBottom: 32,
  display: "flex",
  justifyContent: "space-between",
  gap: 24,
  alignItems: "center",
};

const planBannerLabelStyle: React.CSSProperties = {
  color: "#60a5fa",
  fontSize: 16,
  fontWeight: 1000,
  margin: 0,
};

const planBannerTitleStyle: React.CSSProperties = {
  fontSize: 34,
  margin: "10px 0",
  fontWeight: 1000,
};

const planBannerTextStyle: React.CSSProperties = {
  color: "#bfdbfe",
  margin: 0,
  fontSize: 17,
  fontWeight: 800,
};

const featurePillsStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

function featurePillStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? "rgba(34,197,94,0.16)" : "rgba(239,68,68,0.14)",
    color: active ? "#4ade80" : "#fca5a5",
    border: active
      ? "1px solid rgba(34,197,94,0.35)"
      : "1px solid rgba(239,68,68,0.35)",
    padding: "10px 13px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 1000,
  };
}

const statsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(190px, 1fr))",
  gap: 22,
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

const statGreenStyle: React.CSSProperties = {
  color: "#4ade80",
  fontSize: 18,
  fontWeight: 1000,
  margin: 0,
};

const statRedStyle: React.CSSProperties = {
  color: "#fca5a5",
  fontSize: 18,
  fontWeight: 1000,
  margin: 0,
};

const statYellowStyle: React.CSSProperties = {
  color: "#fcd34d",
  fontSize: 18,
  fontWeight: 1000,
  margin: 0,
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
  padding: "30px 34px",
  borderBottom: "1px solid rgba(148,163,184,0.16)",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 36,
  margin: 0,
  fontWeight: 900,
};

const sectionSubtitleStyle: React.CSSProperties = {
  color: "#bfdbfe",
  fontSize: 19,
  margin: "10px 0 0",
};

const activePillStyle: React.CSSProperties = {
  background: "rgba(34,197,94,0.18)",
  color: "#4ade80",
  padding: "12px 20px",
  borderRadius: 999,
  fontSize: 16,
  fontWeight: 1000,
};

const controlPanelStyle: React.CSSProperties = {
  padding: "24px 34px",
  borderBottom: "1px solid rgba(148,163,184,0.16)",
  display: "grid",
  gap: 16,
};

const searchInputStyle: React.CSSProperties = {
  width: "100%",
  background: "#020617",
  color: "white",
  border: "1px solid rgba(148,163,184,0.25)",
  borderRadius: 18,
  padding: "17px 19px",
  fontSize: 18,
  outline: "none",
};

const sortRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

function sortButtonStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? "white" : "rgba(15,23,42,0.85)",
    color: active ? "black" : "#bfdbfe",
    border: active
      ? "1px solid white"
      : "1px solid rgba(148,163,184,0.24)",
    padding: "12px 16px",
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 1000,
    cursor: "pointer",
  };
}

const tableScrollStyle: React.CSSProperties = {
  overflowX: "auto",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 1100,
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

const badgeStyle: React.CSSProperties = {
  width: "fit-content",
  padding: "7px 11px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 950,
};

const invoiceLinkStyle: React.CSSProperties = {
  color: "#60a5fa",
  fontWeight: 1000,
  textDecoration: "none",
};

const missingTextStyle: React.CSSProperties = {
  color: "#fca5a5",
  fontWeight: 900,
};

const actionWrapStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  width: 125,
};

const editButtonStyle: React.CSSProperties = {
  background: "rgba(59,130,246,0.18)",
  color: "#60a5fa",
  border: "1px solid rgba(96,165,250,0.36)",
  padding: "11px 16px",
  borderRadius: 14,
  fontWeight: 1000,
  textDecoration: "none",
  textAlign: "center",
};

const emailButtonStyle: React.CSSProperties = {
  background: "rgba(34,197,94,0.16)",
  color: "#4ade80",
  border: "1px solid rgba(34,197,94,0.36)",
  padding: "11px 16px",
  borderRadius: 14,
  fontWeight: 1000,
  textDecoration: "none",
  textAlign: "center",
};

const deleteButtonStyle: React.CSSProperties = {
  background: "rgba(244,63,94,0.16)",
  color: "#fca5a5",
  border: "1px solid rgba(244,63,94,0.36)",
  padding: "11px 16px",
  borderRadius: 14,
  fontWeight: 1000,
  cursor: "pointer",
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