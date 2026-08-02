import { Client, GatewayIntentBits, Collection } from "discord.js";
import express from "express";
import { refreshSettings } from "./src/events/dashboardSync.js";
import { loadSettings } from "./src/utils/loadSettings.js";

const app = express();
app.use(express.json());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

client.commands = new Collection();
global.dashboardSettings = {}; // live settings cache

// Load commands dynamically
import fs from "fs";
import path from "path";

const commandsPath = path.join(process.cwd(), "src/commands");
const categories = fs.readdirSync(commandsPath);

for (const category of categories) {
  const categoryPath = path.join(commandsPath, category);
  const files = fs.readdirSync(categoryPath);

  for (const file of files) {
    const command = await import(`./src/commands/${category}/${file}`);
    client.commands.set(command.default.name, command.default);
  }
}

// Dashboard sync webhook
app.post("/bot-sync", async (req, res) => {
  const { guildId } = req.body;
  await refreshSettings(guildId);
  res.json({ success: true });
});

// Slash command handler
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  const guildId = interaction.guild.id;

  // Load settings (cached or fresh)
  const config =
    global.dashboardSettings[guildId] ||
    (global.dashboardSettings[guildId] = await loadSettings(guildId));

  interaction.dashboardSettings = config.settings || {};

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    interaction.reply("Error executing command.");
  }
});

client.login(process.env.BOT_TOKEN);

// Start webhook server
app.listen(3001, () => console.log("Bot sync webhook running on port 3001"));
