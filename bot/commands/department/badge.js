const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { Member } = require('../../models');
const { requireServer, assertPermission, successEmbed } = require('../../utils/serverContext');

module.exports = {
  types: ['department'],
  data: new SlashCommandBuilder()
    .setName('badge')
    .setDescription('Assign or update department badge numbers')
    .addSubcommand((s) => s.setName('set').setDescription('Set badge')
      .addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true))
      .addStringOption((o) => o.setName('number').setDescription('Badge number').setRequired(true)))
    .addSubcommand((s) => s.setName('clear').setDescription('Clear badge')
      .addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true)))
    .addSubcommand((s) => s.setName('list').setDescription('List badges')),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, ['department']);
    if (!ctx) return;
    const sub = interaction.options.getSubcommand();
    if (sub === 'list') {
      const members = await Member.find({ guildId: ctx.guildId, badge: { $ne: null } });
      const lines = members.map((m) => `<@${m.userId}> — **${m.badge}**`);
      await interaction.reply({ embeds: [successEmbed(client, ctx.server, 'Badges', lines.join('\n') || 'No badges assigned.')], flags: MessageFlags.Ephemeral });
      return;
    }
    if (!(await assertPermission(interaction, ctx.server, 'badge', 'manageOrg'))) return;
    const user = interaction.options.getUser('user', true);
    let member = await Member.findOne({ guildId: ctx.guildId, userId: user.id });
    if (!member) member = await Member.create({ guildId: ctx.guildId, userId: user.id });
    if (sub === 'set') {
      member.badge = interaction.options.getString('number', true).trim();
      await member.save();
      await interaction.reply({ content: `Set badge **${member.badge}** for ${user}.`, flags: MessageFlags.Ephemeral });
    } else {
      member.badge = null;
      await member.save();
      await interaction.reply({ content: `Cleared badge for ${user}.`, flags: MessageFlags.Ephemeral });
    }
  },
};
