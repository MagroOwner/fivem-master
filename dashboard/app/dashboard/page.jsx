"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [guilds, setGuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchGuilds() {
      try {
        const res = await fetch("/api/guilds");
        const data = await res.json();

        // Auto‑detect faction type
        const themed = data.map((g) => ({
          ...g,
          type: g.name.toLowerCase().includes("gang")
            ? "gang"
            : g.name.toLowerCase().includes("bank")
            ? "business"
            : "department",
        }));

        setGuilds(themed);
      } catch (err) {
        setError("Failed to load servers.");
      } finally {
        setLoading(false);
      }
    }

    fetchGuilds();
  }, []);

  if (status === "loading") {
    return (
      <div className="p-10 text-gray-300 text-xl">
        Loading your control center...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-10 text-gray-300 text-xl">
        Login Required
      </div>
    );
  }

  return (
    <div className="p-10">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight">
            FiveM Server Master
          </h1>
          <p className="text-gray-400 text-lg mt-1">
            One bot. Every faction. Total control.
          </p>
        </div>

        <Link
          href="/api/auth/signout"
          className="px-5 py-2 bg-red-600 hover:bg-red-700 transition rounded-lg font-semibold"
        >
          Logout
        </Link>
      </div>

      {/* ERROR */}
      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {guilds.map((guild) => (
          <GuildCard key={guild.id} guild={guild} />
        ))}
      </div>

      {/* FOOTER */}
      <div className="mt-16 text-center text-gray-500">
        Built for your RP community.
      </div>
    </div>
  );
}

function GuildCard({ guild }) {
  const factionColor =
    guild.type === "gang"
      ? "red"
      : guild.type === "business"
      ? "yellow"
      : "blue";

  const glow =
    factionColor === "red"
      ? "hover:shadow-[0_0_20px_rgba(255,0,0,0.4)] hover:border-red-500"
      : factionColor === "yellow"
      ? "hover:shadow-[0_0_20px_rgba(255,200,0,0.4)] hover:border-yellow-500"
      : "hover:shadow-[0_0_20px_rgba(0,150,255,0.4)] hover:border-blue-500";

  return (
    <div
      className={`p-6 rounded-xl bg-[#111827] border border-gray-700 
                  transition-all duration-300 cursor-pointer group ${glow}`}
    >
      <h2 className="text-2xl font-bold group-hover:text-gray-200">
        {guild.name}
      </h2>

      <p className="text-gray-400 mt-1">
        {guild.type === "gang" && "Gang • Red Zone"}
        {guild.type === "department" && "Department • Blue Zone"}
        {guild.type === "business" && "Business • Gold Zone"}
      </p>

      <Link
        href={`/dashboard/server/${guild.id}`}
        className="mt-4 inline-block px-4 py-2 rounded-lg bg-blue-600 
                   hover:bg-blue-700 transition font-semibold"
      >
        Manage →
      </Link>
    </div>
  );
}
