const { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { requireServer, assertPermission, successEmbed } = require('../../utils/serverContext');

module.exports = {
  types: ['department'],
  data: new SlashCommandBuilder()
    .setName('callsign-format')
    .setDescription('Configure automatic callsign generation for roster')
    .addSubcommand((s) =>
      s
        .setName('set')
        .setDescription('Set callsign format and starting counter')
        .addStringOption((o) =>
          o.setName('format').setDescription('Prefix e.g. 4W').setRequired(true)
        )
        .addIntegerOption((o) =>
          o.setName('start').setDescription('Starting number e.g. 49').setRequired(true).setMinValue(0)
        )
    )
    .addSubcommand((s) => s.setName('view').setDescription('View current callsign format settings'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, ['department']);
    if (!ctx) return;

    const sub = interaction.options.getSubcommand();

    if (sub === 'view') {
      const format = ctx.server.callsignFormat || '_not set_';
      const counter = ctx.server.callsignCounter ?? 1;
      const preview =
        ctx.server.callsignFormat != null
          ? `\`${ctx.server.callsignFormat}-${counter}\``
          : '_n/a_';
      await interaction.reply({
        embeds: [
          successEmbed(
            client,
            ctx.server,
            'Callsign format',
            `Format: **${format}**\nNext counter: **${counter}**\nNext auto callsign: ${preview}`
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!(await assertPermission(interaction, ctx.server, 'callsign-format', 'manageOrg'))) return;

    const format = interaction.options.getString('format', true).trim();
    const start = interaction.options.getInteger('start', true);

    if (!format) {
      await interaction.reply({
        content: 'Format cannot be empty.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    ctx.server.callsignFormat = format;
    ctx.server.callsignCounter = start;
    await ctx.server.save();

    await interaction.reply({
      content: `Callsign format set to **${format}** starting at **${start}**. First auto callsign: \`${format}-${start}\`.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
