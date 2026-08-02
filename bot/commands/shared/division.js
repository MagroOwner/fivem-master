const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { Division } = require('../../models');
const { requireServer, assertPermission, successEmbed } = require('../../utils/serverContext');
const { escapeRegex } = require('../../utils/customCommands');

module.exports = {
  types: ['shared'],
  data: new SlashCommandBuilder()
    .setName('division')
    .setDescription('Create and manage divisions')
    .addSubcommand((s) =>
      s
        .setName('add')
        .setDescription('Add a division')
        .addStringOption((o) => o.setName('name').setDescription('Name').setRequired(true))
        .addStringOption((o) => o.setName('description').setDescription('Description').setRequired(false))
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Remove a division')
        .addStringOption((o) => o.setName('name').setDescription('Name').setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName('edit')
        .setDescription('Edit a division')
        .addStringOption((o) => o.setName('name').setDescription('Current name').setRequired(true))
        .addStringOption((o) => o.setName('new_name').setDescription('New name').setRequired(false))
        .addStringOption((o) => o.setName('description').setDescription('Description').setRequired(false))
    )
    .addSubcommand((s) => s.setName('list').setDescription('List divisions')),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, 'any');
    if (!ctx) return;
    const sub = interaction.options.getSubcommand();

    if (sub === 'list') {
      const items = await Division.find({ guildId: ctx.guildId });
      const lines = items.map(
        (d) =>
          `**${d.name}**${d.channelId ? ` — <#${d.channelId}>` : ''}${d.description ? ` — ${d.description}` : ''}${d.enabled === false ? ' _(disabled)_' : ''}`
      );
      await interaction.reply({
        embeds: [successEmbed(client, ctx.server, 'Divisions', lines.join('\n') || 'No divisions yet.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!(await assertPermission(interaction, ctx.server, 'division', 'manageOrg'))) return;

    if (sub === 'add') {
      const name = interaction.options.getString('name', true).trim();
      try {
        await Division.create({
          guildId: ctx.guildId,
          name,
          description: interaction.options.getString('description'),
        });
      } catch {
        await interaction.reply({ content: `Division **${name}** already exists.`, flags: MessageFlags.Ephemeral });
        return;
      }
      await interaction.reply({ content: `Added division **${name}**.`, flags: MessageFlags.Ephemeral });
      return;
    }

    const name = interaction.options.getString('name', true).trim();
    const division = await Division.findOne({
      guildId: ctx.guildId,
      name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
    });
    if (!division) {
      await interaction.reply({ content: `Division **${name}** not found.`, flags: MessageFlags.Ephemeral });
      return;
    }

    if (sub === 'remove') {
      await division.deleteOne();
      await interaction.reply({ content: `Removed division **${name}**.`, flags: MessageFlags.Ephemeral });
      return;
    }

    const newName = interaction.options.getString('new_name');
    const description = interaction.options.getString('description');
    if (newName) division.name = newName.trim();
    if (description !== null) division.description = description;
    await division.save();
    await interaction.reply({ content: `Updated division **${division.name}**.`, flags: MessageFlags.Ephemeral });
  },
};
