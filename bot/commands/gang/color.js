const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { requireServer, assertPermission, successEmbed } = require('../../utils/serverContext');

module.exports = {
  types: ['gang'],
  data: new SlashCommandBuilder()
    .setName('color')
    .setDescription('Set gang color / theme')
    .addStringOption((o) =>
      o.setName('hex').setDescription('Hex color e.g. #FF0000').setRequired(true)
    ),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, ['gang']);
    if (!ctx) return;
    if (!(await assertPermission(interaction, ctx.server, 'color', 'manageOrg'))) return;

    let hex = interaction.options.getString('hex', true).trim();
    if (!hex.startsWith('#')) hex = `#${hex}`;
    ctx.server.color = hex;
    await ctx.server.save();

    await interaction.reply({
      embeds: [successEmbed(client, ctx.server, 'Gang color', `Theme color set to **${hex}**.`)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
