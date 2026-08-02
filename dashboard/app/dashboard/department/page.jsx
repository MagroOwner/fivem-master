import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function DepartmentDashboard({ params }) {
  // FIX: params is now a plain object because this is NOT a client component
  const { guildId } = params;

  const { data: session, status } = useSession();
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDepartment() {
      try {
        const res = await fetch(`/api/department?guildId=${guildId}`);
        const data = await res.json();
        setDepartment(data);
      } catch (err) {
        setError("Failed to load department data.");
      } finally {
        setLoading(false);
      }
    }

    fetchDepartment();
  }, [guildId]);

  if (status === "loading") {
    return (
      <div className="p-10 text-gray-300 text-xl">
        Loading department dashboard...
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

  if (loading) {
    return (
      <div className="p-10 text-gray-300 text-xl">
        Loading department data...
      </div>
    );
  }

  return (
    <div className="p-10">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-blue-400">
            {department?.name || "Department"}
          </h1>
          <p className="text-gray-400 text-lg mt-1">
            Command Center • Blue Zone
          </p>
        </div>

        <Link
          href={`/dashboard/server/${guildId}`}
          className="px-5 py-2 bg-gray-700 hover:bg-gray-800 transition rounded-lg font-semibold"
        >
          Back
        </Link>
      </div>

      {/* ERROR */}
      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">

        <DashboardCard
          title="Roster"
          description="Manage officers, ranks, and assignments."
          color="blue"
          link={`/dashboard/server/${guildId}/department/roster`}
        />

        <DashboardCard
          title="Divisions"
          description="Customize and organize department divisions."
          color="blue"
          link={`/dashboard/server/${guildId}/department/divisions`}
        />

        <DashboardCard
          title="Commands"
          description="Configure department-specific bot commands."
          color="blue"
          link={`/dashboard/server/${guildId}/department/commands`}
        />

        <DashboardCard
          title="Vehicles"
          description="Manage department vehicles and unit numbers."
          color="blue"
          link={`/dashboard/server/${guildId}/department/vehicles`}
        />

        <DashboardCard
          title="Training"
          description="Track certifications and training progress."
          color="blue"
          link={`/dashboard/server/${guildId}/department/training`}
        />

        <DashboardCard
          title="Settings"
          description="Department configuration and preferences."
          color="blue"
          link={`/dashboard/server/${guildId}/department/settings`}
        />

      </div>

      {/* FOOTER */}
      <div className="mt-16 text-center text-gray-500">
        Department Command Center • Built for RP realism.
      </div>
    </div>
  );
}

function DashboardCard({ title, description, color, link }) {
  const glow =
    color === "blue"
      ? "hover:shadow-[0_0_20px_rgba(0,150,255,0.4)] hover:border-blue-500"
      : "hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:border-gray-500";

  return (
    <Link
      href={link}
      className={`p-6 rounded-xl bg-[#111827] border border-gray-700 
                  transition-all duration-300 cursor-pointer group ${glow}`}
    >
      <h2 className="text-2xl font-bold group-hover:text-blue-400">
        {title}
      </h2>

      <p className="text-gray-400 mt-1">
        {description}
      </p>

      <div
        className="mt-4 inline-block px-4 py-2 rounded-lg bg-blue-600 
                   hover:bg-blue-700 transition font-semibold"
      >
        Open →
      </div>
    </Link>
  );
}
