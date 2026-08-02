const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { Member } = require('../../models');
const { requireServer, assertPermission, successEmbed } = require('../../utils/serverContext');

module.exports = {
  types: ['department'],
  data: new SlashCommandBuilder()
    .setName('callsign')
    .setDescription('Assign or update department callsigns')
    .addSubcommand((s) => s.setName('set').setDescription('Set callsign')
      .addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true))
      .addStringOption((o) => o.setName('value').setDescription('Callsign').setRequired(true)))
    .addSubcommand((s) => s.setName('clear').setDescription('Clear callsign')
      .addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true)))
    .addSubcommand((s) => s.setName('list').setDescription('List callsigns')),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, ['department']);
    if (!ctx) return;
    const sub = interaction.options.getSubcommand();
    if (sub === 'list') {
      const members = await Member.find({ guildId: ctx.guildId, callsign: { $ne: null } });
      const lines = members.map((m) => `<@${m.userId}> — **${m.callsign}**`);
      await interaction.reply({ embeds: [successEmbed(client, ctx.server, 'Callsigns', lines.join('\n') || 'No callsigns set.')], flags: MessageFlags.Ephemeral });
      return;
    }
    if (!(await assertPermission(interaction, ctx.server, 'callsign', 'manageOrg'))) return;
    const user = interaction.options.getUser('user', true);
    let member = await Member.findOne({ guildId: ctx.guildId, userId: user.id });
    if (!member) member = await Member.create({ guildId: ctx.guildId, userId: user.id });
    if (sub === 'set') {
      member.callsign = interaction.options.getString('value', true).trim();
      await member.save();
      await interaction.reply({ content: `Set callsign **${member.callsign}** for ${user}.`, flags: MessageFlags.Ephemeral });
    } else {
      member.callsign = null;
      await member.save();
      await interaction.reply({ content: `Cleared callsign for ${user}.`, flags: MessageFlags.Ephemeral });
    }
  },
};
