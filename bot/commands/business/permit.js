const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { BusinessLicense } = require('../../models');
const { requireServer, assertPermission, successEmbed } = require('../../utils/serverContext');
const { escapeRegex } = require('../../utils/customCommands');

module.exports = {
  types: ['business'],
  data: new SlashCommandBuilder()
    .setName('permit')
    .setDescription('Create and manage business permits')
    .addSubcommand((s) =>
      s
        .setName('add')
        .setDescription('Add a permit')
        .addStringOption((o) => o.setName('name').setDescription('Name').setRequired(true))
        .addStringOption((o) => o.setName('number').setDescription('Number').setRequired(false))
        .addStringOption((o) => o.setName('notes').setDescription('Notes').setRequired(false))
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Remove a permit')
        .addStringOption((o) => o.setName('name').setDescription('Name').setRequired(true))
    )
    .addSubcommand((s) => s.setName('list').setDescription('List permits')),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, ['business']);
    if (!ctx) return;
    const sub = interaction.options.getSubcommand();
    const kind = 'permit';

    if (sub === 'list') {
      const items = await BusinessLicense.find({ guildId: ctx.guildId, kind });
      const lines = items.map(
        (i) => `**${i.name}**${i.number ? ` (#${i.number})` : ''}${i.notes ? ` — ${i.notes}` : ''}`
      );
      await interaction.reply({
        embeds: [successEmbed(client, ctx.server, 'Permits', lines.join('\n') || 'No permits.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!(await assertPermission(interaction, ctx.server, 'permit', 'manageOrg'))) return;

    if (sub === 'add') {
      const itemName = interaction.options.getString('name', true).trim();
      try {
        await BusinessLicense.create({
          guildId: ctx.guildId,
          name: itemName,
          number: interaction.options.getString('number'),
          notes: interaction.options.getString('notes'),
          kind,
        });
      } catch {
        await interaction.reply({
          content: `Permit **${itemName}** already exists.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      await interaction.reply({ content: `Added permit **${itemName}**.`, flags: MessageFlags.Ephemeral });
      return;
    }

    const itemName = interaction.options.getString('name', true).trim();
    const res = await BusinessLicense.deleteOne({
      guildId: ctx.guildId,
      kind,
      name: new RegExp(`^${escapeRegex(itemName)}$`, 'i'),
    });
    await interaction.reply({
      content: res.deletedCount
        ? `Removed permit **${itemName}**.`
        : `Permit **${itemName}** not found.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
