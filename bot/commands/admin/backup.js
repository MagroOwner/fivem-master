const { SlashCommandBuilder, MessageFlags, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const {
  ServerConfig,
  Division,
  Member,
  Rank,
  Territory,
  BusinessLicense,
  DivisionCommand,
  ChannelCommand,
  CommandPermission,
  Unit,
} = require('../../models');
const { requireServer, assertPermission } = require('../../utils/serverContext');

module.exports = {
  types: ['setup'],
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('Export this server\'s bot data as JSON')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, 'any');
    if (!ctx) return;
    if (!(await assertPermission(interaction, ctx.server, 'backup', 'admin'))) return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const { guildId } = ctx;
    const payload = {
      exportedAt: new Date().toISOString(),
      guildId,
      server: await ServerConfig.findOne({ guildId }).lean(),
      divisions: await Division.find({ guildId }).lean(),
      members: await Member.find({ guildId }).lean(),
      ranks: await Rank.find({ guildId }).lean(),
      territories: await Territory.find({ guildId }).lean(),
      licenses: await BusinessLicense.find({ guildId }).lean(),
      units: await Unit.find({ guildId }).lean(),
      customCommands: await DivisionCommand.find({ guildId }).lean(),
      channelCommands: await ChannelCommand.find({ guildId }).lean(),
      commandPermissions: await CommandPermission.find({ guildId }).lean(),
    };

    const file = new AttachmentBuilder(Buffer.from(JSON.stringify(payload, null, 2), 'utf8'), {
      name: `backup-${guildId}.json`,
    });

    await interaction.editReply({
      content: 'Server backup attached.',
      files: [file],
    });
  },
};
