"use client";

import Link from "next/link";

const businessCommands = [
  {
    name: "/employee",
    label: "Employees",
    description:
      "Add, edit, remove, and list business employees with ranks and divisions.",
  },
  {
    name: "/license",
    label: "Licenses",
    description:
      "Create, remove, and list business licenses with numbers and notes.",
  },
  {
    name: "/permit",
    label: "Permits",
    description:
      "Create, remove, and list business permits with numbers and notes.",
  },
  {
    name: "/org",
    label: "Organization info",
    description:
      "Show business overview: type, members, ranks, divisions, licenses/permits.",
  },
];

export default function BusinessDashboard() {
  return (
    <div
      style={{
        padding: "40px",
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #0f172a 0%, #020617 45%, #000000 100%)",
        color: "white",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>
          Business Control
        </h1>
        <p style={{ color: "#9ca3af", fontSize: 14 }}>
          Manage employees, licenses, and permits for this business server.
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        {businessCommands.map((cmd) => (
          <CommandCard key={cmd.name} command={cmd} />
        ))}
      </section>
    </div>
  );
}

function CommandCard({ command }) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 16,
        background: "rgba(15,23,42,0.9)",
        border: "1px solid rgba(56,189,248,0.45)",
        boxShadow: "0 0 24px rgba(0,0,0,0.6)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 600 }}>{command.label}</div>
      <div style={{ fontSize: 13, color: "#9ca3af" }}>{command.description}</div>

      <div
        style={{
          marginTop: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 12,
        }}
      >
        <span style={{ color: "#0ea5e9" }}>{command.name}</span>
        <Link
          href="#"
          style={{
            color: "#0ea5e9",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Customize →
        </Link>
      </div>
    </div>
  );
}
