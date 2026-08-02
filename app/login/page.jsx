"use client";
import { signIn } from "next-auth/react";

function FactionPill({ label, color }) {
  return (
    <div
      style={{
        padding: "8px 10px",
        borderRadius: 999,
        border: `1px solid ${color}`,
        background: "rgba(15,23,42,0.8)",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
        }}
      />
      <span>{label}</span>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0a0a0a, #111, #0f0f0f)",
      }}
    >
      <div
        style={{
          background: "rgba(20,20,20,0.85)",
          padding: "50px",
          borderRadius: "16px",
          textAlign: "center",
          boxShadow: "0 0 40px rgba(0,0,0,0.7)",
        }}
      >
        <h1 style={{ color: "white", marginBottom: "20px", fontSize: "32px" }}>
          FiveM Server Master
        </h1>

        <p style={{ color: "#aaa", marginBottom: "30px" }}>
          One bot. Every faction. Total control.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <FactionPill label="Departments" color="#3b82f6" />
          <FactionPill label="Gangs" color="#ef4444" />
          <FactionPill label="Businesses" color="#22c55e" />
        </div>

        <button
          onClick={() => signIn("discord", { callbackUrl: "/dashboard" })}
          style={{
            background: "#5865F2",
            color: "white",
            padding: "14px 24px",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            fontSize: "18px",
            fontWeight: "600",
          }}
        >
          Login with Discord
        </button>
      </div>
    </div>
  );
}
