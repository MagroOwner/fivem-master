import { NextResponse } from "next/server";
import { REST } from "discord.js";

export async function GET(req, { params }) {
  const guildId = params.guildId;

  try {
    // Discord REST client
    const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

    // Fetch guild commands from Discord
    const commands = await rest.get(
      `/applications/${process.env.CLIENT_ID}/guilds/${guildId}/commands`
    );

    // Return JSON array
    return NextResponse.json(commands);
  } catch (err) {
    console.error("Commands API error:", err);

    return NextResponse.json(
      { error: "Failed to load commands" },
      { status: 500 }
    );
  }
}
