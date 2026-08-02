"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function CommandsClient({ guildId }) {
  const { data: session, status } = useSession();
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        // ⭐ Fetch commands from your bot API
        const res = await fetch(`/api/server/${guildId}/commands`);
        const data = await res.json();

        // ⭐ Ensure commands is ALWAYS an array
        const safeArray =
          Array.isArray(data)
            ? data
            : Array.isArray(data.commands)
            ? data.commands
            : Array.isArray(data.channels)
            ? data.channels
            : [];

        setCommands(safeArray);
      } catch (err) {
        console.error("Commands load error:", err);
        setError("Failed to load commands.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [guildId]);

  if (status === "loading") return <div className="p-10 text-gray-300">Loading...</div>;
  if (!session) return <div className="p-10 text-gray-300">Login Required</div>;
  if (loading) return <div className="p-10 text-gray-300">Loading command data...</div>;

  return (
    <div className="p-10">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-blue-400">
          Commands
        </h1>

        <Link
          href={`/dashboard/server/${guildId}/department`}
          className="px-5 py-2 bg-gray-700 hover:bg-gray-800 transition rounded-lg font-semibold"
        >
          Back
        </Link>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="space-y-6 mt-10">
        {commands.length === 0 && (
          <div className="text-gray-400 text-lg">
            No commands found for this server.
          </div>
        )}

        {commands.map((cmd) => (
          <div
            key={cmd.id || cmd._id || cmd.name}
            className="p-6 rounded-xl bg-[#111827] border border-gray-700 
                       hover:border-blue-500 hover:shadow-[0_0_20px_rgba(0,150,255,0.4)]
                       transition-all duration-300"
          >
            <h2 className="text-2xl font-bold text-blue-300">
              {cmd.name || cmd.channelName || "Unnamed Command"}
            </h2>

            <p className="text-gray-400 mt-1">
              {cmd.description || cmd.topic || "No description provided"}
            </p>

            <div className="text-gray-500 text-sm mt-2">
              ID: {cmd.id || cmd._id || "N/A"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
