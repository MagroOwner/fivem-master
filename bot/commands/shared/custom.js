const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { requireServer, assertPermission, successEmbed } = require('../../utils/serverContext');

module.exports = {
  types: ['shared'],
  data: new SlashCommandBuilder()
    .setName('custom')
    .setDescription('Create and manage custom fields')
    .addSubcommand((s) =>
      s
        .setName('set')
        .setDescription('Set a custom field')
        .addStringOption((o) => o.setName('key').setDescription('Field key').setRequired(true))
        .addStringOption((o) => o.setName('value').setDescription('Value').setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName('get')
        .setDescription('Get a custom field')
        .addStringOption((o) => o.setName('key').setDescription('Field key').setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Remove a custom field')
        .addStringOption((o) => o.setName('key').setDescription('Field key').setRequired(true))
    )
    .addSubcommand((s) => s.setName('list').setDescription('List custom fields')),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, 'any');
    if (!ctx) return;
    if (!ctx.server.customFields || typeof ctx.server.customFields !== 'object') {
      ctx.server.customFields = {};
    }

    const sub = interaction.options.getSubcommand();
    if (sub === 'list') {
      const entries = Object.entries(ctx.server.customFields);
      await interaction.reply({
        embeds: [
          successEmbed(
            client,
            ctx.server,
            'Custom fields',
            entries.length ? entries.map(([k, v]) => `**${k}**: ${v}`).join('\n') : 'No custom fields.'
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === 'get') {
      const key = interaction.options.getString('key', true).trim();
      const value = ctx.server.customFields[key];
      await interaction.reply({
        content: value === undefined ? `No value for **${key}**.` : `**${key}**: ${value}`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!(await assertPermission(interaction, ctx.server, 'custom', 'manageOrg'))) return;
    const key = interaction.options.getString('key', true).trim();

    if (sub === 'set') {
      ctx.server.customFields[key] = interaction.options.getString('value', true);
      ctx.server.markModified('customFields');
      await ctx.server.save();
      await interaction.reply({ content: `Set **${key}**.`, flags: MessageFlags.Ephemeral });
      return;
    }

    delete ctx.server.customFields[key];
    ctx.server.markModified('customFields');
    await ctx.server.save();
    await interaction.reply({ content: `Removed **${key}**.`, flags: MessageFlags.Ephemeral });
  },
};
