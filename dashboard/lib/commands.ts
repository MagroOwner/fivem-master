export interface CommandOption {
  name: string;
  description: string;
  type?: number;
  required?: boolean;
}

export interface BotCommand {
  id: string | null;
  name: string;
  description: string;
  options: CommandOption[];
}

/**
 * Fetches the bot's command list from its internal API.
 *
 * Environment (dashboard server only, never exposed to the client):
 * - BOT_API_URL: base URL of the bot's HTTP server (e.g. http://localhost:3001)
 * - BOT_SECRET: shared secret sent as the X-BOT-SECRET header
 */
export async function fetchBotCommands(guildId?: string): Promise<BotCommand[]> {
  const botApiUrl = process.env.BOT_API_URL;
  const botSecret = process.env.BOT_SECRET;

  if (!botApiUrl || !botSecret) {
    throw new Error("BOT_API_URL and BOT_SECRET must be set on the dashboard server");
  }

  const url = new URL(`${botApiUrl.replace(/\/$/, "")}/internal/commands`);
  if (guildId) url.searchParams.set("guildId", guildId);

  const resp = await fetch(url, {
    headers: {
      "X-BOT-SECRET": botSecret,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Bot API responded ${resp.status}: ${text}`);
  }

  const data = await resp.json();
  return Array.isArray(data?.commands) ? data.commands : [];
}
