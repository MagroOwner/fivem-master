import { NextResponse } from "next/server";
import { fetchBotCommands } from "../../../lib/commands";

// GET /api/commands?guildId=<id> -> { commands: [...] }
export async function GET(request: Request) {
  try {
    const guildId = new URL(request.url).searchParams.get("guildId") ?? undefined;
    const commands = await fetchBotCommands(guildId);
    return NextResponse.json({ commands });
  } catch (err) {
    console.error("GET /api/commands error:", err);
    return NextResponse.json({ error: "Failed to fetch commands from bot" }, { status: 502 });
  }
}
