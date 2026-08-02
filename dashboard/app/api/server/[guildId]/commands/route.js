import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const guildId = params.guildId;
  const botApiUrl = process.env.BOT_API_URL;
  const botSecret = process.env.BOT_SECRET;

  if (!botApiUrl || !botSecret) {
    return NextResponse.json(
      { error: "BOT_API_URL and BOT_SECRET must be set on the dashboard server" },
      { status: 500 }
    );
  }

  try {
    const url = new URL(`${botApiUrl.replace(/\/$/, "")}/internal/commands`);
    url.searchParams.set("guildId", guildId);

    const resp = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-BOT-SECRET": botSecret,
        "Accept": "application/json",
      },
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: "Bot API error", details: text }, { status: resp.status });
    }

    const data = await resp.json();
    const commands = Array.isArray(data)
      ? data
      : Array.isArray(data.commands)
      ? data.commands
      : [];

    return NextResponse.json(commands, { status: 200 });
  } catch (err) {
    console.error("[api/server/[guildId]/commands] proxy error:", err);
    return NextResponse.json({ error: "Failed to contact bot API" }, { status: 502 });
  }
}
