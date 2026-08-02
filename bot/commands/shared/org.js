const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { Member, Rank, Division, Territory, BusinessLicense } = require('../../models');
const { requireServer, assertPermission, successEmbed } = require('../../utils/serverContext');

module.exports = {
  types: ['shared'],
  data: new SlashCommandBuilder()
    .setName('org')
    .setDescription('Show or update organization info')
    .addSubcommand((s) => s.setName('info').setDescription('Show organization overview'))
    .addSubcommand((s) =>
      s
        .setName('name')
        .setDescription('Set organization name')
        .addStringOption((o) => o.setName('value').setDescription('Name').setRequired(true))
    ),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, 'any');
    if (!ctx) return;
    const sub = interaction.options.getSubcommand();

    if (sub === 'name') {
      if (!(await assertPermission(interaction, ctx.server, 'org', 'manageOrg'))) return;
      ctx.server.name = interaction.options.getString('value', true).trim();
      await ctx.server.save();
      await interaction.reply({
        content: `Organization name set to **${ctx.server.name}**.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const { guildId, server } = ctx;
    const [members, ranks, divisions, territories, licenses] = await Promise.all([
      Member.countDocuments({ guildId }),
      Rank.countDocuments({ guildId }),
      Division.countDocuments({ guildId }),
      Territory.countDocuments({ guildId }),
      BusinessLicense.countDocuments({ guildId }),
    ]);

    await interaction.reply({
      embeds: [
        successEmbed(
          client,
          server,
          server.name || 'Organization',
          [
            `Type: **${server.type}**`,
            `Members: **${members}** · Ranks: **${ranks}** · Divisions: **${divisions}**`,
            server.type === 'gang' ? `Territories: **${territories}**` : null,
            server.type === 'business' ? `Licenses/Permits: **${licenses}**` : null,
          ]
            .filter(Boolean)
            .join('\n')
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};
