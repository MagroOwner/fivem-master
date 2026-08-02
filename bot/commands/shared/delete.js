const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const {
  Member,
  Rank,
  Division,
  Territory,
  BusinessLicense,
  CustomCommand,
  ChannelCommand,
  Unit,
} = require('../../models');
const { requireServer, assertPermission } = require('../../utils/serverContext');
const { escapeRegex, loadGuildCustomCommands } = require('../../utils/customCommands');

const MODEL_MAP = {
  member: Member,
  rank: Rank,
  division: Division,
  territory: Territory,
  license: BusinessLicense,
  unit: Unit,
  'division-command': CustomCommand,
  'channel-command': ChannelCommand,
};

module.exports = {
  types: ['shared'],
  data: new SlashCommandBuilder()
    .setName('delete')
    .setDescription('Delete records by type and name')
    .addStringOption((o) =>
      o
        .setName('type')
        .setDescription('Record type')
        .setRequired(true)
        .addChoices(
          { name: 'member', value: 'member' },
          { name: 'rank', value: 'rank' },
          { name: 'division', value: 'division' },
          { name: 'territory', value: 'territory' },
          { name: 'license', value: 'license' },
          { name: 'unit', value: 'unit' },
          { name: 'division-command', value: 'division-command' },
          { name: 'channel-command', value: 'channel-command' },
          { name: 'custom-field', value: 'custom-field' },
          { name: 'tag', value: 'tag' },
          { name: 'embed', value: 'embed' }
        )
    )
    .addStringOption((o) => o.setName('name').setDescription('Record name or field key').setRequired(true))
    .addUserOption((o) => o.setName('user').setDescription('User (for member)').setRequired(false)),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, 'any');
    if (!ctx) return;
    if (!(await assertPermission(interaction, ctx.server, 'delete', 'manageOrg'))) return;

    const type = interaction.options.getString('type', true);
    const name = interaction.options.getString('name', true).trim();
    const user = interaction.options.getUser('user');

    if (type === 'custom-field') {
      if (ctx.server.customFields?.[name] === undefined) {
        await interaction.reply({ content: `Field **${name}** not found.`, flags: MessageFlags.Ephemeral });
        return;
      }
      delete ctx.server.customFields[name];
      ctx.server.markModified('customFields');
      await ctx.server.save();
      await interaction.reply({ content: `Deleted custom field **${name}**.`, flags: MessageFlags.Ephemeral });
      return;
    }

    if (type === 'tag') {
      const before = (ctx.server.tags || []).length;
      ctx.server.tags = (ctx.server.tags || []).filter((t) => t.name.toLowerCase() !== name.toLowerCase());
      if (ctx.server.tags.length === before) {
        await interaction.reply({ content: `Tag **${name}** not found.`, flags: MessageFlags.Ephemeral });
        return;
      }
      await ctx.server.save();
      await interaction.reply({ content: `Deleted tag **${name}**.`, flags: MessageFlags.Ephemeral });
      return;
    }

    if (type === 'embed') {
      const before = (ctx.server.embeds || []).length;
      ctx.server.embeds = (ctx.server.embeds || []).filter((e) => e.name.toLowerCase() !== name.toLowerCase());
      if (ctx.server.embeds.length === before) {
        await interaction.reply({ content: `Embed **${name}** not found.`, flags: MessageFlags.Ephemeral });
        return;
      }
      await ctx.server.save();
      await interaction.reply({ content: `Deleted embed **${name}**.`, flags: MessageFlags.Ephemeral });
      return;
    }

    if (type === 'member') {
      if (!user) {
        await interaction.reply({ content: 'Provide `user` to delete a member.', flags: MessageFlags.Ephemeral });
        return;
      }
      const res = await Member.deleteOne({ guildId: ctx.guildId, userId: user.id });
      await interaction.reply({
        content: res.deletedCount ? `Deleted member ${user}.` : 'Member not found.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const Model = MODEL_MAP[type];
    const res = await Model.deleteOne({
      guildId: ctx.guildId,
      name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
    });
    if (type === 'division-command' || type === 'channel-command') {
      await loadGuildCustomCommands(client, ctx.guildId);
    }
    await interaction.reply({
      content: res.deletedCount ? `Deleted **${type}** \`${name}\`.` : `No matching **${type}** found.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
