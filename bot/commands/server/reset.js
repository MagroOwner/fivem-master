const { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const {
  ServerConfig,
  Division,
  Member,
  Rank,
  Territory,
  BusinessLicense,
  CustomCommand,
  DivisionCommand,
  ChannelCommand,
  CommandPermission,
  Unit,
  Roster,
} = require('../../models');
const { requireServer, assertPermission } = require('../../utils/serverContext');
const { loadGuildCustomCommands } = require('../../utils/customCommands');
const { registerGuildCommands } = require('../../utils/registerGuildCommands');

module.exports = {
  types: ['shared'],
  data: new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Wipe all bot data for this server (admin only)')
    .addBooleanOption((o) =>
      o.setName('confirm').setDescription('Must be true to wipe').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, 'any');
    if (!ctx) {
      return;
    }
    if (!(await assertPermission(interaction, ctx.server, 'reset', 'admin'))) {
      return;
    }

    if (!interaction.options.getBoolean('confirm', true)) {
      await interaction.reply({
        content: 'Set `confirm: True` to wipe this server\'s data.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const { guildId } = ctx;
    await Promise.all([
      ServerConfig.deleteMany({ guildId }),
      Division.deleteMany({ guildId }),
      Member.deleteMany({ guildId }),
      Rank.deleteMany({ guildId }),
      Territory.deleteMany({ guildId }),
      BusinessLicense.deleteMany({ guildId }),
      CustomCommand.deleteMany({ guildId }),
      DivisionCommand.deleteMany({ guildId }),
      ChannelCommand.deleteMany({ guildId }),
      CommandPermission.deleteMany({ guildId }),
      Unit.deleteMany({ guildId }),
      Roster.deleteMany({ guildId }),
    ]);

    await loadGuildCustomCommands(client, guildId);
    await registerGuildCommands(client, guildId, null);

    await interaction.reply({
      content: 'All bot data for this server has been wiped. Run `/setup` to start again.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
