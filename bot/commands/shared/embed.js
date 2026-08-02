const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');
const { requireServer, assertPermission, successEmbed, parseColor } = require('../../utils/serverContext');
const { createId } = require('../../utils/ids');

module.exports = {
  types: ['shared'],
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Create and send custom embeds')
    .addSubcommand((s) =>
      s
        .setName('create')
        .setDescription('Save an embed')
        .addStringOption((o) => o.setName('name').setDescription('Embed name').setRequired(true))
        .addStringOption((o) => o.setName('title').setDescription('Title').setRequired(true))
        .addStringOption((o) => o.setName('description').setDescription('Description').setRequired(true))
        .addStringOption((o) => o.setName('color').setDescription('Hex color').setRequired(false))
        .addStringOption((o) => o.setName('footer').setDescription('Footer').setRequired(false))
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Remove a saved embed')
        .addStringOption((o) => o.setName('name').setDescription('Embed name').setRequired(true))
    )
    .addSubcommand((s) => s.setName('list').setDescription('List saved embeds'))
    .addSubcommand((s) =>
      s
        .setName('send')
        .setDescription('Send a saved embed')
        .addStringOption((o) => o.setName('name').setDescription('Embed name').setRequired(true))
    ),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, 'any');
    if (!ctx) return;
    if (!Array.isArray(ctx.server.embeds)) ctx.server.embeds = [];

    const sub = interaction.options.getSubcommand();

    if (sub === 'list') {
      const lines = ctx.server.embeds.map((e) => `**${e.name}** — ${e.title}`);
      await interaction.reply({
        embeds: [successEmbed(client, ctx.server, 'Embeds', lines.join('\n') || 'No saved embeds.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === 'send') {
      const name = interaction.options.getString('name', true).trim();
      const saved = ctx.server.embeds.find((e) => e.name.toLowerCase() === name.toLowerCase());
      if (!saved) {
        await interaction.reply({ content: `Embed **${name}** not found.`, flags: MessageFlags.Ephemeral });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(parseColor(saved.color || ctx.server.color, client.config.embedColor))
        .setTitle(saved.title)
        .setDescription(saved.description);
      if (saved.footer) embed.setFooter({ text: saved.footer });
      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (!(await assertPermission(interaction, ctx.server, 'embed', 'manageOrg'))) return;

    if (sub === 'create') {
      const name = interaction.options.getString('name', true).trim().toLowerCase();
      if (ctx.server.embeds.some((e) => e.name === name)) {
        await interaction.reply({ content: `Embed **${name}** already exists.`, flags: MessageFlags.Ephemeral });
        return;
      }
      ctx.server.embeds.push({
        id: createId('embed'),
        name,
        title: interaction.options.getString('title', true),
        description: interaction.options.getString('description', true),
        color: interaction.options.getString('color'),
        footer: interaction.options.getString('footer'),
        createdBy: interaction.user.id,
      });
      await ctx.server.save();
      await interaction.reply({ content: `Saved embed **${name}**.`, flags: MessageFlags.Ephemeral });
      return;
    }

    const name = interaction.options.getString('name', true).trim();
    const before = ctx.server.embeds.length;
    ctx.server.embeds = ctx.server.embeds.filter((e) => e.name.toLowerCase() !== name.toLowerCase());
    if (ctx.server.embeds.length === before) {
      await interaction.reply({ content: `Embed **${name}** not found.`, flags: MessageFlags.Ephemeral });
      return;
    }
    await ctx.server.save();
    await interaction.reply({ content: `Removed embed **${name}**.`, flags: MessageFlags.Ephemeral });
  },
};
