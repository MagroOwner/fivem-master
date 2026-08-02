const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { Rank } = require('../../models');
const { requireServer, assertPermission, successEmbed } = require('../../utils/serverContext');
const { escapeRegex } = require('../../utils/customCommands');

module.exports = {
  types: ['shared'],
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Create and manage rank hierarchy')
    .addSubcommand((s) =>
      s
        .setName('add')
        .setDescription('Add a rank')
        .addStringOption((o) => o.setName('name').setDescription('Rank name').setRequired(true))
        .addRoleOption((o) => o.setName('role').setDescription('Discord role').setRequired(false))
        .addIntegerOption((o) => o.setName('order').setDescription('Sort order').setRequired(false))
        .addStringOption((o) =>
          o.setName('permissions').setDescription('Comma-separated permissions').setRequired(false)
        )
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Remove a rank')
        .addStringOption((o) => o.setName('name').setDescription('Rank name').setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName('edit')
        .setDescription('Edit a rank')
        .addStringOption((o) => o.setName('name').setDescription('Current name').setRequired(true))
        .addStringOption((o) => o.setName('new_name').setDescription('New name').setRequired(false))
        .addRoleOption((o) => o.setName('role').setDescription('Discord role').setRequired(false))
        .addIntegerOption((o) => o.setName('order').setDescription('Sort order').setRequired(false))
    )
    .addSubcommand((s) => s.setName('list').setDescription('List ranks')),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, 'any');
    if (!ctx) return;
    const sub = interaction.options.getSubcommand();

    if (sub === 'list') {
      const ranks = await Rank.find({ guildId: ctx.guildId }).sort({ order: 1 });
      const lines = ranks.map(
        (r) =>
          `**${r.name}** (order ${r.order})` +
          (r.roleId ? ` — <@&${r.roleId}>` : '') +
          (r.permissions?.length ? ` — \`${r.permissions.join(', ')}\`` : '')
      );
      await interaction.reply({
        embeds: [successEmbed(client, ctx.server, 'Ranks', lines.join('\n') || 'No ranks yet.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!(await assertPermission(interaction, ctx.server, 'rank', 'manageOrg'))) return;

    if (sub === 'add') {
      const name = interaction.options.getString('name', true).trim();
      const role = interaction.options.getRole('role');
      const order = interaction.options.getInteger('order') ?? (await Rank.countDocuments({ guildId: ctx.guildId }));
      const permissionsRaw = interaction.options.getString('permissions');
      const permissions = permissionsRaw
        ? permissionsRaw.split(',').map((p) => p.trim()).filter(Boolean)
        : [];
      try {
        await Rank.create({
          guildId: ctx.guildId,
          name,
          roleId: role?.id || null,
          order,
          permissions,
        });
      } catch {
        await interaction.reply({ content: `Rank **${name}** already exists.`, flags: MessageFlags.Ephemeral });
        return;
      }
      await interaction.reply({ content: `Added rank **${name}**.`, flags: MessageFlags.Ephemeral });
      return;
    }

    const name = interaction.options.getString('name', true).trim();
    const rank = await Rank.findOne({
      guildId: ctx.guildId,
      name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
    });
    if (!rank) {
      await interaction.reply({ content: `Rank **${name}** not found.`, flags: MessageFlags.Ephemeral });
      return;
    }

    if (sub === 'remove') {
      await rank.deleteOne();
      await interaction.reply({ content: `Removed rank **${name}**.`, flags: MessageFlags.Ephemeral });
      return;
    }

    const newName = interaction.options.getString('new_name');
    const role = interaction.options.getRole('role');
    const order = interaction.options.getInteger('order');
    if (newName) rank.name = newName.trim();
    if (role) rank.roleId = role.id;
    if (order !== null) rank.order = order;
    await rank.save();
    await interaction.reply({ content: `Updated rank **${rank.name}**.`, flags: MessageFlags.Ephemeral });
  },
};
