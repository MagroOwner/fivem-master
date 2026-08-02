const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { requireServer, assertPermission, successEmbed } = require('../../utils/serverContext');

module.exports = {
  types: ['shared'],
  data: new SlashCommandBuilder()
    .setName('module-toggle')
    .setDescription('Enable or disable type modules for this server')
    .addStringOption((o) =>
      o
        .setName('module')
        .setDescription('Module to toggle')
        .setRequired(true)
        .addChoices(
          { name: 'department', value: 'department' },
          { name: 'gang', value: 'gang' },
          { name: 'business', value: 'business' }
        )
    )
    .addBooleanOption((o) =>
      o.setName('enabled').setDescription('Enable or disable').setRequired(true)
    ),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, 'any');
    if (!ctx) {
      return;
    }
    if (!(await assertPermission(interaction, ctx.server, 'module-toggle', 'manageOrg'))) {
      return;
    }

    const mod = interaction.options.getString('module', true);
    const enabled = interaction.options.getBoolean('enabled', true);

    // Primary server type module cannot be disabled while that type is active
    if (mod === ctx.server.type && !enabled) {
      await interaction.reply({
        content: `Cannot disable the active **${mod}** module. Change type with \`/setup\` first.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    ctx.server.modules[mod] = enabled;
    // Keep only the active type enabled by default; allow extras only if explicitly enabled
    await ctx.server.save();

    await interaction.reply({
      embeds: [
        successEmbed(
          client,
          ctx.server,
          'Module updated',
          `Module **${mod}** is now **${enabled ? 'enabled' : 'disabled'}**.`
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};
