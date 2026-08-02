const { Events } = require('discord.js');
const { loadAllCustomCommands } = require('../utils/customCommands');
const { registerAllGuildCommands } = require('../utils/registerGuildCommands');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`Ready as ${client.user.tag}`);
    console.log(`Loaded ${client.commands.size} slash commands and ${client.modules.size} modules`);

    try {
      const total = await loadAllCustomCommands(client);
      console.log(`Loaded ${total} runtime custom commands from MongoDB`);
    } catch (error) {
      console.error('Failed to load custom commands:', error);
    }

    try {
      await registerAllGuildCommands(client);
    } catch (error) {
      console.error('Failed to register guild commands:', error);
    }

    client.emit('clientReady');
  },
};
