const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { Member, Rank, Division } = require('../../models');
const { requireServer, assertPermission, successEmbed } = require('../../utils/serverContext');
const { escapeRegex } = require('../../utils/customCommands');

module.exports = {
  types: ['shared'],
  data: new SlashCommandBuilder()
    .setName('member')
    .setDescription('Add and manage organization members')
    .addSubcommand((s) =>
      s
        .setName('add')
        .setDescription('Add member')
        .addUserOption((o) => o.setName('user').setDescription('User').setRequired(true))
        .addStringOption((o) => o.setName('rank').setDescription('Rank').setRequired(false))
        .addStringOption((o) => o.setName('division').setDescription('Division').setRequired(false))
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Remove member')
        .addUserOption((o) => o.setName('user').setDescription('User').setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName('edit')
        .setDescription('Edit member')
        .addUserOption((o) => o.setName('user').setDescription('User').setRequired(true))
        .addStringOption((o) => o.setName('rank').setDescription('Rank').setRequired(false))
        .addStringOption((o) => o.setName('division').setDescription('Division').setRequired(false))
    )
    .addSubcommand((s) => s.setName('list').setDescription('List members')),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, 'any');
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
        const bits = [`<@${m.userId}>`];
        if (m.badge) bits.push(`#${m.badge}`);
        if (m.callsign) bits.push(m.callsign);
        if (m.rankId) bits.push(rankMap.get(String(m.rankId)) || '?');
        if (m.divisionId) bits.push(divMap.get(String(m.divisionId)) || '?');
        return bits.join(' · ');
      });
      await interaction.reply({
        embeds: [successEmbed(client, ctx.server, 'Members', lines.join('\n') || 'No members.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!(await assertPermission(interaction, ctx.server, 'member', 'manageOrg'))) return;
    const user = interaction.options.getUser('user', true);

    async function resolveRefs() {
      let rankId;
      let divisionId;
      const rankName = interaction.options.getString('rank');
      const divisionName = interaction.options.getString('division');
      if (rankName) {
        const rank = await Rank.findOne({
          guildId: ctx.guildId,
          name: new RegExp(`^${escapeRegex(rankName)}$`, 'i'),
        });
        if (!rank) return { error: `Rank **${rankName}** not found.` };
        rankId = String(rank._id);
      }
      if (divisionName) {
        const div = await Division.findOne({
          guildId: ctx.guildId,
          name: new RegExp(`^${escapeRegex(divisionName)}$`, 'i'),
        });
        if (!div) return { error: `Division **${divisionName}** not found.` };
        divisionId = String(div._id);
      }
      return { rankId, divisionId, rankName, divisionName };
    }

    if (sub === 'remove') {
      await Member.deleteOne({ guildId: ctx.guildId, userId: user.id });
      await interaction.reply({ content: `Removed member ${user}.`, flags: MessageFlags.Ephemeral });
      return;
    }

    const refs = await resolveRefs();
    if (refs.error) {
      await interaction.reply({ content: refs.error, flags: MessageFlags.Ephemeral });
      return;
    }

    let member = await Member.findOne({ guildId: ctx.guildId, userId: user.id });
    if (sub === 'add') {
      if (member) {
        await interaction.reply({ content: `${user} is already a member.`, flags: MessageFlags.Ephemeral });
        return;
      }
      await Member.create({
        guildId: ctx.guildId,
        userId: user.id,
        rankId: refs.rankId || null,
        divisionId: refs.divisionId || null,
      });
      await interaction.reply({ content: `Added member ${user}.`, flags: MessageFlags.Ephemeral });
      return;
    }

    if (!member) {
      await interaction.reply({ content: `${user} is not a member.`, flags: MessageFlags.Ephemeral });
      return;
    }
    if (refs.rankName) member.rankId = refs.rankId;
    if (refs.divisionName) member.divisionId = refs.divisionId;
    await member.save();
    await interaction.reply({ content: `Updated member ${user}.`, flags: MessageFlags.Ephemeral });
  },
};
