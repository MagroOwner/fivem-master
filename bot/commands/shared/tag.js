const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { requireServer, assertPermission, successEmbed } = require('../../utils/serverContext');
const { createId } = require('../../utils/ids');

module.exports = {
  types: ['shared'],
  data: new SlashCommandBuilder()
    .setName('tag')
    .setDescription('Create quick response tags')
    .addSubcommand((s) =>
      s
        .setName('add')
        .setDescription('Add a tag')
        .addStringOption((o) => o.setName('name').setDescription('Tag name').setRequired(true))
        .addStringOption((o) => o.setName('response').setDescription('Response').setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Remove a tag')
        .addStringOption((o) => o.setName('name').setDescription('Tag name').setRequired(true))
    )
    .addSubcommand((s) => s.setName('list').setDescription('List tags'))
    .addSubcommand((s) =>
      s
        .setName('use')
        .setDescription('Post a tag response')
        .addStringOption((o) => o.setName('name').setDescription('Tag name').setRequired(true))
    ),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, 'any');
    if (!ctx) return;
    if (!Array.isArray(ctx.server.tags)) ctx.server.tags = [];

    const sub = interaction.options.getSubcommand();

    if (sub === 'list') {
      const lines = ctx.server.tags.map((t) => `**${t.name}** — ${t.response}`);
      await interaction.reply({
        embeds: [successEmbed(client, ctx.server, 'Tags', lines.join('\n') || 'No tags.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === 'use') {
      const name = interaction.options.getString('name', true).trim();
      const tag = ctx.server.tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
      if (!tag) {
        await interaction.reply({ content: `Tag **${name}** not found.`, flags: MessageFlags.Ephemeral });
        return;
      }
      await interaction.reply({ content: tag.response });
      return;
    }

    if (!(await assertPermission(interaction, ctx.server, 'tag', 'manageOrg'))) return;

    if (sub === 'add') {
      const name = interaction.options.getString('name', true).trim().toLowerCase();
      if (ctx.server.tags.some((t) => t.name === name)) {
        await interaction.reply({ content: `Tag **${name}** already exists.`, flags: MessageFlags.Ephemeral });
        return;
      }
      ctx.server.tags.push({
        id: createId('tag'),
        name,
        response: interaction.options.getString('response', true),
        createdBy: interaction.user.id,
      });
      await ctx.server.save();
      await interaction.reply({ content: `Added tag **${name}**.`, flags: MessageFlags.Ephemeral });
      return;
    }

    const name = interaction.options.getString('name', true).trim();
    const before = ctx.server.tags.length;
    ctx.server.tags = ctx.server.tags.filter((t) => t.name.toLowerCase() !== name.toLowerCase());
    if (ctx.server.tags.length === before) {
      await interaction.reply({ content: `Tag **${name}** not found.`, flags: MessageFlags.Ephemeral });
      return;
    }
    await ctx.server.save();
    await interaction.reply({ content: `Removed tag **${name}**.`, flags: MessageFlags.Ephemeral });
  },
};
