import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const guildId = params.guildId;

  const res = await fetch(`https://discord.com/api/guilds/${guildId}/roles`, {
    headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
  });

  const roles = await res.json();
  return NextResponse.json(roles);
}
