const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const mongoose = require('mongoose');

module.exports = {
  types: ['setup'],
  data: new SlashCommandBuilder()
    .setName('dbtest')
    .setDescription('Test MongoDB connection'),
  async execute(interaction) {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    const state = states[mongoose.connection.readyState] || 'unknown';

    try {
      if (mongoose.connection.readyState !== 1) {
        await interaction.reply({
          content: `MongoDB state: **${state}**`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      await mongoose.connection.db.admin().ping();
      await interaction.reply({
        content: `MongoDB OK (**${state}**) — ping succeeded.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      await interaction.reply({
        content: `MongoDB error: ${error.message}`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
