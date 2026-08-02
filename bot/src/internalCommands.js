import express from 'express';
import { REST, Routes } from 'discord.js';

const router = express.Router();

const BOT_SECRET = process.env.BOT_SECRET;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!BOT_SECRET) {
  console.warn('BOT_SECRET is not set on the bot. Internal endpoints will reject requests.');
}
if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.warn('DISCORD_TOKEN and CLIENT_ID should be set to fetch commands from Discord.');
}

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

// GET /internal/commands?guildId=<id>
// Auth: X-BOT-SECRET header must match BOT_SECRET
router.get('/commands', async (req, res) => {
  try {
    const incoming = req.header('X-BOT-SECRET');
    if (!BOT_SECRET || incoming !== BOT_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const guildId = req.query.guildId;
    if (!DISCORD_TOKEN || !CLIENT_ID) {
      return res.status(500).json({ error: 'Bot not configured (DISCORD_TOKEN / CLIENT_ID missing)' });
    }

    let result;
    if (guildId) {
      // fetch guild-specific commands
      result = await rest.get(Routes.applicationGuildCommands(CLIENT_ID, guildId));
    } else {
      // fetch global application commands
      result = await rest.get(Routes.applicationCommands(CLIENT_ID));
    }

    return res.json(result);
  } catch (err) {
    console.error('internalCommands GET error:', err);
    return res.status(500).json({ error: 'Failed to fetch commands', details: String(err) });
  }
});

// POST /internal/commands
// Body: { commands: [ ... ], guildId?: "<id>" }
// Auth: X-BOT-SECRET
router.post('/commands', express.json(), async (req, res) => {
  try {
    const incoming = req.header('X-BOT-SECRET');
    if (!BOT_SECRET || incoming !== BOT_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const commands = req.body?.commands;
    if (!Array.isArray(commands)) {
      return res.status(400).json({ error: 'Request must include commands array in body' });
    }

    const guildId = req.body?.guildId;
    if (!DISCORD_TOKEN || !CLIENT_ID) {
      return res.status(500).json({ error: 'Bot not configured (DISCORD_TOKEN / CLIENT_ID missing)' });
    }

    let result;
    if (guildId) {
      result = await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guildId), { body: commands });
    } else {
      result = await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    }

    return res.json({ ok: true, registered: (Array.isArray(result) ? result.length : commands.length) });
  } catch (err) {
    console.error('internalCommands POST error:', err);
    return res.status(500).json({ error: 'Failed to register commands', details: String(err) });
  }
});

export default router;
