"use client";

import Link from "next/link";

const gangCommands = [
  {
    name: "/color",
    label: "Gang color / theme",
    description: "Set the gang’s primary hex color for embeds and UI.",
  },
  {
    name: "/territory",
    label: "Territories",
    description:
      "Create, edit, remove, and list territories with notes and optional colors.",
  },
  {
    name: "/tag",
    label: "Tags",
    description: "Create quick response tags and post them with /tag use.",
  },
  {
    name: "/note",
    label: "Notes",
    description:
      "Add notes to members or the organization, list them, and remove by id.",
  },
  {
    name: "/org",
    label: "Organization info",
    description:
      "Show gang overview: type, members, ranks, divisions, territories.",
  },
];

export default function GangDashboard() {
  return (
    <div
      style={{
        padding: "40px",
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #111827 0%, #020617 45%, #000000 100%)",
        color: "white",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>
          Gang Control
        </h1>
        <p style={{ color: "#9ca3af", fontSize: 14 }}>
          Manage territories, colors, tags, and notes for this gang server.
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        {gangCommands.map((cmd) => (
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
        background: "rgba(24,24,27,0.95)",
        border: "1px solid rgba(248,113,113,0.45)",
        boxShadow: "0 0 24px rgba(0,0,0,0.7)",
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
        <span style={{ color: "#ef4444" }}>{command.name}</span>
        <Link
          href="#"
          style={{
            color: "#ef4444",
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
