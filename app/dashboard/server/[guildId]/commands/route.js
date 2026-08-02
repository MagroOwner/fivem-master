import { NextResponse } from "next/server";

/**
 * GET /dashboard/server/[guildId]/commands
 *
 * This route no longer calls Discord directly. It forwards the request to the bot
 * service at BOT_API_URL and includes BOT_SECRET in the X-BOT-SECRET header.
 *
 * Environment:
 * - BOT_API_URL (e.g. https://bot.example.com)
 * - BOT_SECRET
 */
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
        "Accept": "application/json"
      }
    });

    const text = await resp.text();
    const status = resp.status;

    // Proxy back bot response (attempt to parse JSON, fallback to text)
    try {
      const json = JSON.parse(text);
      return NextResponse.json(json, { status });
    } catch {
      return new NextResponse(text, { status, headers: { "Content-Type": "text/plain" } });
    }
  } catch (err) {
    console.error("Commands proxy error:", err);
    return NextResponse.json({ error: "Failed to contact bot API" }, { status: 502 });
  }
}
