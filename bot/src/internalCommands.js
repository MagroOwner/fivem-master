import express from 'express';
import { REST, Routes } from 'discord.js';

const BOT_SECRET = process.env.BOT_SECRET;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

/**
 * Local command definitions — the bot's source of truth.
 * Each entry is the clean JSON shape the dashboard renders:
 * { name, description, options }
 */
export const commandDefinitions = [
  {
    name: 'help',
    description: 'Show all available bot commands',
    options: [],
  },
  {
    name: 'roster',
    description: 'View or manage the department roster',
    options: [
      { name: 'member', description: 'Member to look up', type: 6, required: false },
    ],
  },
  {
    name: 'department',
    description: 'Department tools and settings',
    options: [],
  },
];

function normalizeCommand(c) {
  return {
    id: c.id ?? null,
    name: c.name,
    description: c.description || '',
    options: Array.isArray(c.options) ? c.options : [],
  };
}

let rest = null;
function getRest() {
  if (!DISCORD_TOKEN || !CLIENT_ID) return null;
  if (!rest) rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
  return rest;
}

/**
 * Returns a clean JSON list of the bot's commands.
 * Prefers the live list registered with Discord (global, or per guild when
 * guildId is given); falls back to the local definitions when Discord
 * credentials are unavailable or the fetch fails.
 */
export async function getCommands(guildId) {
  const client = getRest();
  if (client) {
    try {
      const route = guildId
        ? Routes.applicationGuildCommands(CLIENT_ID, guildId)
        : Routes.applicationCommands(CLIENT_ID);
      const result = await client.get(route);
      if (Array.isArray(result) && result.length > 0) {
        return result.map(normalizeCommand);
      }
    } catch (err) {
      console.error('getCommands: Discord fetch failed, using local definitions:', err);
    }
  }
  return commandDefinitions.map(normalizeCommand);
}

/**
 * Registers the local command definitions with Discord (per guild when
 * guildId is given, otherwise globally).
 */
export async function syncCommands(guildId) {
  const client = getRest();
  if (!client) {
    throw new Error('DISCORD_TOKEN and CLIENT_ID must be set to sync commands');
  }
  const route = guildId
    ? Routes.applicationGuildCommands(CLIENT_ID, guildId)
    : Routes.applicationCommands(CLIENT_ID);
  const body = commandDefinitions.map(({ name, description, options }) => ({
    name,
    description,
    options,
  }));
  const result = await client.put(route, { body });
  return Array.isArray(result) ? result.map(normalizeCommand) : [];
}

function requireBotSecret(req, res, next) {
  if (!BOT_SECRET || req.header('X-BOT-SECRET') !== BOT_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

const router = express.Router();
router.use(requireBotSecret);

// GET /internal/commands?guildId=<id> -> { commands: [...] }
router.get('/commands', async (req, res) => {
  try {
    const commands = await getCommands(req.query.guildId);
    res.json({ commands });
  } catch (err) {
    console.error('GET /internal/commands error:', err);
    res.status(500).json({ error: 'Failed to fetch commands' });
  }
});

// POST /internal/commands { guildId? } -> registers local definitions with Discord
router.post('/commands', async (req, res) => {
  try {
    const commands = await syncCommands(req.body?.guildId);
    res.json({ ok: true, registered: commands.length, commands });
  } catch (err) {
    console.error('POST /internal/commands error:', err);
    res.status(500).json({ error: 'Failed to register commands' });
  }
});

export default router;
