const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { Member, Rank, Division } = require('../../models');
const { requireServer, assertPermission, successEmbed } = require('../../utils/serverContext');
const { escapeRegex } = require('../../utils/customCommands');

module.exports = {
  types: ['business'],
  data: new SlashCommandBuilder()
    .setName('employee')
    .setDescription('Add and manage business employees')
    .addSubcommand((s) =>
      s
        .setName('add')
        .setDescription('Add employee')
        .addUserOption((o) => o.setName('user').setDescription('User').setRequired(true))
        .addStringOption((o) => o.setName('rank').setDescription('Rank name').setRequired(false))
        .addStringOption((o) => o.setName('division').setDescription('Division name').setRequired(false))
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Remove employee')
        .addUserOption((o) => o.setName('user').setDescription('User').setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName('edit')
        .setDescription('Edit employee')
        .addUserOption((o) => o.setName('user').setDescription('User').setRequired(true))
        .addStringOption((o) => o.setName('rank').setDescription('Rank name').setRequired(false))
        .addStringOption((o) => o.setName('division').setDescription('Division name').setRequired(false))
    )
    .addSubcommand((s) => s.setName('list').setDescription('List employees')),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, ['business']);
    if (!ctx) return;
    const sub = interaction.options.getSubcommand();

    if (sub === 'list') {
      const [members, ranks, divisions] = await Promise.all([
        Member.find({ guildId: ctx.guildId, active: true }),
        Rank.find({ guildId: ctx.guildId }),
        Division.find({ guildId: ctx.guildId }),
      ]);
      const rankMap = new Map(ranks.map((r) => [String(r._id), r.name]));
      const divMap = new Map(divisions.map((d) => [String(d._id), d.name]));
      const lines = members.map((m) => {
        const rank = m.rankId ? rankMap.get(String(m.rankId)) : null;
        const div = m.divisionId ? divMap.get(String(m.divisionId)) : null;
        return `<@${m.userId}>${rank ? ` — ${rank}` : ''}${div ? ` (${div})` : ''}`;
      });
      await interaction.reply({
        embeds: [successEmbed(client, ctx.server, 'Employees', lines.join('\n') || 'No employees.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!(await assertPermission(interaction, ctx.server, 'employee', 'manageOrg'))) return;
    const user = interaction.options.getUser('user', true);

    if (sub === 'remove') {
      await Member.deleteOne({ guildId: ctx.guildId, userId: user.id });
      await interaction.reply({ content: `Removed employee ${user}.`, flags: MessageFlags.Ephemeral });
      return;
    }

    let rankId = null;
    let divisionId = null;
    const rankName = interaction.options.getString('rank');
    const divisionName = interaction.options.getString('division');
    if (rankName) {
      const rank = await Rank.findOne({
        guildId: ctx.guildId,
        name: new RegExp(`^${escapeRegex(rankName)}$`, 'i'),
      });
      if (!rank) {
        await interaction.reply({ content: `Rank **${rankName}** not found.`, flags: MessageFlags.Ephemeral });
        return;
      }
      rankId = String(rank._id);
    }
    if (divisionName) {
      const div = await Division.findOne({
        guildId: ctx.guildId,
        name: new RegExp(`^${escapeRegex(divisionName)}$`, 'i'),
      });
      if (!div) {
        await interaction.reply({ content: `Division **${divisionName}** not found.`, flags: MessageFlags.Ephemeral });
        return;
      }
      divisionId = String(div._id);
    }

    let member = await Member.findOne({ guildId: ctx.guildId, userId: user.id });
    if (sub === 'add') {
      if (member) {
        await interaction.reply({ content: `${user} is already an employee.`, flags: MessageFlags.Ephemeral });
        return;
      }
      await Member.create({ guildId: ctx.guildId, userId: user.id, rankId, divisionId });
      await interaction.reply({ content: `Added employee ${user}.`, flags: MessageFlags.Ephemeral });
      return;
    }

    if (!member) {
      await interaction.reply({ content: `${user} is not an employee.`, flags: MessageFlags.Ephemeral });
      return;
    }
    if (rankName) member.rankId = rankId;
    if (divisionName) member.divisionId = divisionId;
    await member.save();
    await interaction.reply({ content: `Updated employee ${user}.`, flags: MessageFlags.Ephemeral });
  },
};
