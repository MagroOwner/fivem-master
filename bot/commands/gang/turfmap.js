const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { Territory } = require('../../models');
const { requireServer, successEmbed } = require('../../utils/serverContext');

module.exports = {
  types: ['gang'],
  data: new SlashCommandBuilder()
    .setName('turfmap')
    .setDescription('Show all gang territories'),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, ['gang']);
    if (!ctx) return;

    const items = await Territory.find({ guildId: ctx.guildId }).sort({ name: 1 });
    const lines = items.map(
      (t, i) =>
        `${i + 1}. **${t.name}**${t.color ? ` \`${t.color}\`` : ''}${t.notes ? `\n   ${t.notes}` : ''}`
    );

    await interaction.reply({
      embeds: [
        successEmbed(
          client,
          ctx.server,
          `${ctx.server.name || 'Gang'} turf map`,
          lines.join('\n\n') || 'No territories claimed yet. Use `/territory add`.'
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};
