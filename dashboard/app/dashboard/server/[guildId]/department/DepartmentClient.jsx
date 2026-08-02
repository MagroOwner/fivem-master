"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function DepartmentClient({ guildId }) {
  const { data: session, status } = useSession();
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/server/${guildId}/settings`);
        const data = await res.json();
        setDepartment(data);
      } catch {
        setError("Failed to load department data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [guildId]);

  if (status === "loading") return <div className="p-10">Loading...</div>;
  if (!session) return <div className="p-10">Login Required</div>;
  if (loading) return <div className="p-10">Loading department data...</div>;

  return (
    <div className="p-10">
      <h1 className="text-4xl text-blue-400">{department?.name || "Department"}</h1>

      {error && <div className="text-red-500">{error}</div>}

      <div className="grid grid-cols-3 gap-6 mt-10">
        <Link href={`/dashboard/server/${guildId}/department/commands`} className="p-6 bg-gray-800 rounded-xl">
          Commands →
        </Link>
      </div>
    </div>
  );
}
