"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ServerClient({ guildId }) {
  const { data: session, status } = useSession();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/server/${guildId}/settings`);
        const data = await res.json();
        setServer(data);
      } catch {
        setError("Failed to load server data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [guildId]);

  if (status === "loading") return <div className="p-10">Loading...</div>;
  if (!session) return <div className="p-10">Login Required</div>;
  if (loading) return <div className="p-10">Loading server data...</div>;

  return (
    <div className="p-10">
      <h1 className="text-4xl text-purple-400">{server?.name || "Server Dashboard"}</h1>

      {error && <div className="text-red-500">{error}</div>}

      <div className="grid grid-cols-3 gap-6 mt-10">
        <Link href={`/dashboard/server/${guildId}/department`} className="p-6 bg-gray-800 rounded-xl">
          Department →
        </Link>
        <Link href={`/dashboard/server/${guildId}/gang`} className="p-6 bg-gray-800 rounded-xl">
          Gang →
        </Link>
        <Link href={`/dashboard/server/${guildId}/business`} className="p-6 bg-gray-800 rounded-xl">
          Business →
        </Link>
      </div>
    </div>
  );
}
