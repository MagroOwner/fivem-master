import { NextResponse } from "next/server";
import { REST } from "discord.js";

export async function GET(req, { params }) {
  const guildId = params.guildId;

  try {
    // Use the bot token (same env var as other API routes)
    const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_BOT_TOKEN);

    const commands = await rest.get(
      `/applications/${process.env.CLIENT_ID}/guilds/${guildId}/commands`
    );

    // Ensure we always return valid JSON content-type
    return NextResponse.json(commands, { status: 200 });
  } catch (err) {
    console.error("[api/server/[guildId]/commands] error:", err);
    return NextResponse.json({ error: "Failed to load commands" }, { status: 500 });
  }
}
