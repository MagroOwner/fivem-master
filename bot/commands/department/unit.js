const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { Unit, Division } = require('../../models');
const { requireServer, assertPermission, successEmbed } = require('../../utils/serverContext');
const { escapeRegex } = require('../../utils/customCommands');

module.exports = {
  types: ['department'],
  data: new SlashCommandBuilder()
    .setName('unit')
    .setDescription('Create and manage department units')
    .addSubcommand((s) =>
      s
        .setName('add')
        .setDescription('Add unit')
        .addStringOption((o) => o.setName('name').setDescription('Unit name').setRequired(true))
        .addStringOption((o) => o.setName('description').setDescription('Description').setRequired(false))
        .addStringOption((o) => o.setName('division').setDescription('Parent division name').setRequired(false))
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Remove unit')
        .addStringOption((o) => o.setName('name').setDescription('Unit name').setRequired(true))
    )
    .addSubcommand((s) => s.setName('list').setDescription('List units')),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, ['department']);
    if (!ctx) return;
    const sub = interaction.options.getSubcommand();

    if (sub === 'list') {
      const units = await Unit.find({ guildId: ctx.guildId });
      const lines = units.map(
        (u) => `**${u.name}**${u.description ? ` — ${u.description}` : ''}`
      );
      await interaction.reply({
        embeds: [successEmbed(client, ctx.server, 'Units', lines.join('\n') || 'No units yet.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!(await assertPermission(interaction, ctx.server, 'unit', 'manageOrg'))) return;

    if (sub === 'add') {
      const name = interaction.options.getString('name', true).trim();
      let divisionId = null;
      const divisionName = interaction.options.getString('division');
      if (divisionName) {
        const div = await Division.findOne({
          guildId: ctx.guildId,
          name: new RegExp(`^${escapeRegex(divisionName)}$`, 'i'),
        });
        if (!div) {
          await interaction.reply({
            content: `Division **${divisionName}** not found.`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        divisionId = String(div._id);
      }
      try {
        await Unit.create({
          guildId: ctx.guildId,
          name,
          description: interaction.options.getString('description'),
          divisionId,
        });
      } catch {
        await interaction.reply({ content: `Unit **${name}** already exists.`, flags: MessageFlags.Ephemeral });
        return;
      }
      await interaction.reply({ content: `Added unit **${name}**.`, flags: MessageFlags.Ephemeral });
      return;
    }

    const name = interaction.options.getString('name', true).trim();
    const res = await Unit.deleteOne({
      guildId: ctx.guildId,
      name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
    });
    await interaction.reply({
      content: res.deletedCount ? `Removed unit **${name}**.` : `Unit **${name}** not found.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
