const { Events, MessageFlags } = require('discord.js');
const { checkCommandPermission } = require('../utils/permissionMiddleware');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      await interaction.reply({
        content: 'Unknown command.',
        flags: MessageFlags.Ephemeral,
      }).catch(() => {});
      return;
    }

    try {
      const allowed = await checkCommandPermission(interaction);
      if (!allowed) {
        return;
      }

      await command.execute(interaction, client);
    } catch (error) {
      console.error(`Error running /${interaction.commandName}:`, error);
      const payload = {
        content: 'Something went wrong while running that command.',
        flags: MessageFlags.Ephemeral,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  },
};
