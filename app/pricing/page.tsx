"use client";

import Link from "next/link";

const STARTER_LINK =
  "https://paybackai.lemonsqueezy.com/checkout/buy/82a25846-457e-47fd-a328-b5176eef3c9c";

const PRO_LINK =
  "https://paybackai.lemonsqueezy.com/checkout/buy/7a93219e-56d5-4041-8c68-acc11122aa67";

const BUSINESS_LINK =
  "https://paybackai.lemonsqueezy.com/checkout/buy/8f21c9a7-c5d9-44d9-ad97-e738534ee072";

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      price: "$9.99",
      cycle: "/ week",
      description: "Best for solo users testing the product.",
      checkout: STARTER_LINK,
      features: [
        "Track up to 10 software tools",
        "Renewal badges",
        "Invoices page",
        "Search and sorting",
        "Basic dashboard",
        "3-day free trial",
      ],
      highlighted: false,
    },
    {
      name: "Pro",
      price: "$19.99",
      cycle: "/ month",
      description: "Best for small teams managing SaaS tools.",
      checkout: PRO_LINK,
      features: [
        "Track up to 50 software tools",
        "AI email writer",
        "Renewal calendar",
        "CSV export",
        "Finance report",
        "3-day free trial",
      ],
      highlighted: true,
    },
    {
      name: "Business",
      price: "$49.99",
      cycle: "/ month",
      description: "Best for companies tracking subscriptions seriously.",
      checkout: BUSINESS_LINK,
      features: [
        "Unlimited software tools",
        "Everything in Pro",
        "Advanced reports",
        "Owner and department tracking",
        "Priority support",
        "3-day free trial",
      ],
      highlighted: false,
    },
  ];

  return (
    <main style={pageStyle}>
      <nav style={navStyle}>
        <Link href="/" style={logoStyle}>
          Cobalt
        </Link>

        <div style={navRightStyle}>
          <Link href="/" style={navLinkStyle}>
            Home
          </Link>

          <Link href="/login" style={loginButtonStyle}>
            Login
          </Link>
        </div>
      </nav>

      <section style={heroStyle}>
        <p style={eyebrowStyle}>Pricing</p>

        <h1 style={titleStyle}>Choose your Cobalt plan</h1>

        <p style={subtitleStyle}>
          Start with a 3-day free trial. Upgrade when you are ready to unlock
          more SaaS tracking, invoices, AI emails, and finance reports.
        </p>
      </section>

      <section style={pricingGridStyle}>
        {plans.map((plan) => (
          <div
            key={plan.name}
            style={{
              ...cardStyle,
              ...(plan.highlighted ? highlightedCardStyle : {}),
            }}
          >
            {plan.highlighted && (
              <div style={popularBadgeStyle}>Most Popular</div>
            )}

            <h2 style={planNameStyle}>{plan.name}</h2>

            <p style={planDescriptionStyle}>{plan.description}</p>

            <div style={priceRowStyle}>
              <span style={priceStyle}>{plan.price}</span>
              <span style={cycleStyle}>{plan.cycle}</span>
            </div>

            <a href={plan.checkout} style={buttonStyle}>
              Start {plan.name}
            </a>

            <p style={trialTextStyle}>Includes 3-day free trial</p>

            <div style={lineStyle} />

            <ul style={featureListStyle}>
              {plan.features.map((feature) => (
                <li key={feature} style={featureItemStyle}>
                  <span style={checkStyle}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section style={bottomBoxStyle}>
        <h2 style={bottomTitleStyle}>Need to change later?</h2>
        <p style={bottomTextStyle}>
          Start small with Starter. Upgrade to Pro or Business when your users
          need more features.
        </p>

        <Link href="/login" style={bottomButtonStyle}>
          Login or Sign up
        </Link>
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top right, rgba(37,99,235,0.28), transparent 35%), linear-gradient(135deg, #020617, #071331)",
  color: "white",
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  padding: "26px 44px 80px",
};

const navStyle: React.CSSProperties = {
  maxWidth: 1280,
  margin: "0 auto",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const logoStyle: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  fontSize: 34,
  fontWeight: 950,
  letterSpacing: "-1px",
};

const navRightStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
};

const navLinkStyle: React.CSSProperties = {
  color: "#93c5fd",
  textDecoration: "none",
  fontSize: 17,
  fontWeight: 850,
};

const loginButtonStyle: React.CSSProperties = {
  background: "white",
  color: "black",
  textDecoration: "none",
  padding: "14px 24px",
  borderRadius: 20,
  fontSize: 17,
  fontWeight: 950,
};

const heroStyle: React.CSSProperties = {
  maxWidth: 980,
  margin: "90px auto 54px",
  textAlign: "center",
};

const eyebrowStyle: React.CSSProperties = {
  color: "#60a5fa",
  fontSize: 24,
  fontWeight: 950,
  marginBottom: 18,
};

const titleStyle: React.CSSProperties = {
  fontSize: "clamp(44px, 7vw, 86px)",
  lineHeight: 1.02,
  letterSpacing: "-3px",
  margin: 0,
  fontWeight: 950,
};

const subtitleStyle: React.CSSProperties = {
  color: "#bfdbfe",
  fontSize: 24,
  lineHeight: 1.55,
  maxWidth: 850,
  margin: "28px auto 0",
};

const pricingGridStyle: React.CSSProperties = {
  maxWidth: 1280,
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 26,
};

const cardStyle: React.CSSProperties = {
  position: "relative",
  background: "rgba(15,23,42,0.88)",
  border: "1px solid rgba(147,197,253,0.22)",
  borderRadius: 30,
  padding: 34,
  boxShadow: "0 30px 80px rgba(0,0,0,0.28)",
};

const highlightedCardStyle: React.CSSProperties = {
  border: "1px solid rgba(96,165,250,0.75)",
  boxShadow: "0 30px 100px rgba(37,99,235,0.32)",
  transform: "translateY(-10px)",
};

const popularBadgeStyle: React.CSSProperties = {
  position: "absolute",
  top: 22,
  right: 22,
  background: "rgba(34,197,94,0.16)",
  border: "1px solid rgba(34,197,94,0.5)",
  color: "#4ade80",
  padding: "9px 14px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 950,
};

const planNameStyle: React.CSSProperties = {
  fontSize: 34,
  margin: "0 0 12px",
  fontWeight: 950,
};

const planDescriptionStyle: React.CSSProperties = {
  color: "#bfdbfe",
  fontSize: 17,
  lineHeight: 1.5,
  minHeight: 52,
  margin: 0,
};

const priceRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  gap: 8,
  marginTop: 28,
};

const priceStyle: React.CSSProperties = {
  fontSize: 52,
  fontWeight: 950,
  letterSpacing: "-2px",
};

const cycleStyle: React.CSSProperties = {
  color: "#93c5fd",
  fontSize: 18,
  fontWeight: 800,
  paddingBottom: 9,
};

const buttonStyle: React.CSSProperties = {
  display: "block",
  marginTop: 26,
  background: "white",
  color: "black",
  textAlign: "center",
  textDecoration: "none",
  padding: "17px 20px",
  borderRadius: 18,
  fontSize: 18,
  fontWeight: 950,
};

const trialTextStyle: React.CSSProperties = {
  color: "#60a5fa",
  fontSize: 14,
  fontWeight: 900,
  marginTop: 14,
  textAlign: "center",
};

const lineStyle: React.CSSProperties = {
  height: 1,
  background: "rgba(147,197,253,0.18)",
  margin: "28px 0",
};

const featureListStyle: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "grid",
  gap: 14,
};

const featureItemStyle: React.CSSProperties = {
  color: "#dbeafe",
  fontSize: 16,
  lineHeight: 1.45,
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
};

const checkStyle: React.CSSProperties = {
  color: "#4ade80",
  fontWeight: 950,
};

const bottomBoxStyle: React.CSSProperties = {
  maxWidth: 880,
  margin: "46px auto 0",
  background: "rgba(15,23,42,0.72)",
  border: "1px solid rgba(147,197,253,0.22)",
  borderRadius: 28,
  padding: 34,
  textAlign: "center",
};

const bottomTitleStyle: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 950,
  margin: 0,
};

const bottomTextStyle: React.CSSProperties = {
  color: "#bfdbfe",
  fontSize: 18,
  lineHeight: 1.5,
  margin: "12px auto 24px",
  maxWidth: 620,
};

const bottomButtonStyle: React.CSSProperties = {
  display: "inline-block",
  background: "rgba(37,99,235,0.18)",
  border: "1px solid rgba(96,165,250,0.4)",
  color: "#93c5fd",
  textDecoration: "none",
  padding: "14px 22px",
  borderRadius: 16,
  fontSize: 16,
  fontWeight: 950,
};