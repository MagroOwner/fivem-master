const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { Territory } = require('../../models');
const { requireServer, assertPermission, successEmbed } = require('../../utils/serverContext');
const { escapeRegex } = require('../../utils/customCommands');

module.exports = {
  types: ['gang'],
  data: new SlashCommandBuilder()
    .setName('territory')
    .setDescription('Create and manage gang territories')
    .addSubcommand((s) =>
      s
        .setName('add')
        .setDescription('Add a territory')
        .addStringOption((o) => o.setName('name').setDescription('Name').setRequired(true))
        .addStringOption((o) => o.setName('notes').setDescription('Notes').setRequired(false))
        .addStringOption((o) => o.setName('color').setDescription('Color hex').setRequired(false))
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Remove a territory')
        .addStringOption((o) => o.setName('name').setDescription('Name').setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName('edit')
        .setDescription('Edit a territory')
        .addStringOption((o) => o.setName('name').setDescription('Name').setRequired(true))
        .addStringOption((o) => o.setName('notes').setDescription('Notes').setRequired(false))
        .addStringOption((o) => o.setName('color').setDescription('Color hex').setRequired(false))
    )
    .addSubcommand((s) => s.setName('list').setDescription('List territories')),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, ['gang']);
    if (!ctx) return;
    const sub = interaction.options.getSubcommand();

    if (sub === 'list') {
      const items = await Territory.find({ guildId: ctx.guildId });
      const lines = items.map(
        (t) => `**${t.name}**${t.color ? ` (${t.color})` : ''}${t.notes ? ` — ${t.notes}` : ''}`
      );
      await interaction.reply({
        embeds: [successEmbed(client, ctx.server, 'Territories', lines.join('\n') || 'No territories.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!(await assertPermission(interaction, ctx.server, 'territory', 'manageOrg'))) return;

    if (sub === 'add') {
      const name = interaction.options.getString('name', true).trim();
      try {
        await Territory.create({
          guildId: ctx.guildId,
          name,
          notes: interaction.options.getString('notes'),
          color: interaction.options.getString('color'),
        });
      } catch {
        await interaction.reply({ content: `Territory **${name}** already exists.`, flags: MessageFlags.Ephemeral });
        return;
      }
      await interaction.reply({ content: `Added territory **${name}**.`, flags: MessageFlags.Ephemeral });
      return;
    }

    const name = interaction.options.getString('name', true).trim();
    const item = await Territory.findOne({ guildId: ctx.guildId, name: new RegExp(`^${escapeRegex(name)}$`, 'i') });
    if (!item) {
      await interaction.reply({ content: `Territory **${name}** not found.`, flags: MessageFlags.Ephemeral });
      return;
    }

    if (sub === 'remove') {
      await item.deleteOne();
      await interaction.reply({ content: `Removed territory **${name}**.`, flags: MessageFlags.Ephemeral });
      return;
    }

    const notes = interaction.options.getString('notes');
    const color = interaction.options.getString('color');
    if (notes !== null) item.notes = notes;
    if (color !== null) item.color = color;
    await item.save();
    await interaction.reply({ content: `Updated territory **${item.name}**.`, flags: MessageFlags.Ephemeral });
  },
};
