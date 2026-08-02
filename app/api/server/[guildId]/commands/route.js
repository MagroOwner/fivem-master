import { NextResponse } from "next/server";
import { fetchBotCommands } from "@/dashboard/lib/commands";

// GET /api/server/[guildId]/commands -> [ { id, name, description, options } ]
export async function GET(request, { params }) {
  const { guildId } = await params;

  try {
    const commands = await fetchBotCommands(guildId);
    return NextResponse.json(commands);
  } catch (err) {
    console.error("[api/server/[guildId]/commands] error:", err);
    return NextResponse.json({ error: "Failed to fetch commands from bot" }, { status: 502 });
  }
}
