const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  types: ['setup'],
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Test bot latency'),
  async execute(interaction, client) {
    const sent = await interaction.reply({
      content: 'Pinging...',
      flags: MessageFlags.Ephemeral,
      fetchReply: true,
    });
    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply(
      `Pong. Roundtrip **${roundtrip}ms** · WebSocket **${client.ws.ping}ms**.`
    );
  },
};
