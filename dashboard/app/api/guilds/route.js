import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json([], { status: 200 });
  }

  const res = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: {
      Authorization: `Bearer ${session.accessToken}`
    }
  });

  const data = await res.json();

  // If Discord returns an error object, return empty array
  if (!Array.isArray(data)) {
    return NextResponse.json([], { status: 200 });
  }

  const manageable = data.filter(g => (g.permissions & 0x20) === 0x20);

  return NextResponse.json(manageable);
}
