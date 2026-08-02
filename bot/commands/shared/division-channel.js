const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { Division } = require('../../models');
const { requireServer, assertPermission } = require('../../utils/serverContext');
const { escapeRegex } = require('../../utils/customCommands');

module.exports = {
  types: ['shared'],
  data: new SlashCommandBuilder()
    .setName('division-channel')
    .setDescription('Bind a division to a specific channel')
    .addSubcommand((s) =>
      s
        .setName('set')
        .setDescription('Bind division to channel')
        .addStringOption((o) => o.setName('division').setDescription('Division name').setRequired(true))
        .addChannelOption((o) => o.setName('channel').setDescription('Channel').setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName('clear')
        .setDescription('Unbind division channel')
        .addStringOption((o) => o.setName('division').setDescription('Division name').setRequired(true))
    ),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, 'any');
    if (!ctx) return;
    if (!(await assertPermission(interaction, ctx.server, 'division-channel', 'manageOrg'))) return;

    const name = interaction.options.getString('division', true).trim();
    const division = await Division.findOne({
      guildId: ctx.guildId,
      name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
    });
    if (!division) {
      await interaction.reply({ content: `Division **${name}** not found.`, flags: MessageFlags.Ephemeral });
      return;
    }

    const sub = interaction.options.getSubcommand();
    if (sub === 'set') {
      const channel = interaction.options.getChannel('channel', true);
      division.channelId = channel.id;
      await division.save();
      await interaction.reply({
        content: `Bound **${division.name}** to ${channel}.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    division.channelId = null;
    await division.save();
    await interaction.reply({
      content: `Cleared channel binding for **${division.name}**.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
